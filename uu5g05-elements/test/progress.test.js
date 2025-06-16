import { Progress } from "uu5g05-elements";
import { VisualComponent, Test } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Progress, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Progress", () => {
  VisualComponent.testProperties(setup);

  // TODO tests
  // value 0, colorScheme, colorScheme

  it("checks default property values", async () => {
    const { element } = await setup();

    expect(element).toHaveGdsSize(["spot", "basic", "m"]);
    expect(element.nodeName).toBe("svg");
  });

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly set", async (size) => {
    const { element } = await setup({ size });

    expect(element).toHaveGdsSize(["spot", "basic", size]);
  });

  it("checks size = max is properly shown", async () => {
    const props = { size: "max" };
    await setup(props);
    const elementStyle = window.getComputedStyle(Test.screen.queryByRole("alert"));

    expect(elementStyle.getPropertyValue("height")).toBe("252px");
  });

  it("checks onCancel is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onCancel: handleClick };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button"));

    expect(Test.screen.getByRole("button")).toBeInTheDocument();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks cancelTooltip is properly shown", async () => {
    const cancelTooltip = "Test tooltip";
    const props = { cancelTooltip, onCancel: jest.fn() };
    await setup(props);

    expect(Test.screen.getByTitle(cancelTooltip)).toBeVisible();
  });

  it("checks text is properly shown", async () => {
    const text = 30;
    const props = { text, value: 30 };
    await setup(props);

    expect(Test.screen.getByText(text)).toBeInTheDocument();
  });

  it("checks suffix is properly shown", async () => {
    const suffix = "%";
    const props = { text: "30", suffix, value: 30 };
    await setup(props);

    expect(Test.screen.getByText(suffix)).toBeInTheDocument();
  });

  it("checks imageSrc is properly called", async () => {
    const imageSrc = "https://cdn.plus4u.net/uu-plus4u5g01/4.0.0/assets/img/anonymous.png";
    const props = { size: "max", imageSrc };
    await setup(props);

    expect(Test.screen.queryByRole("img")).toHaveAttribute("src", imageSrc);
  });

  it("checks icon is properly called", async () => {
    const icon = "uugdssvg-svg-document";
    const props = { size: "max", icon };
    await setup(props);

    expect(Test.screen.getByTestId("svg")).toBeInTheDocument();
  });

  it.each(["400px", "50%", "8em"])("checks width = %s is properly set to root element", async (width) => {
    const props = { width, type: "horizontal" };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);
    expect(elementStyle.getPropertyValue("width")).toBe(width);
  });

  it.each(["400px", "50%", "8em"])(
    "checks progressWidth = %s is properly set to root element",
    async (progressWidth) => {
      const props = { progressWidth, type: "horizontal" };
      await setup(props);

      const elementStyle = window.getComputedStyle(Test.screen.getByRole("progressbar"));
      expect(elementStyle.getPropertyValue("width")).toBe(progressWidth);
    },
  );

  it("checks children are properly shown", async () => {
    const props = { children: "Test", size: "max" };
    await setup(props);

    expect(Test.screen.getByText("Test")).toBeInTheDocument();
  });

  it("checks type = horizontal is properly shown", async () => {
    const props = { type: "horizontal" };
    await setup(props);

    expect(Test.screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("checks animated = false is properly displayed", async () => {
    const props = { animated: false, value: 30 };
    const { element } = await setup(props);
    const elementStyle = window.getComputedStyle(element.lastChild);

    expect(elementStyle.getPropertyValue("transition")).toBe("");
  });
});
