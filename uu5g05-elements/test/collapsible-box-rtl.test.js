import { CollapsibleBox } from "uu5g05-elements";
import { VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    children: "Test",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(CollapsibleBox, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.CollapsibleBox", () => {
  VisualComponent.testProperties(setup);

  it("checks collapsed is properly shown", async () => {
    const props = { collapsed: true };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("overflow")).toBe("hidden");
    expect(elementStyle.getPropertyValue("height")).toBe("0px");
  });

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(0);
  });
});
