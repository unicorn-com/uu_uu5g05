import { Toggle } from "uu5g05-elements";
import { VisualComponent, Test } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Toggle, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Toggle", () => {
  VisualComponent.testProperties(setup);

  it("checks default props", async () => {
    const { element } = await setup();
    const toggleButton = Test.screen.getByRole("switch");
    const elementStyle = window.getComputedStyle(element);

    expect(element.firstChild).toHaveAttribute("aria-checked", "false");
    expect(element).toHaveGdsSize(["spot", "basic", "m"]);
    expect(toggleButton.firstChild).toHaveClass("uugds-close");
    expect(element).toHaveGdsRadius(["spot", "moderate"], { height: 36 });
    expect(elementStyle.getPropertyValue("width")).toBe("");
  });

  it("checks value is properly shown", async () => {
    await setup({ value: true });

    const toggleButton = Test.screen.getByRole("switch");
    expect(toggleButton).toBeChecked();
  });

  it("checks onChange is properly called", async () => {
    const handleClick = jest.fn();
    const { user } = await setup({ onChange: handleClick });

    const toggleButton = Test.screen.getByRole("switch");
    await user.click(toggleButton);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly shown", async (size) => {
    const { element } = await setup({ size });

    expect(element).toHaveGdsSize(["spot", "basic", size]);
  });

  it("checks size = null is properly shown", async () => {
    const { element } = await setup({ size: null });

    const elementStyle = window.getComputedStyle(element);
    const isEmUnit = /em$/.test(elementStyle.height);

    expect(isEmUnit).toBe(true);
  });

  it("checks label is properly shown", async () => {
    await setup({ label: "test" });

    expect(Test.screen.getByText("test")).toBeInTheDocument();
  });

  it("checks box is properly shown", async () => {
    const { element } = await setup({ box: true });

    expect(element).toHaveGdsShape(["background", "light", "neutral", "distinct"]);
  });

  it("checks iconOn is properly shown", async () => {
    await setup({ iconOn: "uugds-plus", value: true });

    const toggleButton = Test.screen.getByRole("switch");

    expect(toggleButton.firstChild).toHaveClass("uugds-plus");
  });

  it("checks iconOff is properly shown", async () => {
    await setup({ iconOff: "uugds-plus" });

    const toggleButton = Test.screen.getByRole("switch");

    expect(toggleButton.firstChild).toHaveClass("uugds-plus");
  });

  it("checks colorScheme is properly shown", async () => {
    await setup({ colorScheme: "secondary", value: true });
    const toggleButton = Test.screen.getByRole("switch");

    expect(toggleButton).toHaveGdsShape(["interactiveElement", "light", "secondary", "highlighted"]);
  });

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive", "full"],
    { height: 36 },
    "spot",
  );

  it("checks width is properly shown", async () => {
    const { element } = await setup({ width: 200 });

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("width")).toBe("200px");
  });
});
