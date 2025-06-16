import { Panel } from "uu5g05-elements";
import { VisualComponent, Test } from "uu5g05-test";

function getDefaultProps() {
  return {
    header: "",
    children: "Test",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Panel, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Panel", () => {
  VisualComponent.testProperties(setup);

  it("checks open is properly shown", async () => {
    const { element } = await setup({ open: false });

    expect(element).toHaveAttribute("aria-expanded", "false");
  });

  it("checks open = true is properly shown", async () => {
    const props = { open: true };
    const { element } = await setup(props);

    const collapsibleBox = Test.screen.getByTestId("collapsible-box");
    const elementStyle = window.getComputedStyle(collapsibleBox);

    expect(elementStyle.getPropertyValue("overflow")).not.toBe("hidden");
    expect(elementStyle.getPropertyValue("height")).not.toBe("0px");
    expect(element).toHaveAttribute("aria-expanded", "true");
  });

  it("checks colorScheme is properly shown", async () => {
    const { element } = await setup({ colorScheme: "primary" });

    expect(element).toHaveGdsShape(["interactiveItem", "light", "primary", "common"]);
  });

  it.each(["common", "highlighted", "distinct", "subdued"])(
    "checks significance = %s is properly shown",
    async (significance) => {
      const { element } = await setup({ significance, header: "Header", children: "Children", open: true });

      const headerElement = Test.screen.getByText("Header");
      const contentElement = Test.screen.getByText("Children");

      expect(element).toHaveGdsShape([
        "interactiveItem",
        "light",
        "building",
        significance === "distinct" ? "subdued" : "common",
      ]);
      expect(headerElement).toHaveGdsShape([
        "interactiveItem",
        "light",
        "building",
        significance === "common" || significance === "highlighted" ? "distinct" : "common",
      ]);
      expect(contentElement).toHaveGdsShape([
        "interactiveItem",
        "light",
        "building",
        significance === "highlighted" ? "distinct" : "common",
      ]);
    },
  );

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childElementCount).toBe(2);
  });
});
