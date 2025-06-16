const React = require("react");
const { render: rtlRender, queries: rtlQueries } = require("./testing-library.js");
const uu5Queries = require("../queries/queries.js");

// The default fallback for missing AlertBus is not working properly.
// The alert are not automatically unmounted and lives between isolated tests!
// If fallback will be fixed the Wrapper could be removed.
let AlertBus;
const Wrapper = ({ children }) => {
  if (AlertBus === undefined) {
    try {
      ({ AlertBus } = require("uu5g05-elements"));
    } catch (e) {
      if (e?.code !== "MODULE_NOT_FOUND") throw e;
    }
    AlertBus ??= null;
  }
  return AlertBus ? React.createElement(AlertBus, null, children) : (children ?? null);
};

function render(ui, options = {}) {
  // Some custom queries are needed because of bugs in ARIA implementation to uu5 components.
  // If bugs will be fixed the custom queries could be removed.
  const { queries, ...otherOpts } = options;
  const mergedQueries = { ...rtlQueries, ...uu5Queries, ...queries };
  return rtlRender(ui, { queries: mergedQueries, wrapper: Wrapper, ...otherOpts });
}

module.exports = { Wrapper, render };
