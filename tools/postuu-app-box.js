const ChildProcess = require("child_process");
const Fs = require("fs");
const Path = require("path");

const BUILD_OFFLINE_BINARY_CODE = "uu5g05Offline";
const EXPORTED_LSI_BINARY_CODE = "lsiExport";

async function upload(file, code, overwrite) {
  if (Fs.existsSync("target/.devkit-token")) {
    Fs.copyFileSync("target/.devkit-token", "uu5g05/target/.devkit-token");
  }
  let origCwd = process.cwd();
  process.chdir("uu5g05");
  try {
    let UploadFile = require("./doc-cmd/core/upload-file.js");
    await UploadFile.File.upload(file, code, overwrite);
  } finally {
    process.chdir(origCwd);
  }
}

async function buildOfflineAndUpload() {
  process.env.UU5G05_SKIP_AUTORUN_OFFLINE_BUILD = "1";
  let { generateOfflineVersion } = require("./build-offline.js");
  let outputFile = Path.resolve(await generateOfflineVersion(false));

  console.log("Uploading offline version...");
  await upload(outputFile, BUILD_OFFLINE_BINARY_CODE, true);
}

async function exportLsisAndUpload() {
  console.log("Running uu5LsiExport...");
  let result = ChildProcess.spawnSync("npm", ["run", "uu5LsiExport"], { shell: true, stdio: "pipe" });
  let stdout = result.stdout.toString();
  let stderr = result.stderr.toString();
  if (stderr) {
    console.log(stdout);
    console.error(stderr);
  } else {
    let warnings = stdout
      .split("\n")
      .filter((it) => /warn/i.test(it))
      .filter((it) => !/uu5g05[\\/]src[\\/]components[\\/]lsi.js|uu5g05[\\/]src[\\/]hocs[\\/]with-lsi.js/.test(it));
    if (warnings.length > 0) {
      console.log("There were some warnings, run `npm run uu5LsiExport` for full output.\n" + warnings.join("\n"));
    }
  }
  if (result.status !== 0) throw new Error("Exporting lsi-s failed (ended with non-zero exit status).");

  console.log("Uploading exported lsi-s...");
  const outputFile = Path.resolve("target/lsi-export.csv");
  await upload(outputFile, EXPORTED_LSI_BINARY_CODE, true);
}

async function run() {
  let { version } = require("../uuapp.json");
  if (typeof version === "string" && version.match(/^\d+\.\d+\.\d+$/)) {
    await buildOfflineAndUpload();
    await exportLsisAndUpload();
  }
}

run();
