import { Fragment, Utils, BackgroundProvider } from "uu5g05";
import { Form, Radios } from "uu5g05-forms";
import { Test, FormInputComponent, VisualComponent } from "uu5g05-test";
import { testAutoFocus, withInputController } from "./internal/test-tools";

function getDefaultProps() {
  return {
    itemList: [
      { children: "Yes", value: "yes" },
      { children: "No", value: "no" },
    ],
  };
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await FormInputComponent.setup(
    withInputController(Radios),
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

describe("Uu5Forms.Radios", () => {
  FormInputComponent.testProperties(setup, { skipProps: ["feedback", "inputRef", "label"] });
  VisualComponent.testProperties(setup, { excludes: "disabled" });

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
      validateOnChange: true,
      onValidationEnd: handleValidationEnd,
      required: true,
    };
    const { user } = await setup(props);

    await user.keyboard("[Tab][Tab][Tab][Tab]");

    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];

    expect(error).toMatchObject({ code: "required", feedback: "error" });
    expect(Test.screen.getByText("The field is required.")).toBeVisible();
  });

  it("checks disabled property is set to input", async () => {
    const { input } = await setup({ disabled: true });
    expect(input.disabled || input.matches("[disabled] *")).toBeTruthy();
  });

  it("checks readOnly property is set to input", async () => {
    const handleChange = jest.fn();
    const props = {
      onChange: handleChange,
      readOnly: true,
    };
    const { user } = await setup(props);

    await user.click(Test.screen.getByText("No"));

    expect(handleChange).toBeCalledTimes(0);
  });

  it("checks required property is set to input", async () => {
    const { input } = await setup({ required: true });

    expect(input).toHaveAttribute("aria-required", "true");
  });

  testAutoFocus(setup, { input: true });

  it("checks onFocus property is properly called", async () => {
    const handleFocus = jest.fn();
    const { user, input } = await setup({ onFocus: handleFocus });

    await user.click(input);

    expect(handleFocus).toBeCalledTimes(1);
  });

  it("checks onBlur is properly called", async () => {
    const handleBlur = jest.fn();
    const { user } = await setup({ onBlur: handleBlur, itemList: [{ children: "Cat", value: "cat" }] });

    await user.click(Test.screen.getByText("Cat"));
    await user.type(Test.screen.getByText("Cat"), "[Tab][Tab]");

    expect(handleBlur).toBeCalledTimes(1);
  });

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly set to input", async (size) => {
    const props = { size };
    await setup(props);

    const radioElement = Test.screen.getByRole("radio", { name: "No" });

    expect(radioElement.parentElement).toHaveGdsSize(["spot", "basic", size]);
  });

  it.each(["none", "elementary", "moderate", "expressive", "full"])(
    "checks borderRadius = %s is properly set to root element",
    async (borderRadius) => {
      const { UuGds } = require("uu5g05-elements");

      await setup({ borderRadius });

      const radioElement = Test.screen.getByRole("radio", { name: "No" });

      const size = UuGds.SizingPalette.getValue(["spot", "basic", "m"]);
      expect(radioElement.parentElement).toHaveGdsRadius(["spot", borderRadius], { height: size.h });
    },
  );

  it("checks colorScheme = green is properly shown", async () => {
    const colorScheme = "green";
    await setup({ colorScheme, value: "no" });
    const radioInput = Test.screen.getByRole("radio", { name: "No" });

    expect(radioInput).toHaveGdsShape(["formElement", "light", colorScheme, "common"], { skipColor: true });
    expect(radioInput.parentElement).toHaveGdsShape(["formElement", "light", colorScheme, "distinct"]);
  });

  it.each(["common", "highlighted", "distinct", "subdued"])(
    "checks significance = %s is properly shown",
    async (significance) => {
      await setup({ significance });

      const radioInput = Test.screen.getByRole("radio", { name: "No" });

      expect(radioInput.parentElement).toHaveGdsShape(["formElement", "light", "dim", significance]);
    },
  );

  it.each(["light", "dark", "full", "soft"])(
    "checks component has right shape for %s background",
    async (background) => {
      const React = require("react");
      const Wrapper = ({ children }) => React.createElement(BackgroundProvider, { background }, children);
      await setup({}, { Wrapper });

      const radioInput = Test.screen.getByRole("radio", { name: "No" });

      expect(radioInput.parentElement).toHaveGdsShape(["text", background, "building", "common"], {
        cssReset: false,
      });
    },
  );
  it("checks label property is properly shown", async () => {
    const label = "Test label";
    const props = { label };
    await setup(props);

    expect(Test.screen.getByText(label)).toBeVisible();
  });

  it.each([
    ["error", ["formElement", "light", "negative", "distinct"]],
    ["warning", ["formElement", "light", "warning", "distinct"]],
    ["success", ["formElement", "light", "primary", "distinct"]],
  ])("checks property feedback = %s as text is properly shown", async (feedback, inputColorPath) => {
    const message = "Test message";
    const props = { message, feedback };
    await setup(props);

    const messageElement = Test.screen.getByText(message);
    const radioInput = Test.screen.getByRole("radio", { name: "Yes" });

    expect(messageElement).toBeVisible();
    expect(radioInput.parentElement).toHaveGdsShape(inputColorPath);
  });

  it("checks inputRef property is properly passed to input element", async () => {
    const inputRef = Utils.Component.createRef();
    const { input, props } = await setup({ inputRef });

    const inputRefName = inputRef.current.getAttribute("data-testid");

    expect(inputRefName).toBe(props.testId + "-input-field");
    expect(inputRefName).toBe(input.getAttribute("data-testid"));
  });
});
