async function run() {
  let pkg = require("../package.json");
  let reactInstalledVersion = require("react/package.json").version;
  let reactSpecifier = pkg.dependencies["react"];
  if (reactInstalledVersion !== reactSpecifier.replace(/^[~^]/, "")) {
    console.error(
      `ERROR Your installed React version (${reactInstalledVersion}) is different than the one specified in package.json (${reactSpecifier}). They must be the same / compatible (to be able to build uu5g05's jsx-runtime properly).`,
    );
    process.exit(1);
  }
}

run();
