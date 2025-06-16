const { testInputProperties } = require("./input-component/test-input-properties");
const { screen } = require("./internal/testing-library.js");
const { setup } = require("./visual-component/setup");

const InputComponent = {
  testProperties: testInputProperties,
  async setup(...args) {
    const { props, ...api } = await setup(...args);

    let input;
    try {
      input = screen.getByTestId(props.testId + "-field");
    } catch (e) {
      input = screen.getByTestId(props.testId);
    }

    return { ...api, props, input };
  },
};

module.exports = { InputComponent };
