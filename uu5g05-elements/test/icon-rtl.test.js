import { Icon } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Icon, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Icon", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("margin")).toBe("");
    expect(Test.screen.getByTestId("component-1")).toBeInTheDocument();
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
    const icon = "uugds-favorites";
    const props = { icon, children: "Test" };
    await setup(props);

    const iconElement = Test.screen.getByTestId("component-1");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  it("checks icon without children is properly shown", async () => {
    const icon = "uugds-play-circle";
    const props = { icon, children: undefined };
    await setup(props);

    const iconElement = Test.screen.getByTestId("component-1");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  it("checks margin property is properly passed", async () => {
    const margin = 4;
    const { element } = await setup({ margin });

    const contentStyle = window.getComputedStyle(element);

    expect(contentStyle.getPropertyValue("margin")).toBe(`${margin}px`);
  });

  VisualComponent.testColorScheme(setup, "text", "green", "common", false);

  VisualComponent.testSignificance(setup, "text", "primary", ["common", "subdued"], false);

  VisualComponent.testBackground(setup, "text", "primary", "common", false);

  VisualComponent.testTooltip(setup);

  VisualComponent.testTooltipLsi(setup);

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(0);
    expect(element).toBeVisible();
  });
});
