// NOTE We need "afterEach" hook of Session to be registered
// before "afterEach" hook of legacy API (so that during tests the legacy's one is run first and Session's
// is run second - legacy's one performs unmounts and some components need to have Session still
// available at that time).
require("./session.js");
require("./internal/mock-app-oidc.js");
require("./internal/mock-app-client.js");

const legacyAPI = require("./enzyme.js");

require("./matchers/matchers.js");

const { VisualComponent } = require("./visual-component.js");
const { InputComponent } = require("./input-component.js");
const { FormInputComponent } = require("./form-input-component.js");
const { FormItemComponent } = require("./form-item-component.js");
const { Session } = require("./session.js");
const { Test } = require("./test.js");
const { Config } = require("./config.js");
const { Utils } = require("./utils.js");

// partial workaround for getByRole() being really slow (the slowness is actually caused by jsdom's getComputedStyle
// calculations which traverse upwards for inherited fields such as "visibility")
// https://github.com/jsdom/jsdom/issues/3234   (should be improved in jsdom >= 21.x)
// https://github.com/testing-library/dom-testing-library/issues/552
Test.configure({
  defaultHidden: true,
});

module.exports = {
  ...legacyAPI, //deprecated
  wait: Utils.wait, //deprecated
  omitConsoleLogs: Utils.omitConsoleLogs, //deprecated
  VisualComponent,
  InputComponent,
  FormInputComponent,
  FormItemComponent,
  Utils,
  Test,
  Session,
  Config,
};
