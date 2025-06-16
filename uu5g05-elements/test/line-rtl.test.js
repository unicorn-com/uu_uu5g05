import { Line } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";
import { addMatcherToHaveLineShape } from "./internal/line-tools.js";

addMatcherToHaveLineShape();

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Line, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Line", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("border-top-width")).toBe("1px");
    expect(element).toHaveLineShape(["light", "building", "common"]);
    expect(Test.screen.getByTestId("component-1")).toBeInTheDocument();
    expect(elementStyle.getPropertyValue("margin")).toBe("0px");
  });

  it("checks margin property is properly passed", async () => {
    const margin = 4;
    const { element } = await setup({ margin });

    const contentStyle = window.getComputedStyle(element);

    expect(contentStyle.getPropertyValue("margin")).toBe(`${margin}px`);
  });

  it("checks colorScheme = green is properly shown", async () => {
    const colorScheme = "green";
    const props = { colorScheme };
    const { element } = await setup(props);

    expect(element).toHaveLineShape(["light", colorScheme, "common"]);
  });

  it.each(["common", "highlighted", "distinct", "subdued"])(
    "checks significance = %s is properly shown",
    async (significance) => {
      const props = { significance };
      const { element } = await setup(props);

      expect(element).toHaveLineShape(["light", "building", significance]);
    },
  );

  it.each([
    ["horizontal", "top"],
    ["vertical", "left"],
  ])("checks direction = %s is properly shown", async (direction, border) => {
    const props = { direction };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue(`border-${border}-width`)).toBe("1px");
  });
});
