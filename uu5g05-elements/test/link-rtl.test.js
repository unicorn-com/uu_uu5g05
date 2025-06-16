import { Link } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return { children: "Test" };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Link, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Link", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(Test.screen.getByTestId("component-1")).toBeInTheDocument();
    expect(Test.screen.getByTestId("component-1")).not.toHaveAttribute("target");
    expect(Test.screen.getByTestId("component-1")).not.toHaveAttribute("download");
    expect(Test.screen.queryByRole("link", { name: props.children })).not.toBeInTheDocument();
    expect(elementStyle.getPropertyValue("height")).toBe("");
    expect(element).toHaveGdsShape(["text", "light", "blue", "common"], { cssReset: false });
  });

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClick: handleClick, children: "Test" };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("link", { name: props.children }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks href is properly called", async () => {
    const props = { href: "https://unicorn.com" };
    await setup(props);

    expect(Test.screen.getByRole("link", { name: props.children })).toBeInTheDocument();
  });

  it("checks target is properly called", async () => {
    const props = { target: "_blank" };
    await setup(props);

    expect(Test.screen.getByTestId("component-1")).toHaveAttribute("target", "_blank");
  });

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly set to root element", async (size) => {
    const props = { size };
    const { element } = await setup(props);

    expect(element).toHaveGdsSize(["spot", "basic", size]);
  });

  VisualComponent.testColorScheme(setup, "text", "green", "common", false);

  VisualComponent.testSignificance(setup, "text", "blue", ["common", "subdued"], false);

  it.each(["custom_name.js", true])("checks download = %s is properly shown", async (download) => {
    const props = { download };
    await setup(props);

    expect(Test.screen.getByTestId("component-1")).toHaveAttribute("download");
  });

  VisualComponent.testBackground(setup, "text", "blue", "common", false);

  VisualComponent.testTooltip(setup);

  VisualComponent.testTooltipLsi(setup);
});
