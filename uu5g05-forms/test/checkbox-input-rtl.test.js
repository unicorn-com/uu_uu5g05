import { Fragment, BackgroundProvider } from "uu5g05";
import { Form, Checkbox } from "uu5g05-forms";
import { Test, InputComponent, VisualComponent } from "uu5g05-test";
import { testSignificance, withInputController } from "./internal/test-tools";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, { Wrapper = Fragment } = {}) {
  const api = await InputComponent.setup(
    withInputController(Checkbox.Input),
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

describe("Uu5Forms.Checkbox.Input", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, input } = await setup();

    const inputStyle = window.getComputedStyle(input);

    expect(input).not.toHaveAttribute("value");
    expect(input).not.toHaveAttribute("name");
    expect(input).toHaveGdsSize(["inline", "emphasized"]);
    expect(input).not.toHaveAttribute("disabled");
    expect(input).not.toHaveAttribute("readOnly");
    expect(inputStyle.getPropertyValue("border-radius")).toBe("min(calc(0.15 * 1.5em), 8px)");
    expect(document.activeElement.getAttribute("name")).not.toEqual(props.name);
  });

  it("checks readOnly property is set to input", async () => {
    const { input } = await setup({ readOnly: true });
    expect(input).toHaveAttribute("aria-readonly", "true");
  });

  it("checks autoFocus property sets focus to input", async () => {
    const id = "input-1";
    await setup({ autoFocus: true, id });

    expect(document.activeElement.getAttribute("id")).toEqual(id);
  });

  it("checks onFocus property is properly called", async () => {
    const handleFocus = jest.fn();
    const { user, input } = await setup({ onFocus: handleFocus });

    await user.click(input);

    expect(handleFocus).toBeCalledTimes(1);
  });

  it("checks onBlur property is properly called", async () => {
    const handleBlur = jest.fn();
    const props = { onBlur: handleBlur, autoFocus: true };
    const { user } = await setup(props);

    await user.keyboard("[Tab]");

    expect(handleBlur).toBeCalledTimes(1);
  });

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly set to input", async (size) => {
    const props = { size };
    const { input } = await setup(props);

    expect(input).toHaveGdsSize(["inline", "emphasized"]);
  });

  it.each(["none", "elementary", "moderate", "expressive", "full"])(
    "checks borderRadius = %s is properly set to root element",
    async (borderRadius) => {
      const { input } = await setup({ borderRadius });

      const inputStyle = window.getComputedStyle(input);
      const radius = inputStyle.borderRadius;

      expect(typeof radius).toBe("string");
    },
  );

  it("checks colorScheme = green is properly shown", async () => {
    const colorScheme = "green";
    const { input } = await setup({ colorScheme });

    expect(input).toHaveGdsShape(["formElement", "light", colorScheme, "common"], { skipColor: true });
    expect(input).toHaveGdsShape(["text", "light", colorScheme, "common"], { cssReset: false });
  });

  testSignificance(setup, { itemList: ["common", "highlighted"], colorScheme: "building" });

  it.each(["light", "dark", "full", "soft"])(
    "checks component has right shape for %s background",
    async (background) => {
      const React = require("react");

      const Wrapper = ({ children }) => React.createElement(BackgroundProvider, { background }, children);
      const { input } = await setup({}, { Wrapper });

      expect(input).toHaveGdsShape(["formElement", background, "building", "common"], { skipColor: true });
      expect(input).toHaveGdsShape(["text", background, "building", "common"], { cssReset: false });
    },
  );

  it("checks icon is properly shown", async () => {
    const { input } = await setup({ icon: "uugds-pencil" });

    expect(input.firstChild).toHaveClass("uugds-pencil");
  });

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClick: handleClick };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("checkbox"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
