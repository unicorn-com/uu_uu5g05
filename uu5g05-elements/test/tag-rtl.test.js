import { Tag } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    children: "Test",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Tag, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Tag", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-right")).not.toBeInTheDocument();
    expect(elementStyle.getPropertyValue("height")).toBe("1.3em");
    expect(elementStyle.getPropertyValue("border-radius")).toBe("min(calc(0.15 * 1.3em * 10), 8)");
    expect(element).toHaveGdsShape(["interactiveElement", "light", "building", "common"]);
    expect(Test.screen.queryByRole("button", { name: props.children })).not.toBeInTheDocument();
  });

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClick: handleClick, children: "Test" };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.children }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks icon is properly shown", async () => {
    const icon = "uugds-play-circle";
    const props = { icon };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
    expect(Test.screen.queryByTestId("icon-right")).not.toBeInTheDocument();
  });

  it("checks icon without children is properly shown", async () => {
    const icon = "uugds-play-circle";
    const props = { icon, children: undefined };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
    expect(Test.screen.queryByTestId("icon-right")).not.toBeInTheDocument();
  });

  it("checks iconRight is properly shown", async () => {
    const iconRight = "uugds-play-circle";
    const props = { iconRight };
    await setup(props);

    const iconRightElement = Test.screen.getByTestId("icon-right");

    expect(iconRightElement).toBeVisible();
    expect(iconRightElement).toHaveClass(iconRight);
    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("checks both icon and iconRight are properly shown", async () => {
    const icon = "uugds-favorites";
    const iconRight = "uugds-play-circle";
    const props = { icon, iconRight };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");
    const iconRightElement = Test.screen.getByTestId("icon-right");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
    expect(iconRightElement).toBeVisible();
    expect(iconRightElement).toHaveClass(iconRight);
  });

  it("checks ellipsis = true is properly shown", async () => {
    const props = { ellipsis: true };
    await setup(props);
    const contentElement = Test.screen.getByTestId("content");
    const elementStyle = window.getComputedStyle(contentElement);

    expect(elementStyle.getPropertyValue("text-overflow")).toBe("ellipsis");
  });

  VisualComponent.testColorScheme(setup, "interactiveElement", "green", "common");

  VisualComponent.testSignificance(setup, "interactiveElement", "building", [
    "common",
    "highlighted",
    "distinct",
    "subdued",
  ]);

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive", "full"],
    { size: "m", height: 28 },
    "spot",
  );

  it.each([
    ["xs", "minor", "l"],
    ["s", "basic", "xxs"],
    ["m", "basic", "xs"],
    ["l", "basic", "s"],
    ["xl", "basic", "m"],
  ])("checks size = %s is properly set to root element", async (size, palette, customSize) => {
    const props = { size };
    const { element } = await setup(props);

    expect(element).toHaveGdsSize(["spot", palette, customSize]);
  });

  it("checks focused = true is properly shown", async () => {
    const props = { focused: true };
    const { element } = await setup(props);

    expect(element).toHaveGdsShape(["interactiveElement", "light", "building", "common"], { state: "accent" });
  });

  VisualComponent.testTooltip(setup);

  VisualComponent.testTooltipLsi(setup);

  VisualComponent.testBackground(setup, "interactiveElement", "building", "common");

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    //expects 1 because it returns an empty span when children and icon are undefined
    expect(element.childNodes.length).toBe(1);
    expect(element).toBeVisible();
  });
});
