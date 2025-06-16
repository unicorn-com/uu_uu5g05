import { BackgroundProvider } from "uu5g05";
import { Badge } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    children: "Test",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Badge, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Badge", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(elementStyle.getPropertyValue("height")).toBe("1.3em");
    expect(element).toHaveGdsShape(["interactiveElement", "light", "red", "highlighted"]);
    expect(elementStyle.getPropertyValue("border-radius")).toBe("min(0.3 * 1.3em, 12px)");
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
    const icon = "uugds-pencil";
    const props = { icon };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  it("checks icon without children is properly shown", async () => {
    const icon = "uugds-pencil";
    const props = { icon, children: undefined };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  VisualComponent.testColorScheme(setup, "interactiveElement", "red", "highlighted");

  VisualComponent.testSignificance(setup, "interactiveElement", "red", ["common", "highlighted"]);

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive", "full"],
    { size: "m", height: 16 },
    "spot",
  );

  it.each(["xs", "s", "m", "l", "xl"])("checks size = %s is properly set to root element", async (size) => {
    const props = { size };
    const { element } = await setup(props);

    expect(element).toHaveGdsSize(["spot", "minor", size]);
  });

  VisualComponent.testTooltip(setup);

  VisualComponent.testTooltipLsi(setup);

  VisualComponent.testBackground(setup, "interactiveElement", "red", "highlighted");

  it.each(["light", "dark", "full", "soft"])(
    "checks component has right borderContrast for %s background",
    async (background) => {
      const BACKGROUND_MAP = { soft: "light", full: "dark" };
      const Wrapper = ({ children }) => <BackgroundProvider background={background}>{children}</BackgroundProvider>;
      const props = { borderContrast: true };
      const { element } = await setup(props, { Wrapper });
      const elementStyle = window.getComputedStyle(element);

      expect(elementStyle.getPropertyValue("border-width")).toBe("1px");
      expect(elementStyle.getPropertyValue("border-style")).toBe("solid");
      expect(element).toHaveGdsColor(["building", BACKGROUND_MAP[background] || background, "main"], "border-color");
    },
  );

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(1);
    expect(element).toBeVisible();
  });
});
