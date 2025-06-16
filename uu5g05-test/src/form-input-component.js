const { testFormInputProperties } = require("./form-input-component/test-form-input-properties");
const { testExtensionInputProperties } = require("./form-input-component/test-extension-input-properties");
const { screen } = require("./internal/testing-library.js");
const { setup } = require("./visual-component/setup");

const FormInputComponent = {
  testProperties: testFormInputProperties,
  async setup(...args) {
    const { props, ...api } = await setup(...args);

    let input;
    try {
      input = screen.getByTestId(props.testId + "-input-field");
    } catch (e) {
      input = screen.getByTestId(props.testId + "-input");
    }

    return { ...api, props, input };
  },
  testExtensionInputProperties,
};

module.exports = { FormInputComponent };
