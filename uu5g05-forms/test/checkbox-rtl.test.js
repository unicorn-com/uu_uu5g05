import { Fragment, Utils, BackgroundProvider } from "uu5g05";
import { Form, Checkbox } from "uu5g05-forms";
import { Test, InputComponent, FormInputComponent, VisualComponent } from "uu5g05-test";
import {
  testAutoFocus,
  testOnValidate,
  testOnValidationEnd,
  testOnValidationStart,
  testSignificance,
  testValidateOnMount,
  testValidationRef,
  withInputController,
} from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await FormInputComponent.setup(
    withInputController(Checkbox),
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

describe("Uu5Forms.Checkbox", () => {
  InputComponent.testProperties(setup, {
    defaultWidth: "100%",
    skipProps: [
      "type",
      "name",
      "onChange",
      "placeholder",
      "readOnly",
      "value",
      "required",
      "onFocus",
      "colorScheme",
      "significance",
      "background",
      "autoFocus",
    ],
  });

  FormInputComponent.testProperties(setup, { skipProps: ["feedback", "inputRef"] });
  VisualComponent.testProperties(setup, { excludes: "disabled" });

  testOnValidationStart(setup, { onlyClick: true });
  testOnValidationEnd(setup, { onlyClick: true });
  testOnValidate(setup, undefined, { onlyClick: true });
  testValidateOnMount(setup);
  testValidationRef(setup);

  it("checks default property values", async () => {
    const { input } = await setup();

    expect(input).not.toHaveAttribute("spellcheck");
    expect(input).not.toHaveAttribute("autoComplete");
  });

  it("checks onChange property is properly called", async () => {
    const handleChange = jest.fn();
    const props = { onChange: handleChange };
    const { user, input } = await setup(props);

    await user.click(input);

    expect(handleChange).toBeCalledTimes(1);
  });

  it("checks value is properly shown", async () => {
    await setup({ value: true });

    const checkboxInput = Test.screen.getByRole("checkbox");

    expect(checkboxInput).toHaveAttribute("aria-checked", "true");
  });

  it("checks itemList is properly shown", async () => {
    const itemList = [
      { value: false },
      { value: true, colorScheme: "primary", significance: "distinct", icon: "uugds-check" },
      { value: null, colorScheme: "primary", significance: "distinct", icon: "uugds-minus" },
    ];
    const { user, input } = await setup({ itemList });

    await user.click(input);
    const checkboxInput = Test.screen.getByRole("checkbox");

    expect(checkboxInput.firstChild).toHaveClass("uugds-check");

    await user.click(input);
    expect(checkboxInput.firstChild).toHaveClass("uugds-minus");
  });

  it("checks box property is properly shown", async () => {
    const { input } = await setup({ box: false });

    expect(input).not.toHaveGdsShape(["formElement", "light", "primary", "subdued"]);
  });

  it("checks validateOnChange property is properly working", async () => {
    const handleValidationEnd = jest.fn();
    const props = { onValidationEnd: handleValidationEnd, validateOnChange: true, required: true, value: true };
    const { user, input } = await setup(props);

    await user.click(input);

    expect(handleValidationEnd).toBeCalledTimes(2);
    expect(handleValidationEnd).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ errorList: [expect.objectContaining({ code: "required" })] }),
      }),
    );
  });

  it("checks validationMap property properly overriding default configuration", async () => {
    const handleValidationEnd = jest.fn();
    const validationMap = {
      required: {
        message: { en: "The field is required." },
        feedback: "error",
      },
    };
    const props = {
      validationMap,
      onValidationEnd: handleValidationEnd,
      required: true,
      value: true,
      validateOnChange: true,
    };
    const { user, input } = await setup(props);

    await user.click(input);
    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];

    expect(handleValidationEnd).toHaveBeenCalledTimes(2);
    expect(error).toMatchObject({ code: "required", feedback: "error" });
  });

  it("checks readOnly property is set to input", async () => {
    const { input } = await setup({ readOnly: true });

    expect(input).toHaveAttribute("aria-readonly", "true");
  });

  it("checks required property is set to input", async () => {
    const { input } = await setup({ required: true });

    expect(input).toHaveAttribute("aria-required", "true");
  });

  it("checks onFocus property is properly called", async () => {
    const handleFocus = jest.fn();
    const { user, input } = await setup({ onFocus: handleFocus });

    await user.click(input);

    expect(handleFocus).toBeCalledTimes(1);
  });

  testAutoFocus(setup, { input: true });

  //no hover
  it("checks colorScheme = green is properly shown", async () => {
    const colorScheme = "green";
    await setup({ colorScheme });

    const inputElement = Test.screen.getByRole("checkbox");

    expect(inputElement).toHaveGdsShape(["formElement", "light", colorScheme, "common"], { skipColor: true });
    expect(inputElement).toHaveGdsShape(["text", "light", colorScheme, "common"], { cssReset: false });
  });

  testSignificance(setup, { itemList: ["common", "highlighted", "distinct", "subdued"], colorScheme: "dim" });

  it.each(["light", "dark", "full", "soft"])(
    "checks component has right shape for %s background",
    async (background) => {
      const React = require("react");
      const Wrapper = ({ children }) => React.createElement(BackgroundProvider, { background }, children);
      const { input } = await setup({}, { Wrapper });

      expect(input).toHaveGdsShape(["formElement", background, "primary", "subdued"]);
    },
  );

  it.each([
    ["error", ["formElement", "light", "negative", "distinct"]],
    ["warning", ["formElement", "light", "warning", "distinct"]],
    ["success", ["formElement", "light", "primary", "distinct"]],
  ])("checks property feedback = %s as text is properly shown", async (feedback, inputColorPath) => {
    const message = "Test message";
    const props = { message, feedback };
    const { input } = await setup(props);

    const messageElement = Test.screen.getByText(message);

    expect(messageElement).toBeVisible();
    expect(input).toHaveGdsShape(inputColorPath);
  });

  it("checks inputRef property is properly passed to input element", async () => {
    const inputRef = Utils.Component.createRef();
    const { input, props } = await setup({ inputRef });

    const inputRefName = inputRef.current.getAttribute("data-testid");

    expect(inputRefName).toBe(props.testId + "-input-field");
    expect(inputRefName).toBe(input.getAttribute("data-testid"));
  });
});
