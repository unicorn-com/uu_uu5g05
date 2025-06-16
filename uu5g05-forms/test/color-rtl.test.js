import { Fragment } from "uu5g05";
import { Form, Color } from "uu5g05-forms";
import { Test, InputComponent, FormInputComponent, VisualComponent } from "uu5g05-test";
import { withInputController } from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await FormInputComponent.setup(
    withInputController(Color),
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

describe("Uu5Forms.Color", () => {
  InputComponent.testProperties(setup, {
    defaultWidth: "100%",
    skipProps: ["type", "value", "readOnly", "placeholder", "onChange", "required"],
  });

  FormInputComponent.testProperties(setup, { skipProps: ["label"] });
  FormInputComponent.testExtensionInputProperties(setup);
  VisualComponent.testProperties(setup, { excludes: "disabled" });

  it("checks iconOpen is properly shown", async () => {
    const { user, input } = await setup({ iconOpen: "uugds-chevron-up" });

    await user.click(input);

    expect(Test.screen.getByTestId("icon-right")).toHaveClass("uugds-chevron-up");
  });

  it("checks iconClosed is properly shown", async () => {
    await setup({ iconClosed: "uugds-chevron-down" });

    expect(Test.screen.getByTestId("icon-right")).toHaveClass("uugds-chevron-down");
  });

  it("checks onChange is properly called", async () => {
    const handleChange = jest.fn();
    const { user, input } = await setup({ onChange: handleChange });

    await user.click(input);
    await user.click(Test.screen.getByTitle("blue (#2196F3)"));

    expect(handleChange).toBeCalledTimes(1);
  });

  it("checks value is properly shown", async () => {
    await setup({ value: "rgb(239, 83, 80)" });

    const inputBox = Test.screen.getByRole("combobox");
    const elementStyle = window.getComputedStyle(inputBox.firstChild);

    expect(elementStyle.getPropertyValue("background")).toBe("rgb(239, 83, 80)");
  });

  it("checks valueType = object is properly shown", async () => {
    const handleChange = jest.fn();
    const { user, input } = await setup({
      onChange: handleChange,
      value: { colorScheme: "green" },
      valueType: "object",
    });

    await user.click(input);
    await user.click(Test.screen.getByTitle("blue (#2196F3)"));

    const color = handleChange.mock.lastCall[0]?.data.value;

    expect(color).toMatchObject({ colorScheme: "blue" });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("checks valueType = colorScheme is properly shown", async () => {
    const handleChange = jest.fn();
    const { user, input } = await setup({ onChange: handleChange, value: "green", valueType: "colorScheme" });

    await user.click(input);
    await user.click(Test.screen.getByTitle("blue"));

    const color = handleChange.mock.lastCall[0]?.data;

    expect(color).toMatchObject({ value: "blue" });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("checks valueType = cssColor is properly shown", async () => {
    const handleChange = jest.fn();
    const { user, input } = await setup({ onChange: handleChange, value: "rgb(33, 150, 243)", valueType: "cssColor" });

    await user.click(input);
    await user.click(Test.screen.getByTitle("blue (#2196F3)"));

    const color = handleChange.mock.lastCall[0]?.data;

    expect(color).toMatchObject({ value: "#2196F3" });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("checks displayShade is properly shown", async () => {
    const { user, input } = await setup({ displayShade: true });

    await user.click(input);
    await user.click(Test.screen.getByTitle("blue (#2196F3)"));

    expect(Test.screen.getByTestId("shade-palette")).toBeInTheDocument();
  });

  it("checks displayOpacity is properly shown", async () => {
    const { user, input } = await setup({ displayOpacity: true });

    await user.click(input);
    await user.click(Test.screen.getByTitle("blue (#2196F3)"));

    expect(Test.screen.getByTestId("opacity-palette")).toBeInTheDocument();
  });

  it("checks displayCustomColor is properly shown", async () => {
    const { user, input } = await setup({ displayCustomColor: true });

    await user.click(input);
    const inputElement = Test.screen.getByRole("textbox", { type: "text" });
    await user.type(inputElement, "F44336[Tab]");

    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveValue("F44336");
  });

  it("checks label property is properly shown", async () => {
    const label = "Test label";
    const props = { label };
    await setup(props);

    expect(Test.screen.getByText(label)).toBeVisible();
  });
});
