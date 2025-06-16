// this file decides whether to use legacy act fn (from React 16) or new one (from @testing-library/react)
// (some of our classes must work with both of them, depending on which React is currently loaded, e.g. session mocks)
const React = require("react");
let act;
if (parseInt(React.version) <= 16) {
  act = require("../enzyme/core.js").act;
} else {
  act = require("./testing-library.js").act;
}

module.exports = { act };
