 const devkitConfig = require("uu5devkitg01-plugin/src/config/eslint.config.js");
const testingLibrary = require("eslint-plugin-testing-library");
const jestDom = require("eslint-plugin-jest-dom");

module.exports = [...devkitConfig, testingLibrary.configs["flat/react"], jestDom.configs["flat/recommended"]];