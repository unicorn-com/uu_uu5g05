import { Grid } from "uu5g05-elements";
import { VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return { children: "Test" };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Grid.Item, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Grid.Item", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("grid-area")).toBe("");
    expect(elementStyle.getPropertyValue("grid-column")).toBe("");
    expect(elementStyle.getPropertyValue("grid-row")).toBe("");
    expect(elementStyle.getPropertyValue("justify-self")).toBe("");
    expect(elementStyle.getPropertyValue("align-self")).toBe("");
  });

  it("checks gridArea is properly shown", async () => {
    const gridArea = "areaName";
    const props = { gridArea };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("grid-area")).toBe(gridArea);
  });

  it("checks colSpan is properly shown", async () => {
    const colSpan = 12;
    const props = { colSpan };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("grid-column")).toBe(`span ${colSpan}`);
  });

  it("checks rowSpan is properly shown", async () => {
    const rowSpan = 12;
    const props = { rowSpan };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("grid-row")).toBe(`span ${rowSpan}`);
  });

  it.each(["start", "end", "center", "stretch"])("checks justifySelf = %s is properly shown", async (justifySelf) => {
    const props = { justifySelf };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("justify-self")).toBe(justifySelf);
  });

  it.each(["start", "end", "center", "stretch"])("checks justifySelf = %s is properly shown", async (alignSelf) => {
    const props = { alignSelf };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("align-self")).toBe(alignSelf);
  });

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(0);
  });
});
