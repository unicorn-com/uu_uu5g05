const PROPS_CONFIG = {
  id: {
    values: ["test-id"],
  },
  className: {
    values: ["test-classname"],
  },
  style: {
    values: [{ margin: 8 }],
  },
  disabled: {
    values: [false, true],
  },
  hidden: {
    values: [false, true],
  },
  elementAttrs: {
    values: [{ data: { test: "data-test-value" } }],
  },
  // NOTE elementRef is tested automatically too, but not via snapshot.
  // elementRef: {},
  fullTextSearchPriority: {
    values: [0],
  },
  noPrint: {
    values: [false, true],
  },
  nestingLevel: {
    values: ["box", "inline"],
  },
};

module.exports = PROPS_CONFIG;
