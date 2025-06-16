// npm run buildOffline
// npm run buildOffline -- false      - won't run `npm run build` (i.e. it'll simply zip already-built stuff in target/ and in other relevant folders)

// zip contents:
// ./browser/uu5g05/*            - content of uu5g05 CDN pack (includes uu5g05-elements, ...)
// ./browser/uu_gdsg01-unicorn/* - font
// ./browser/uu5stringg01/*
// ./browser/uu_i18ng01/*
// ./browser/@mdi/font/          - mdi icons
// ./browser/demo.html           - demo
// ./npm/*.tgz                   - relevant .tgz, e.g. uu5g05-1.2.3.tgz, uu_i18ng01-1.0.1.tgz, ... (e.g. for create-react-app)

const ChildProcess = require("child_process");
const Fs = require("fs");
const Https = require("https");
const Path = require("path");
const Archiver = require("archiver");

function loadLibInfo(name, fromPath) {
  let pkgPath = require.resolve(name + "/package.json", { paths: [Path.resolve(fromPath)] });
  let pkg = JSON.parse(Fs.readFileSync(pkgPath, "utf-8"));
  return { name, pkg: pkg, baseDir: Path.dirname(pkgPath) };
}

async function generateOfflineVersion(doBuild = true) {
  if (doBuild) {
    console.log("Running `npm run package`...");
    let { status } = ChildProcess.spawnSync("npm run package", { shell: true, stdio: "inherit" });
    if (status) process.exit(status);
  }

  console.log("Generating offline version of uu5g05...");
  let { version } = JSON.parse(Fs.readFileSync("package.json", "utf-8"));
  let outputFile = `target/uu5g05-${version}-offline.zip`;

  // find out existing libraries (uu5g05, uu5g05-elements, ...) as well as devkit-built externals (uu5stringg01, ...)
  let uuAppJson = JSON.parse(Fs.readFileSync("uuapp.json", "utf-8"));
  let libNames = Object.keys(uuAppJson).filter((name) => Fs.existsSync(name) && Fs.statSync(name).isDirectory()); // uu5g05, uu5g05-elements, ...
  let externalUu5Libs = []; // uu5stringg01, ... (auto-detected)
  for (let libName of libNames) {
    let pkg = JSON.parse(Fs.readFileSync(Path.join(libName, "package.json"), "utf-8"));
    let { dependencies } = pkg;
    let deps = Object.keys(dependencies || {});
    if (libName === "uu5g05") deps.push("uu5loaderg01");
    if (libName === "uu5g05-elements") deps.push("uu_gdsg01-unicorn"); // we have it in devDependencies, which we don't want to iterate
    for (let depName of deps) {
      if (libNames.includes(depName) || externalUu5Libs.some((it) => it.name === depName)) continue;
      if (!depName.match(/g\d\d/)) continue; // assume that uu5libs have generation in name
      let libInfo = loadLibInfo(depName, libName);
      externalUu5Libs.push(libInfo);
    }
  }

  await zip(outputFile, async (zipArchive) => {
    // add CDN packs into browser/ folder (whole uu5g05, uu5stringg01, ...
    zipArchive.directory("target/dist/", "browser/uu5g05");
    externalUu5Libs.forEach(({ name, baseDir }) => {
      zipArchive.directory(Path.join(baseDir, "dist"), "browser/" + name);
    });

    // add @mdi/font, react, react-dom, prop-types into browser/ folder as well
    let toAdd = {
      "@mdi/font": { resolveFromDir: "uu5g05", targetMap: { css: "css", fonts: "fonts", LICENSE: "LICENSE" } },
      react: { resolveFromDir: "uu5g05", targetMap: { umd: "_root" } },
      "react-dom": { resolveFromDir: "uu5g05", targetMap: { umd: "_root" } },
      "prop-types": {
        resolveFromDir: "uu5g05",
        targetMap: { "prop-types.js": "prop-types.js", "prop-types.min.js": "prop-types.min.js" },
      },
    };
    for (let [libName, { resolveFromDir, targetMap }] of Object.entries(toAdd)) {
      let libInfo = loadLibInfo(libName, resolveFromDir);
      for (let [source, target] of Object.entries(targetMap)) {
        let sourcePath = Path.join(libInfo.baseDir, source);
        let fileStats = Fs.statSync(sourcePath, { throwIfNoEntry: false });
        if (!fileStats || (!fileStats.isDirectory() && !fileStats.isFile())) {
          throw new Error(
            `${libInfo.name} module was supposed to contain ${source} file/folder but it does not! Revise the module version or this tool.`
          );
        }
        let targetPath = `/browser/${libInfo.name}${target === "_root" ? "" : "/" + target}`;
        if (fileStats.isDirectory()) zipArchive.directory(sourcePath, targetPath);
        else zipArchive.file(sourcePath, { name: targetPath });
      }
    }

    // add demo
    zipArchive.file("tools/build-offline-demo.html", { name: "browser/demo.html" });

    // add relevant *.tgz files into npm/ folder
    libNames.forEach((name) => {
      let tgzPath = Path.join(name, "target", name + "-" + version + ".tgz");
      zipArchive.file(tgzPath, { name: `npm/${name}-${version}.tgz` });
    });
    console.log("  getting .tgz of deps: " + externalUu5Libs.map((it) => it.name).join(", "));
    let asyncWorkList = externalUu5Libs.map(async (it) => {
      let { stdout, stderr, status } = ChildProcess.spawnSync(
        "npm",
        ["show", it.name + "@" + it.pkg.version, "--json"],
        { shell: true }
      );
      if (status) {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
        throw new Error("Unable to find out URL for downloading " + it.name + "@" + it.pkg.version);
      }
      let url, errorToThrow;
      try {
        url = JSON.parse(stdout)?.dist?.tarball;
      } catch (e) {
        errorToThrow = e;
      }
      if (!url) {
        console.error("Unable to find out URL for downloading " + it.name + "@" + it.pkg.version);
        throw errorToThrow || new Error("Build failed.");
      }
      let tgzContent = await download(url);
      zipArchive.append(tgzContent, { name: `npm/${it.name}-${it.pkg.version}.tgz` });
    });
    await Promise.all(asyncWorkList);
  });

  console.log("  " + outputFile);
  return outputFile;
}

async function download(url) {
  return new Promise((resolve, reject) => {
    Https.get(url, (res) => {
      if (res.statusCode >= 300) return reject(new Error("Got status " + res.statusCode + " while downloading " + url));
      let chunks = [];
      res.on("data", (data) => chunks.push(data));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", (e) => reject(e));
  });
}

async function zip(outputPath, builderFn) {
  let output = Fs.createWriteStream(outputPath);
  return new Promise(function (resolve, reject) {
    let archive = Archiver("zip", { zlib: { level: 9 } });
    archive.on("error", reject);
    output.on("error", reject);
    output.on("close", resolve);
    archive.pipe(output);
    Promise.resolve()
      .then(() => builderFn(archive))
      .then(() => archive.finalize(), reject);
  });
}

if (!process.env.UU5G05_SKIP_AUTORUN_OFFLINE_BUILD) {
  let runWithBuild = process.argv.slice(-1)[0] !== "false";
  generateOfflineVersion(runWithBuild);
}

module.exports = { generateOfflineVersion };
