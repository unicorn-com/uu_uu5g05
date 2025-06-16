import { GridTemplate } from "uu5g05-elements";
import { VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    templateAreas: `boxA, boxB, boxC, boxD`,
    contentMap: {
      boxA: "test",
      boxB: "test",
      boxC: "test",
      boxD: "test",
    },
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(GridTemplate, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.GridTemplate", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("display")).toBe("grid");
    expect(elementStyle.getPropertyValue("grid-template-rows")).toBe("");
    expect(elementStyle.getPropertyValue("grid-template-columns")).toBe("repeat(1, 1fr)");
    expect(element).toHaveGdsSpacing("column-gap", ["adaptive", "normal", "c"]);
    expect(element).toHaveGdsSpacing("row-gap", ["adaptive", "normal", "c"]);
    expect(elementStyle.getPropertyValue("justify-items")).toBe("");
    expect(elementStyle.getPropertyValue("align-items")).toBe("");
    expect(elementStyle.getPropertyValue("justify-content")).toBe("");
    expect(elementStyle.getPropertyValue("align-content")).toBe("");
    expect(elementStyle.getPropertyValue("grid-auto-flow")).toBe("");
    expect(elementStyle.getPropertyValue("justify-self")).toBe("");
    expect(elementStyle.getPropertyValue("align-self")).toBe("");
  });

  it.each([
    ["block", "grid"],
    ["inline", "inline-grid"],
  ])("checks display = %s is properly shown", async (display, value) => {
    const props = { display };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("display")).toBe(value);
  });

  it("checks templateRows is properly shown", async () => {
    const templateRows = "50px 100px";
    const props = { templateRows };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("grid-template-rows")).toBe(templateRows);
  });

  it("checks templateColumns is properly shown", async () => {
    const templateColumns = "repeat(2, 1fr)";
    const props = { templateColumns };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("grid-template-columns")).toBe(templateColumns);
  });

  it("checks rowGap is properly shown", async () => {
    const rowGap = 12;
    const props = { rowGap };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("row-gap")).toBe(`${rowGap}px`);
  });

  it("checks columnGap is properly shown", async () => {
    const columnGap = 12;
    const props = { columnGap };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("column-gap")).toBe(`${columnGap}px`);
  });

  it.each(["start", "end", "center", "stretch"])("checks justifyItems = %s is properly shown", async (justifyItems) => {
    const props = { justifyItems };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("justify-items")).toBe(justifyItems);
  });

  it.each(["start", "end", "center", "stretch", "baseline"])(
    "checks alignItems = %s is properly shown",
    async (alignItems) => {
      const props = { alignItems };
      const { element } = await setup(props);
      const elementStyle = window.getComputedStyle(element);

      expect(elementStyle.getPropertyValue("align-items")).toBe(alignItems);
    },
  );

  it.each(["start", "end", "center", "stretch", "space-around", "space-between", "space-evenly"])(
    "checks justifyContent = %s is properly shown",
    async (justifyContent) => {
      const props = { justifyContent };
      const { element } = await setup(props);
      const elementStyle = window.getComputedStyle(element);

      expect(elementStyle.getPropertyValue("justify-content")).toBe(justifyContent);
    },
  );

  it.each(["start", "end", "center", "stretch", "space-around", "space-between", "space-evenly"])(
    "checks alignContent = %s is properly shown",
    async (alignContent) => {
      const props = { alignContent };
      const { element } = await setup(props);
      const elementStyle = window.getComputedStyle(element);

      expect(elementStyle.getPropertyValue("align-content")).toBe(alignContent);
    },
  );

  it("checks contentStyleMap is properly shown", async () => {
    const contentStyleMap = {
      boxA: { justifySelf: "flex-end", display: "flex", gap: 8 },
    };
    const props = { contentStyleMap };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element.firstChild);

    expect(elementStyle.getPropertyValue("justify-self")).toBe("flex-end");
    expect(elementStyle.getPropertyValue("display")).toBe("flex");
    expect(elementStyle.getPropertyValue("gap")).toBe("8px");
  });

  it.each(["row", "column", "dense"])("checks flow = %s is properly shown", async (flow) => {
    const props = { flow };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("grid-auto-flow")).toBe(flow);
  });
});
