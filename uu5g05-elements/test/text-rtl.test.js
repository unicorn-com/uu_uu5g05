import { Text } from "uu5g05-elements";
import { VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    children: "Test",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Text, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Text", () => {
  VisualComponent.testProperties(setup);

  VisualComponent.testColorScheme(setup, "text", "green", "common", false);

  VisualComponent.testSignificance(setup, "text", "building", ["common", "subdued"], false);

  it.each([
    ["default", "hero"],
    ["default", "lead"],
    ["default", "broad"],
    ["default", "notice"],
    ["default", "distinct"],
  ])("checks category = expose segment = %s and type = %s are properly shown", async (segment, type) => {
    const props = { category: "expose", segment, type };
    const { element } = await setup(props);

    expect(element).toHaveGdsTypography(["expose", segment, type]);
  });

  it.each([
    ["title", "main"],
    ["title", "major"],
    ["title", "common"],
    ["title", "minor"],
    ["title", "micro"],
  ])("checks category = interface segment = %s and type = %s are properly shown", async (segment, type) => {
    const props = { category: "interface", segment, type };
    const { element } = await setup(props);

    expect(element).toHaveGdsTypography(["interface", segment, type]);
  });

  it.each([
    ["heading", "h1"],
    ["heading", "h2"],
    ["heading", "h3"],
    ["heading", "h4"],
    ["heading", "h5"],
  ])("checks category = story segment = %s and type = %s are properly shown", async (segment, type) => {
    const props = { category: "story", segment, type };
    const { element } = await setup(props);

    expect(element).toHaveGdsTypography(["story", segment, type]);
  });

  it.each(["interactive", "content"])("checks bold is properly shown when segment = %s", async (segment) => {
    const props = { bold: true, category: "interface", segment, type: "medium" };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("font-weight")).toBe("bold");
  });

  it.each(["interactive", "content"])("checks italic is properly shown when segment = %s", async (segment) => {
    const props = { italic: true, category: "interface", segment, type: "medium" };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("font-style")).toBe("italic");
  });

  VisualComponent.testBackground(setup, "text", "neutral", "common", false);

  VisualComponent.testTooltip(setup);

  VisualComponent.testTooltipLsi(setup);

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(0);
  });
});
