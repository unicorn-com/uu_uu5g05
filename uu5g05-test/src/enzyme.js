// NOTE Intentionally not using `const { initTest, ...coreRest } = require("./core.js")` because if we then
// do `module.exports = { ...coreRest, etc }` then it causes Intellisense in VS Code not to work (for developers
// that use uu5g05-test in their own libraries / apps).
const { initTest, mount, shallow, waitUntilCalled, waitUntilCalledTimes, waitWhile, act } = require("./enzyme/core.js");

initTest();

const { setInputValue } = require("./enzyme/set-input-value.js");
const { testProperty, testProperties } = require("./enzyme/test-property.js");

const { renderHook, initHookRenderer } = require("./enzyme/render-hook.js");

/* Deprecated in favour of new RTL API */
module.exports = {
  renderHook,
  initHookRenderer,
  mount, // from Enzyme
  shallow, // from Enzyme
  act, // from Enzyme
  waitUntilCalled, // Replaced by waitFor
  waitUntilCalledTimes, // Replaced by waitFor
  waitWhile, // Replaced by waitFor
  setInputValue, // based on Enzyme
  testProperties, // based on Enzyme
  testProperty, // based on Enzyme
};
