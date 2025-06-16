import { Fragment } from "uu5g05";
import { Form, Text } from "uu5g05-forms";
import { Test, InputComponent, VisualComponent } from "uu5g05-test";
import {
  withInputController,
  testAutoComplete,
  testPattern,
  testOnValidationStart,
  testOnValidationEnd,
  testOnValidate,
  testValidateOnChange,
  testValidateOnMount,
  testValidationRef,
  testMinLength,
  testMaxLength,
  testSpellCheck,
} from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  // TODO MFA - Ask Ondrej why are we removing connection between label
  // and input for pending, disabled or readOnly in with-form-input.js (line 135)?

  const api = await InputComponent.setup(
    withInputController(Text.Input),
    {
      ...getDefaultProps(),
      ...props,
    },
    {
      Wrapper: ({ children }) => (
        <Wrapper>
          <Form>{children}</Form>
        </Wrapper>
      ),
    },
  );

  return api;
}

describe("Uu5Forms.Text.Input", () => {
  // TODO MFA Fix disabled property and uncomment
  // testVisualProperties(setup);

  InputComponent.testProperties(setup, {
    defaultValue: "",
    defaultWidth: "240px",
  });
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    expect(Test.screen.getByRole("textbox")).toBeVisible();
    expect(element).not.toHaveAttribute("spellcheck");
    expect(element).not.toHaveAttribute("autocomplete");
  });

  testPattern(setup, "^[A-Z]+$", "pattern");
  testSpellCheck(setup);
  testMinLength(setup, { skipMessageTest: true });
  testMaxLength(setup, { skipMessageTest: true });
  testAutoComplete(setup);
  testOnValidationStart(setup);
  testOnValidationEnd(setup);
  testOnValidate(setup);
  testValidateOnChange(setup);
  testValidateOnMount(setup);
  testValidationRef(setup);

  it("checks validationMap property properly overriding default configuration", async () => {
    const handleValidationEnd = jest.fn();
    const minLength = 18;
    const validationMap = {
      minLength: {
        message: { en: "The age must be at least %d years." },
        feedback: "warning",
      },
    };
    const props = { ...getDefaultProps(), minLength, validationMap, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    await user.type(input, "12[Tab]");
    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];

    expect(error).toMatchObject({ code: "minLength", feedback: "warning" });
  });
});
