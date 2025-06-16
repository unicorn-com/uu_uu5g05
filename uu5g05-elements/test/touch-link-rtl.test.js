import { TouchLink } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(TouchLink, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.TouchLink", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, element } = await setup();

    expect(Test.screen.queryByRole("button", { name: props.children })).not.toBeInTheDocument();
    expect(Test.screen.getByTestId("icon")).toBeInTheDocument();
    expect(Test.screen.queryByRole("img")).not.toBeInTheDocument();
    expect(element).toHaveGdsSize(["spot", "major", "s"]);
    expect(element).toHaveGdsRadius(["spot", "moderate"], { height: 48 });
    expect(Test.screen.queryByTestId("notification")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("state")).not.toBeInTheDocument();
    expect(element).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"]);
  });

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClick: handleClick };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.children }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks icon is properly shown", async () => {
    const icon = "uugds-favorites";
    const props = { icon, children: "Test" };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  it("checks icon without children is properly shown", async () => {
    const icon = "uugds-play-circle";
    const props = { icon, children: undefined };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  it("checks text is properly shown", async () => {
    const props = { text: "Test" };
    await setup(props);

    expect(Test.screen.getByText("Test")).toBeInTheDocument();
  });

  it("checks imageSrc is properly called", async () => {
    const props = { imageSrc: "https://cdn.plus4u.net/uu-plus4u5g01/4.0.0/assets/img/anonymous.png" };
    await setup(props);

    expect(Test.screen.getByRole("img")).toBeInTheDocument();
  });

  it.each([
    ["xs", "basic", "xxs"],
    ["s", "basic", "l"],
    ["m", "major", "s"],
    ["l", "major", "m"],
    ["xl", "major", "l"],
  ])("checks size = %s is properly set to root element", async (size, palette, customSize) => {
    const props = { size };
    const { element } = await setup(props);

    expect(element).toHaveGdsSize(["spot", palette, customSize]);
  });

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive", "full"],
    {
      height: 80,
    },
    "box",
  );

  it("checks notification = true is properly shown", async () => {
    const props = { notification: 5 };
    await setup(props);

    expect(Test.screen.getByTestId("notification")).toBeVisible();
  });

  it.each([
    "system",
    "initial",
    "active",
    "final",
    "alternative-active",
    "problem",
    "passive",
    "alternative-final",
    "cancelled",
  ])("checks state = %s is properly shown", async (state) => {
    const props = { state };
    await setup(props);

    expect(Test.screen.getByTestId("state")).toBeVisible();
  });

  VisualComponent.testColorScheme(setup, "interactiveElement", "green", "common");

  VisualComponent.testSignificance(setup, "interactiveElement", "neutral", ["common", "highlighted", "subdued"]);

  it.each(["ground", "upper"])("checks effect = %s is properly shown", async (effect) => {
    const props = { effect };
    const finalEffect = effect.charAt(0).toUpperCase() + effect.slice(1);
    const { element } = await setup(props);

    expect(element).toHaveGdsEffect([`elevation${finalEffect}`]);
  });

  it("checks cssBackground is properly shown", async () => {
    const props = { cssBackground: "#2196F3" };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    VisualComponent.colorConvert(elementStyle.background, "#2196F3");
  });

  it("checks cssColor is properly shown", async () => {
    const props = { cssColor: "#fff" };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element);

    VisualComponent.colorConvert(elementStyle.color, "#fff");
  });

  VisualComponent.testBackground(setup, "interactiveElement", "neutral", "common");

  VisualComponent.testTooltip(setup);

  VisualComponent.testTooltipLsi(setup);

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(1);
    expect(element).toBeVisible();
  });
});
