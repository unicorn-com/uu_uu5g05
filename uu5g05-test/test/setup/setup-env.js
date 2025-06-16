// don't show warning about requestAnimationFrame
// NOTE This must be before any other "require" statements.
// https://reactjs.org/blog/2017/09/26/react-v16.0.html#javascript-environment-requirements
global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function (id) {
  return clearTimeout(id);
};

// jsdom 20.x doesn't export these yet to window, even if NodeJS has them
// https://github.com/jsdom/jsdom/issues/2524
if (typeof TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  Object.assign(global, { TextEncoder, TextDecoder });
}

if (!global.fetch) {
  let { default: fetch, Headers, Request, Response } = require("node-fetch");
  global.fetch = fetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
}

// add mocking of localStorage
require("jest-localstorage-mock");

// support for indexedDb
require("fake-indexeddb/auto");
if (typeof structuredClone === "undefined") {
  global.structuredClone = (a) => {
    return JSON.parse(JSON.stringify(a), function (key, value) {
      if (typeof value === "string" && /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d{1,3})Z$/.test(value)) {
        return new Date(value);
      }
      return value;
    });
  };
}
if (typeof requestIdleCallback !== "function") {
  global.requestIdleCallback = (fn) => setTimeout(fn, 0);
  global.cancelIdleCallback = (id) => clearTimeout(id);
}

// TODO Next major - remove support for enzyme tests entirely.
// initialize Enzyme adapter for React
const React = require("react");
if (parseInt(React.version) <= 16) {
  const Enzyme = require("enzyme");
  const Adapter = require("enzyme-adapter-react-16");
  Enzyme.configure({ adapter: new Adapter() });
}
