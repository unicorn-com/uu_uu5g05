import { Utils } from "uu5g05";
import { Pending, UuGds } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Pending, { ...getDefaultProps(), ...props }, opts);
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
      if (key !== "backgroundColor") {
        continue;
      }

      // Conversion from camelCase to hypens (e.g. backgroundColor -> background-color)
      const propertyName = key.replace(/([a-z])([A-Z])/g, `$1-$2`).toLowerCase();
      const value = shapeStyle[key];
      let expectedValue = typeof value === "number" ? `${value}px` : value;
      let propertyValue = style.getPropertyValue("color");

      // Normalization
      expectedValue = expectedValue.toLowerCase();
      propertyValue = Utils.Color.toHex(propertyValue);

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

describe("Uu5Elements.Pending", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    await setup();

    expect(Test.screen.queryByRole("alert")).toHaveGdsSize(["spot", "basic", "m"]);
    expect(Test.screen.queryByText(".")).not.toBeInTheDocument();
    expect(Test.screen.queryByRole("alert")).toHaveShape(["ground", "light", "primary", "highlighted"]);
  });

  it.each(["xs", "s", "m", "l", "xl"])("checks size = %s is properly set to root element", async (size) => {
    const props = { size };
    await setup(props);

    expect(Test.screen.queryByRole("alert")).toHaveGdsSize(["spot", "basic", size]);
  });

  it("checks size = max is properly shown", async () => {
    const props = { size: "max" };
    await setup(props);
    const elementStyle = window.getComputedStyle(Test.screen.queryByRole("alert"));

    expect(elementStyle.getPropertyValue("height")).toBe("252px");
  });

  it("checks cssColor is properly shown", async () => {
    const props = { cssColor: "#000" };
    await setup(props);
    const elementStyle = window.getComputedStyle(Test.screen.queryByRole("alert"));

    VisualComponent.colorConvert(elementStyle.color, "#000");
  });

  it("checks imageSrc is properly called", async () => {
    const imageSrc = "https://cdn.plus4u.net/uu-plus4u5g01/4.0.0/assets/img/anonymous.png";
    const props = { size: "max", imageSrc };
    await setup(props);
    expect(Test.screen.queryByRole("img")).toHaveAttribute("src", imageSrc);
  });

  it("checks colorScheme is properly shown", async () => {
    const colorScheme = "green";
    const props = { colorScheme };
    await setup(props);

    expect(Test.screen.queryByRole("alert")).toHaveShape(["ground", "light", colorScheme, "highlighted"]);
  });

  it("checks nestingLevel = inline is properly shown", async () => {
    const props = { nestingLevel: "inline" };
    await setup(props);

    expect(Test.screen.getAllByText(".").length).toEqual(3);
  });

  it("checks children is properly shown", async () => {
    const props = { children: "Test" };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(2);
  });
});
