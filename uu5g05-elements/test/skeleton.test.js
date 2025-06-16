import { Skeleton, UuGds } from "uu5g05-elements";
import { VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Skeleton, { ...getDefaultProps(), ...props }, opts);
}
const boxSizing = Object.keys(UuGds.getValue(["SizingPalette", "box"]));

describe("Uu5Elements.Skeleton", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("aspectRatio")).toBe("");
    expect(elementStyle.getPropertyValue("height")).toBe("36px");
    expect(elementStyle.getPropertyValue("width")).toBe("");
    expect(element).toHaveGdsRadius(["box", "none"]);
    expect(element).toHaveGdsSize(["spot", "basic", "m"]);
  });

  it.each(["400px", "50%", "8em"])("checks width = %s is properly set to root element", async (width) => {
    const props = { width };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);
    expect(elementStyle.getPropertyValue("width")).toBe(width);
  });

  it.each(["400px", "50%", "8em"])("checks height = %s is properly set to root element", async (height) => {
    const props = { height };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);
    expect(elementStyle.getPropertyValue("height")).toBe(height);
  });

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive", "full"],
    { height: 100, width: 100 },
    "box",
  );

  it.each(["xs", "s", "m", "l"])("checks size = %s is properly set to root element", async (size) => {
    const props = { size };
    const { element } = await setup(props);

    expect(element).toHaveGdsSize(["spot", "basic", size]);
  });

  //TODO aspect-ratio not in the elementStyles
  it.each(boxSizing)("checks aspectRatio = %s with is properly set to root element", async (aspectRatio) => {
    const props = { aspectRatio, width: 100 };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("width")).toBe("100px");
  });

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(0);
  });
});
