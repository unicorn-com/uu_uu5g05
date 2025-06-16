import { Fragment } from "uu5g05";
import { Form, FormText } from "uu5g05-forms";
import { Test, InputComponent, FormInputComponent } from "uu5g05-test";

const DEFAULT_NAME = "test-name";

function getDefaultProps() {
  return {
    label: "Test label",
    name: DEFAULT_NAME,
  };
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  // TODO MFA - Ask Ondrej why are we removing connection between label
  // and input for pending, disabled or readOnly in with-form-input.js (line 135)?
  const inputAriaLabel = "input-aria-label";

  const api = await FormInputComponent.setup(
    FormText,
    { ...getDefaultProps(), ...props, inputAttrs: { ...props.inputAttrs, "aria-label": inputAriaLabel } },
    {
      Wrapper: ({ children }) => (
        <Wrapper>
          <Form>{children}</Form>
        </Wrapper>
      ),
    },
  );

  const input = Test.screen.getByLabelText(inputAriaLabel);
  return { ...api, input };
}

describe("Uu5Forms.FormText", () => {
  // TODO MFA Disabled is not properly passed to root element
  // testVisualProperties(setup);
  InputComponent.testProperties(setup, {
    valuePropName: "initialValue",
    defaultWidth: "100%",
    defaultName: DEFAULT_NAME,
    defaultValue: "",
  });

  FormInputComponent.testProperties(setup, { skipFeedbackTest: true });

  it.each([
    ["error", ["meaning", "negative", "main"]],
    ["warning", ["meaning", "warning", "main"]],
  ])("checks property feedback = %s as text is properly shown", async (feedback, inputColorPath) => {
    const message = "Test message";
    const minLength = 18;
    const validationMap = {
      minLength: {
        message: { en: message },
        feedback,
      },
    };

    const props = { minLength, validationMap };
    const { user, input } = await setup(props);

    await user.type(input, "12[Tab]");

    const messageElement = Test.screen.getByText(message);
    expect(messageElement).toBeVisible();
    // TODO MFA How the message color is set?
    //expect(messageElement).toHaveGdsColor(inputColorPath);
    expect(input).toHaveGdsColor(inputColorPath, "border-color");
  });
});
