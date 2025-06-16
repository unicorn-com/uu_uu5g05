import { RichIcon } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(RichIcon, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.RichIcon", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(element).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"]);
    expect(elementStyle.getPropertyValue("height")).toBe("36px");
    expect(element).toHaveGdsRadius(["spot", "full"], { height: 36 });
    expect(Test.screen.getByTestId("icon")).toBeInTheDocument();
    expect(element).toHaveGdsSize(["spot", "basic", "m"]);
    expect(Test.screen.queryByRole("img")).not.toBeInTheDocument();
    expect(Test.screen.queryByRole("button", { name: props.children })).not.toBeInTheDocument();
  });

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClick: handleClick, children: "Test" };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.children }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks imageSrc is properly called", async () => {
    const props = { imageSrc: "https://cdn.plus4u.net/uu-plus4u5g01/4.0.0/assets/img/anonymous.png" };
    await setup(props);

    expect(Test.screen.getByRole("img")).toBeInTheDocument();
  });

  it("checks height property is properly passed", async () => {
    const height = 500;
    const children = "Test";
    await setup({ children, height });

    const contentElement = Test.screen.getByText(children);
    const contentStyle = window.getComputedStyle(contentElement);

    expect(contentStyle.getPropertyValue("height")).toBe(`${height}px`);
  });

  it("checks text is properly shown", async () => {
    const props = { text: "Test" };
    await setup(props);

    expect(Test.screen.getByText("Test")).toBeInTheDocument();
  });

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive", "full"],
    { height: 80 },
    "box",
  );

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

  it.each([
    ["xxs", "basic", "xxs"],
    ["xs", "basic", "xs"],
    ["s", "basic", "s"],
    ["m", "basic", "m"],
    ["l", "basic", "l"],
    ["xl", "major", "s"],
    ["xxl", "major", "m"],
    ["3xl", "major", "l"],
  ])("checks size = %s is properly set to root element", async (size, palette, customSize) => {
    const props = { size };
    const { element } = await setup(props);

    expect(element).toHaveGdsSize(["spot", palette, customSize]);
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

  it("checks clickable is properly shown", async () => {
    const props = { clickable: true };
    const { element } = await setup(props);

    expect(element).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"]);
  });

  VisualComponent.testBackground(setup, "interactiveElement", "neutral", "common");

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(1);
    expect(element).toBeVisible();
  });
});
