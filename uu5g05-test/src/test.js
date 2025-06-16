const { render, Wrapper } = require("./internal/render.js");
const legacyAPI = require("./enzyme.js");
const testingLibrary = require("./internal/testing-library.js");
const { createHookComponent } = require("./internal/create-hook-component.js");

function renderHook(hook, ...args) {
  const fn = hook.name === "" ? testingLibrary.renderHook : legacyAPI.renderHook;
  return fn(hook, ...args);
}

const Test = {
  ...testingLibrary,
  render,
  Wrapper,
  renderHook,
  createHookComponent,
};

module.exports = { Test };
