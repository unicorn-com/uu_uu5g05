const React = require("react");
const { screen } = require("../internal/testing-library.js");

const DEFAULT_SIZE_PATH = ["spot", "basic", "m"];

function testInputProperties(
  setup,
  {
    valuePropName = "value",
    defaultWidth = "",
    defaultValue = undefined,
    defaultName = undefined,
    defaultType = "text",
    validValue = "test-value-1",
    skipProps = [],
  } = {},
) {
  const { BackgroundProvider } = require("uu5g05");
  const { UuGds } = require("uu5g05-elements");

  it("checks default property values", async () => {
    const { props, input } = await setup();

    const inputStyle = window.getComputedStyle(input);
    const size = UuGds.SizingPalette.getValue(DEFAULT_SIZE_PATH);

    if (defaultValue !== undefined) {
      expect(input).toHaveAttribute("value", defaultValue);
    } else {
      expect(input).not.toHaveAttribute("value");
    }

    if (defaultName !== undefined) {
      expect(input).toHaveAttribute("name", defaultName);
    } else {
      expect(input).not.toHaveAttribute("name");
    }

    !skipProps.includes("type") && expect(input).toHaveAttribute("type", defaultType);
    !skipProps.includes("size") && expect(input).toHaveGdsSize(DEFAULT_SIZE_PATH);
    expect(input).not.toHaveAttribute("disabled");
    expect(input).not.toHaveAttribute("readOnly");
    expect(input).not.toHaveAttribute("required");
    expect(input).not.toHaveAttribute("placeholder");
    expect(input).toHaveGdsRadius(["spot", "moderate"], { height: size.h });
    expect(inputStyle.getPropertyValue("width")).toBe(defaultWidth);
    expect(document.activeElement.getAttribute("name")).not.toEqual(props.name);
  });

  !skipProps.includes("name") &&
    it("checks name property is set to input", async () => {
      const name = "input-1";
      const { input } = await setup({ name });
      expect(input).toHaveAttribute("name", name);
    });

  !skipProps.includes("value") &&
    it(`checks ${valuePropName} property is set to input`, async () => {
      await setup({ [valuePropName]: validValue });
      expect(screen.getByDisplayValue(validValue)).toBeVisible();
    });

  !skipProps.includes("disabled") &&
    it("checks disabled property is set to input", async () => {
      const { input } = await setup({ disabled: true });
      expect(input).toBeDefined();
      expect(input.disabled || input.matches("[disabled] *")).toBeTruthy();
    });

  !skipProps.includes("readOnly") &&
    it("checks readOnly property is set to input", async () => {
      const { input } = await setup({ readOnly: true });
      expect(input).toHaveAttribute("readOnly", "");
    });

  !skipProps.includes("required") &&
    it("checks required property is set to input", async () => {
      const { input } = await setup({ required: true });
      expect(input).toHaveAttribute("required", "");
    });

  !skipProps.includes("autoFocus") &&
    it("checks autoFocus property sets focus to input", async () => {
      const name = "input-1";
      await setup({ autoFocus: true, name });

      expect(document.activeElement.getAttribute("name")).toEqual(name);
    });

  !skipProps.includes("placeholder") &&
    it("checks placeholder property is shown in input", async () => {
      const placeholder = "placeholder-1";
      await setup({ placeholder });

      expect(screen.getByPlaceholderText(placeholder)).toBeVisible();
    });

  !skipProps.includes("onFocus") &&
    it("checks onFocus property is properly called", async () => {
      const handleFocus = jest.fn();
      const { user, input } = await setup({ onFocus: handleFocus, [valuePropName]: validValue });

      await user.click(input);

      expect(handleFocus).toBeCalledTimes(1);
      // TODO MFA FormText and Input returns different event
      // expect(handleFocus.mock.lastCall[0]).toMatchObject({
      //   data: { name: props.name, value: props[valuePropName] },
      // });
    });

  !skipProps.includes("onChange") &&
    it("checks onChange property is properly called", async () => {
      const handleChange = jest.fn();
      const props = { onChange: handleChange, [valuePropName]: validValue };
      const { user, input } = await setup(props);

      const newValue = "2";
      await user.type(input, newValue, { initialSelectionStart: 0, initialSelectionEnd: 0 });

      expect(handleChange).toBeCalledTimes(1);
      expect(handleChange.mock.lastCall[0]).toMatchObject({
        // TODO MFA FormText returns name but Input doesn't
        //data: { name: props.name, value: typeof validValue === "number" ? Number(newValue + props[valuePropName]) : newValue + props[valuePropName] },
        data: {
          value:
            typeof validValue === "number" ? Number(newValue + props[valuePropName]) : newValue + props[valuePropName],
        },
      });
    });

  !skipProps.includes("onBlur") &&
    it("checks onBlur property is properly called", async () => {
      const handleBlur = jest.fn();
      const props = { onBlur: handleBlur, autoFocus: true, [valuePropName]: validValue };
      const { user } = await setup(props);

      await user.keyboard("[Tab]");

      expect(handleBlur).toBeCalledTimes(1);
      // TODO MFA FormText and Input have different event!
      // expect(handleBlur.mock.lastCall[0]).toMatchObject({
      //   data: { name: props.name, value: validValue },
      // });
    });

  !skipProps.includes("size") &&
    it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly set to input", async (size) => {
      const props = { size };
      const { input } = await setup(props);

      expect(input).toHaveGdsSize(["spot", "basic", size]);
    });

  !skipProps.includes("borderRadius") &&
    it.each(["none", "elementary", "moderate", "expressive", "full"])(
      "checks borderRadius = %s is properly set to root element",
      async (borderRadius) => {
        const { input } = await setup({ borderRadius });

        const size = UuGds.SizingPalette.getValue(DEFAULT_SIZE_PATH);
        expect(input).toHaveGdsRadius(["spot", borderRadius], { height: size.h });
      },
    );

  !skipProps.includes("colorScheme") &&
    it("checks colorScheme = green is properly shown", async () => {
      const colorScheme = "green";
      const { input } = await setup({ colorScheme });

      expect(input).toHaveGdsShape(["formElement", "light", colorScheme, "common"]);
    });

  !skipProps.includes("significance") &&
    it.each(["common", "highlighted", "distinct", "subdued"])(
      "checks significance = %s is properly shown",
      async (significance) => {
        const { input } = await setup({ significance });

        expect(input).toHaveGdsShape(["formElement", "light", "building", significance]);
      },
    );

  !skipProps.includes("background") &&
    it.each(["light", "dark", "full", "soft"])(
      "checks component has right shape for %s background",
      async (background) => {
        const Wrapper = ({ children }) => React.createElement(BackgroundProvider, { background }, children);
        const { input } = await setup({}, { Wrapper });

        expect(input).toHaveGdsShape(["formElement", background, "building", "common"]);
      },
    );
}

module.exports = { testInputProperties };
