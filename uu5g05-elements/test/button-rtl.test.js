import { Button } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    children: "Test",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Button, { ...getDefaultProps(), ...props }, opts);
}

// TODO MFA How to test effect property?
describe("Uu5Elements.Button", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(Test.screen.getByRole("button", { name: props.children })).toBeVisible();
    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-right")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
    expect(element).toHaveAttribute("type", "button");
    expect(element).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"]);
    expect(element).toHaveGdsRadius(["spot", "moderate"], { height: 36 });
    expect(element).toHaveGdsSize(["spot", "basic", "m"]);
    expect(elementStyle.getPropertyValue("width")).toBe("");
  });

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClick: handleClick };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.children }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks icon is properly shown", async () => {
    const icon = "uugds-pencil";
    const props = { icon };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
    expect(Test.screen.queryByTestId("icon-right")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
  });

  it("checks icon without children is properly shown", async () => {
    const icon = "uugds-pencil";
    const props = { icon, children: undefined };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
    expect(Test.screen.queryByTestId("icon-right")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
  });

  it("checks iconRight is properly shown", async () => {
    const iconRight = "uugds-pencil";
    const props = { iconRight };
    await setup(props);

    const iconRightElement = Test.screen.getByTestId("icon-right");

    expect(iconRightElement).toBeVisible();
    expect(iconRightElement).toHaveClass(iconRight);
    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
  });

  it("checks both icon and iconRight are properly shown", async () => {
    const icon = "uugds-favorites";
    const iconRight = "uugds-pencil";
    const props = { icon, iconRight };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");
    const iconRightElement = Test.screen.getByTestId("icon-right");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
    expect(iconRightElement).toBeVisible();
    expect(iconRightElement).toHaveClass(iconRight);
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
  });

  it.each(["button", "submit", "reset"])("checks type = %s is properly passed to element", async (type) => {
    const props = { type };
    const { element } = await setup(props);

    expect(element).toHaveAttribute("type", type);
  });

  VisualComponent.testColorScheme(setup, "interactiveElement", "green", "common");

  VisualComponent.testSignificance(setup, "interactiveElement", "neutral", [
    "common",
    "highlighted",
    "distinct",
    "subdued",
  ]);

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive", "full"],
    { height: 36 },
    "spot",
  );

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly set to root element", async (size) => {
    const props = { size };
    const { element } = await setup(props);

    expect(element).toHaveGdsSize(["spot", "basic", size]);
  });

  it.each(["400px", "50%", "8em"])("checks width = %s is properly set to root element", async (width) => {
    const props = { width };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);
    expect(elementStyle.getPropertyValue("width")).toBe(width);
  });

  it("checks pressed = true is properly shown", async () => {
    const props = { pressed: true };
    const { element } = await setup(props);

    expect(element).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"], { state: "marked" });
  });

  VisualComponent.testTooltip(setup);

  VisualComponent.testTooltipLsi(setup);

  it("checks iconNotification = true is properly shown", async () => {
    const props = { icon: "uugds-pencil", iconNotification: true };
    await setup(props);

    expect(Test.screen.getByTestId("icon-with-notification")).toBeVisible();
  });

  VisualComponent.testBackground(setup, "interactiveElement", "neutral", "common");
});
