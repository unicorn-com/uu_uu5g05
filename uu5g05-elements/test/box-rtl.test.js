import { Box, UuGds } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    children: "Test",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Box, { ...getDefaultProps(), ...props }, opts);
}
const boxSizing = Object.keys(UuGds.getValue(["SizingPalette", "box"]));

describe("Uu5Elements.Box", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("height")).toBe("");
    expect(elementStyle.getPropertyValue("width")).toBe("");
    expect(element).toHaveGdsShape(["ground", "light", "building", "common"]);
    expect(elementStyle.getPropertyValue("aspectRatio")).toBe("");
    expect(element).toHaveGdsRadius(["box", "none"]);
    expect(Test.screen.queryByRole("button", { name: props.children })).not.toBeInTheDocument();
  });

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClick: handleClick };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.children }));

    expect(handleClick).toHaveBeenCalledTimes(1);
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

  it.each(["s", "m", "l"])("checks size = %s with aspectRatio = 1x2 is properly set to root element", async (size) => {
    const props = { size, aspectRatio: "1x2" };
    const { element } = await setup(props);

    expect(element).toHaveGdsSize(["box", "1x2", size]);
  });

  it.each(boxSizing)("checks aspectRatio = %s with is properly set to root element", async (aspectRatio) => {
    const props = { aspectRatio };
    const { element } = await setup(props);

    expect(element).toHaveGdsSize(["box", aspectRatio, "m"]);
  });

  VisualComponent.testSignificance(setup, "ground", "building", ["common", "highlighted", "distinct", "subdued"]);

  VisualComponent.testColorScheme(setup, "ground", "primary", "common");

  VisualComponent.testBackground(setup, "ground", "building", "common");

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(0);
  });
});
