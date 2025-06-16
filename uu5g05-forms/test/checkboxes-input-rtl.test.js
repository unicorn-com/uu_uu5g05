import { Fragment, BackgroundProvider } from "uu5g05";
import { Form, Checkboxes } from "uu5g05-forms";
import { Test, InputComponent, VisualComponent } from "uu5g05-test";
import { withInputController, testValidateOnMount, testValidationRef, testAutoFocus } from "./internal/test-tools";

function getDefaultProps() {
  return {
    itemList: [
      { children: "Dog", value: "dog" },
      { children: "Cat", value: "cat" },
    ],
  };
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await InputComponent.setup(
    withInputController(Checkboxes.Input),
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

describe("Uu5Forms.Checkboxes.Input", () => {
  VisualComponent.testProperties(setup);

  it("checks disabled property is set to input", async () => {
    const { input } = await setup({ disabled: true });
    expect(input).toHaveAttribute("disabled", "");
  });

  it("checks readOnly property is set to input", async () => {
    const handleChange = jest.fn();
    const props = {
      onChange: handleChange,
      readOnly: true,
    };
    const { user } = await setup(props);

    await user.click(Test.screen.getByText("Cat"));

    expect(handleChange).toBeCalledTimes(0);
  });

  it("checks required property is set to input", async () => {
    const { input } = await setup({ required: true });

    expect(input).toHaveAttribute("aria-required", "true");
  });

  testAutoFocus(setup);

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

    const checkboxElement = Test.screen.getByRole("checkbox", { name: "Cat" });

    expect(checkboxElement.parentElement).toHaveGdsSize(["spot", "basic", size]);
  });

  it.each(["none", "elementary", "moderate", "expressive", "full"])(
    "checks borderRadius = %s is properly set to root element",
    async (borderRadius) => {
      const { UuGds } = require("uu5g05-elements");

      await setup({ borderRadius });

      const checkboxElement = Test.screen.getByRole("checkbox", { name: "Cat" });

      const size = UuGds.SizingPalette.getValue(["spot", "basic", "m"]);
      expect(checkboxElement.parentElement).toHaveGdsRadius(["spot", borderRadius], { height: size.h });
    },
  );

  it("checks colorScheme = green is properly shown", async () => {
    const colorScheme = "green";
    await setup({ colorScheme, value: ["cat"] });
    const checkboxInput = Test.screen.getByRole("checkbox", { name: "Cat" });

    expect(checkboxInput).toHaveGdsShape(["formElement", "light", colorScheme, "common"], { skipColor: true });
    expect(checkboxInput.parentElement).toHaveGdsShape(["formElement", "light", colorScheme, "distinct"]);
  });

  it.each(["common", "highlighted", "distinct", "subdued"])(
    "checks significance = %s is properly shown",
    async (significance) => {
      await setup({ significance });

      const checkboxInput = Test.screen.getByRole("checkbox", { name: "Cat" });

      expect(checkboxInput.parentElement).toHaveGdsShape(["formElement", "light", "dim", significance]);
    },
  );

  it.each(["light", "dark", "full", "soft"])(
    "checks component has right shape for %s background",
    async (background) => {
      const React = require("react");
      const Wrapper = ({ children }) => React.createElement(BackgroundProvider, { background }, children);
      await setup({}, { Wrapper });

      const checkboxInput = Test.screen.getByRole("checkbox", { name: "Cat" });

      expect(checkboxInput.parentElement).toHaveGdsShape(["text", background, "building", "common"], {
        cssReset: false,
      });
    },
  );

  it("checks onChange property is properly called", async () => {
    const handleChange = jest.fn();
    const props = {
      onChange: handleChange,
    };
    const { user } = await setup(props);

    await user.click(Test.screen.getByText("Cat"));

    expect(handleChange).toBeCalledTimes(1);
  });

  it("checks value is properly shown", async () => {
    await setup({
      value: ["dog"],
    });

    const checkboxInput = Test.screen.getByRole("checkbox", { name: "Dog" });

    expect(checkboxInput).toHaveAttribute("aria-checked", "true");
  });

  it("checks itemList is properly shown", async () => {
    const itemList = [
      { children: "Apple", value: "apple" },
      { children: "Orange", value: "orange" },
    ];
    const { user, input } = await setup({ itemList });

    await user.click(input);
    const checkboxInputApple = Test.screen.getByRole("checkbox", { name: "Apple" });
    const checkboxInputOrange = Test.screen.getByRole("checkbox", { name: "Orange" });

    expect(checkboxInputApple).toBeInTheDocument();
    expect(checkboxInputOrange).toBeInTheDocument();
  });

  testValidateOnMount(setup);
  testValidationRef(setup);

  it("checks onValidate handler is properly called", async () => {
    const handleValidate = jest.fn();
    const props = { onValidate: handleValidate, itemList: [{ children: "Cat", value: "cat" }] };
    const { user } = await setup(props);

    await user.click(Test.screen.getByText("Cat"));
    await user.type(Test.screen.getByText("Cat"), "[Tab][Tab]");

    expect(handleValidate).toHaveBeenCalledTimes(2);
  });

  it("checks onValidationStart handler is properly called", async () => {
    const handleValidationStart = jest.fn();
    const props = { onValidationStart: handleValidationStart, itemList: [{ children: "Cat", value: "cat" }] };
    const { user } = await setup(props);

    await user.click(Test.screen.getByText("Cat"));
    await user.type(Test.screen.getByText("Cat"), "[Tab][Tab]");

    expect(handleValidationStart).toHaveBeenCalledTimes(2);
  });

  it("checks onValidationEnd handler is properly called", async () => {
    const handleValidationEnd = jest.fn();
    const props = {
      onValidationEnd: handleValidationEnd,
      itemList: [{ children: "Cat", value: "cat" }],
    };
    const { user } = await setup(props);

    await user.click(Test.screen.getByText("Cat"));
    await user.type(Test.screen.getByText("Cat"), "[Tab][Tab]");

    expect(handleValidationEnd).toHaveBeenCalledTimes(2);
  });

  it("checks validateOnChange property is properly working", async () => {
    const handleValidationEnd = jest.fn();
    const props = {
      onValidationEnd: handleValidationEnd,
      validateOnChange: true,
      required: true,
      value: ["dog"],
    };
    const { user } = await setup(props);

    await user.click(Test.screen.getByText("Dog"));

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
      validateOnChange: true,
      onValidationEnd: handleValidationEnd,
      required: true,
      value: ["dog"],
    };
    const { user } = await setup(props);

    await user.click(Test.screen.getByText("Dog"));

    const error = handleValidationEnd.mock.lastCall[0]?.data?.errorList[0];

    expect(error).toMatchObject({ code: "required", feedback: "error" });
  });
});
