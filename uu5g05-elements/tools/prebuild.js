const fs = require("fs");

async function run() {
  // ensure that uu5g05-elements-gds is in externals (in case we performed build previously and terminated it
  // via Ctrl+C midway)
  let pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  if (!pkg.uuBuildSettings.externals["uu5g05-elements-gds"]) {
    pkg.uuBuildSettings.externals["uu5g05-elements-gds"] = "Uu5ElementsGds";
  }
  if (!pkg.uuBuildSettings.packs.some((it) => it.libraryGlobalVariable === "Uu5ElementsGds")) {
    pkg.uuBuildSettings.packs.push({
      entryPoints: ["gds.js"],
      libraryGlobalVariable: "Uu5ElementsGds",
      outputFile: "uu5g05-elements-gds.js",
    });
  }
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n", "utf-8");
}

run();
