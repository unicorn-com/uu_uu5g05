const fs = require("fs");
const path = require("path");

// !!! Banner .ejs files must be using ES5 and there are no polyfills ready yet at that stage
//     so "startsWith()", ..., wouldn't work in IE.
// !!! .min.ejs file is not auto-generated. It must be updated manually.

const cdng01BaseUri = "https://cdn.plus4u.net/";
const cdng02BaseUri = "https://cdng02.plus4u.net/b686718ad49d3ec4d88936576cd830c2/";

let banners = {};
let uu_i18ng01CdnVersion;
let uu_gdsg01UnicornCdnVersion;

function getBanner(isMinified, filename) {
  if (banners[isMinified] === undefined) {
    banners[isMinified] = fs.readFileSync(
      path.join(__dirname, "build", "banner" + (isMinified ? ".min" : "") + ".ejs"),
      "utf-8",
    );
  }

  let pkg = require("../package.json");
  if (uu_i18ng01CdnVersion === undefined) {
    let uu_i18ng01VersionSpec = (pkg.dependencies || {})["uu_i18ng01"] || "";
    let uu_i18ng01VersionMatch = uu_i18ng01VersionSpec.match(/^([^]?)(\d+)\.\d+\.\d+(-.*)?$/);
    if (!uu_i18ng01VersionMatch) return console.error("ERROR Unable to detect uu_i18ng01 version."); // TODO Throw when possible (if we throw here, the exception gets eaten and build freezes :-/).
    uu_i18ng01CdnVersion = uu_i18ng01VersionMatch[2] + ".x";
  }
  if (uu_gdsg01UnicornCdnVersion === undefined) {
    let uu_gdsg01UnicornVersionSpec = (pkg.dependencies || {})["uu_gdsg01-unicorn"] || "";
    let uu_gdsg01UnicornVersionMatch = uu_gdsg01UnicornVersionSpec.match(/^([^]?)(\d+)\.\d+\.\d+(-.*)?$/);
    if (!uu_gdsg01UnicornVersionMatch) return console.error("ERROR Unable to detect uu_gdsg01-unicorn version."); // TODO Throw when possible (if we throw here, the exception gets eaten and build freezes :-/).
    uu_gdsg01UnicornCdnVersion = uu_gdsg01UnicornVersionMatch[2] + ".x";
  }

  return replaceExpressions(banners[isMinified], {
    NAME_REGEXP: filename.replace(/[.?*+^$[\]\\(){}|]/g, "\\$&").replace(/(\\\.min)?\\\.js$/, "(?:\\.min)?\\.js"),
    VERSION: pkg.version,
    MAJOR_VERSION: pkg.version.replace(/\..*/, ""),
    CDNG01_BASE_URI: cdng01BaseUri,
    CDNG02_BASE_URI: cdng02BaseUri,
    GDS_CDN_PATH: `uu-gdsg01/${uu_gdsg01UnicornCdnVersion}/uu_gdsg01-unicorn.min.js`,
    UU_I18NG01_CDN_PATH: `uu-i18ng01/${uu_i18ng01CdnVersion}/uu_i18ng01.min.js`,
  });
}

function replaceExpressions(text, map) {
  return text.replace(/<%=\s*(.*?)\s*%>/g, (m, g) => map[g]);
}

module.exports = function ({ filename }, licenseComment) {
  let match = filename.match(/^uu5g05(?:-[^.]*)?(\.min)?\.js$/);
  if (!match) return licenseComment;
  let isMinified = !!match[1];
  let content = getBanner(isMinified, filename);
  return licenseComment + "\n" + content;
};
