// set language to "en", timezone to Europe/Prague (requires NodeJS >= 13.x to have effect)
if (!process.env.TZ) process.env.TZ = "Europe/Prague";
beforeEach(() => {
  // NOTE require() is inside of beforeEach so that tests have option to load a module before uu5g05, e.g. uu5loaderg01.
  const { Utils, Environment } = require("uu5g05");
  Utils.Language.setLanguage(Environment._constants.defaultLanguage);
});

// initialize uu5Environment (to mutable object so that tests such as logger-factory.test.js
// can change environment values via global variable)
window.uu5Environment ??= {};

// add .toJSON method to the result of getBoundingClientRect()
let origGetBoundingClientRect;
beforeAll(() => {
  origGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    let result = origGetBoundingClientRect.apply(this, arguments);
    return { ...result, toJSON: () => result };
  };
});
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = origGetBoundingClientRect;
});

let origGenerateId;
beforeEach(() => {
  const { Utils } = require("uu5g05");
  origGenerateId = Utils.String.generateId;
  let counter = 0;
  Utils.String.generateId = () => "aabbcc" + counter++;
  Utils.String.generateId.orig = origGenerateId;
});
afterEach(() => {
  const { Utils } = require("uu5g05");
  Utils.String.generateId = origGenerateId;
});
