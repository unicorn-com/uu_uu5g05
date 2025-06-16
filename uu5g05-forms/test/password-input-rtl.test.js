import { Fragment } from "uu5g05";
import { Form, Password } from "uu5g05-forms";
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
} from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await InputComponent.setup(
    withInputController(Password.Input),
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

describe("Uu5Forms.Password.Input", () => {
  InputComponent.testProperties(setup, {
    defaultWidth: "100%",
    defaultType: "password",
  });
  VisualComponent.testProperties(setup, { excludes: ["elementRef", "elementAttrs"] });

  it("checks elementAttrs property is properly passed", async () => {
    const testId = "component-1";
    const elementAttrs = { "data-test-attribute": testId };
    const { input } = await setup({ elementAttrs });

    expect(input).toHaveAttribute("data-test-attribute", testId);
  });

  it("checks elementRef property is properly passed", async () => {
    const { Utils } = require("uu5g05");

    const id = "id-1";
    const elementRef = Utils.Component.createRef();
    const { element } = await setup({ id, elementRef });

    expect(element).toHaveAttribute("id", id);
    expect(elementRef.current?.tagName).toBe("INPUT");
  });

  testPattern(setup, "^[A-Z]+$", "pattern");
  testMinLength(setup, { skipMessageTest: true });
  testMaxLength(setup, { skipMessageTest: true });
  testAutoComplete(setup);
  it("checks revealable property is properly shown", async () => {
    const { user } = await setup({ revealable: true, value: "a" });

    const icon = Test.screen.getByTestId("icon-right");

    await user.click(icon);

    expect(Test.screen.getByRole("textbox")).toHaveAttribute("type", "text");
    expect(Test.screen.getByRole("textbox")).toHaveAttribute("value", "a");
  });

  it("checks revealableIconOn property is properly shown", async () => {
    const { user } = await setup({ revealable: true, revealableIconOn: "uugds-check", value: "a" });

    const icon = Test.screen.getByTestId("icon-right");

    await user.click(icon);

    expect(icon).toHaveClass("uugds-check");
  });

  it("checks revealableIconOff property is properly shown", async () => {
    await setup({ revealable: true, revealableIconOff: "uugds-check", value: "a" });

    const icon = Test.screen.getByTestId("icon-right");

    expect(icon).toHaveClass("uugds-check");
  });

  testOnValidationStart(setup);
  testOnValidationEnd(setup);
  testOnValidate(setup, "a");
  testValidateOnChange(setup);
  testValidateOnMount(setup);
  testValidationRef(setup);

  it("checks validationMap property properly overriding default configuration", async () => {
    const handleValidationEnd = jest.fn();
    const minLength = 18;
    const validationMap = {
      minLength: {
        message: { en: "Bad async value. It must be longer than %d chars." },
        feedback: "error",
      },
    };
    const props = { ...getDefaultProps(), minLength, validationMap, onValidationEnd: handleValidationEnd };
    const { user, input } = await setup(props);

    await user.type(input, "12[Tab]");
    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];

    expect(error).toMatchObject({ code: "minLength", feedback: "error" });
  });
});
