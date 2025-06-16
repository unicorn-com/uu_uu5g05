import { BackgroundProvider, Utils } from "uu5g05";
import { HighlightedBox, UuGds } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(HighlightedBox, { ...getDefaultProps(), ...props }, opts);
}

expect.extend({
  toHaveShape(element, path, state = "default", cssReset = true) {
    const style = window.getComputedStyle(element);
    const shape = UuGds.Shape.getValue(path);

    if (!shape) {
      return {
        message: () => `The UuGds.Shape doesn't contains item with path [${path}]`,
        pass: false,
      };
    }

    const shapeStyle = UuGds.Shape.getStateStyles(shape[state], cssReset);
    for (const key of Object.keys(shapeStyle)) {
      if (key === "color") {
        continue;
      }
      // Conversion from camelCase to hypens (e.g. backgroundColor -> background-color)
      const propertyName = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      const value = shapeStyle[key];
      let expectedValue = typeof value === "number" ? `${value}px` : value;
      let propertyValue = style.getPropertyValue(propertyName);

      if (/^rgba?\(/.test(propertyValue)) {
        propertyValue = Utils.Color.toHex(propertyValue);
        expectedValue = Utils.Color.toHex(expectedValue);
      }

      // Normalization
      expectedValue = expectedValue.toLowerCase();
      propertyValue = propertyValue.toLowerCase();

      if (propertyValue === expectedValue) {
        continue;
      } else {
        return {
          message: () =>
            `expected CSS property ${propertyName} to be "${expectedValue}" but received "${propertyValue}"`,
          pass: false,
        };
      }
    }

    return {
      message: () => `expected UuGds.Shape not to be [${path}]`,
      pass: true,
    };
  },
});

describe("Uu5Elements.HighlightedBox", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, element } = await setup();

    expect(element).toHaveGdsRadius(["box", "moderate"]);
    expect(element).toHaveShape(["interactiveElement", "light", "important", "common"]);
    expect(Test.screen.queryByTestId("controls")).not.toBeInTheDocument();
    expect(Test.screen.getByTestId("icon")).toBeInTheDocument();
    expect(Test.screen.queryByRole("button", { name: props.children })).not.toBeInTheDocument();
  });

  it("checks onClose is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClose: handleClick };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.children }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks controlList property is properly shown and usable", async () => {
    const controlName = "Test";
    const handleClick = jest.fn();
    const controlList = [{ children: controlName, onClick: handleClick }];
    const { user } = await setup({ controlList });

    await user.click(Test.screen.getByRole("button", { name: controlName }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks icon is properly shown", async () => {
    const icon = "uugds-favorites";
    const props = { icon };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  it("checks icon without children is properly shown", async () => {
    const icon = "uugds-pencil";
    const props = { icon, children: undefined };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  VisualComponent.testBorderRadius(setup, ["none", "elementary", "moderate", "expressive", "full"], undefined, "box");

  it.each(["common", "highlighted", "distinct", "subdued"])(
    "checks significance = %s is properly shown",
    async (significance) => {
      const props = { significance };
      const { element } = await setup(props);

      expect(element).toHaveShape(["interactiveElement", "light", "important", significance]);
    },
  );

  it("checks colorScheme is properly shown", async () => {
    const props = { colorScheme: "primary" };
    const { element } = await setup(props);

    expect(element).toHaveShape(["interactiveElement", "light", "primary", "common"]);
  });

  it.each([
    ["right", "padding-inline-start", "d"],
    ["bottom", "margin-top", "c"],
  ])("checks controlPosition = %s is properly shown", async (controlPosition, property, value) => {
    const controlList = [
      { children: "Dismiss", significance: "distinct" },
      { children: "Confirm", significance: "highlighted" },
    ];
    const props = { controlList, controlPosition };
    await setup(props);
    const controls = Test.screen.getByTestId("controls");

    expect(controls).toHaveGdsSpacing(property, ["adaptive", "normal", value]);
  });

  it.each(["light", "dark", "full", "soft"])(
    "checks component has right effect for %s background",
    async (background) => {
      const Wrapper = ({ children }) => <BackgroundProvider background={background}>{children}</BackgroundProvider>;
      const { element } = await setup(undefined, { Wrapper });

      expect(element).toHaveShape(["interactiveElement", background, "important", "common"]);
    },
  );

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(2);
  });
});
