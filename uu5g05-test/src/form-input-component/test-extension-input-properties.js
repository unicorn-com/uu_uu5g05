const { screen } = require("../internal/testing-library.js");

function testExtensionInputProperties(setup) {
  it("checks iconLeft is properly shown", async () => {
    const { user, input } = await setup({ iconLeft: "uugds-check-circle" });

    await user.click(input);

    expect(screen.getByTestId("icon-left")).toBeInTheDocument();
    expect(screen.getByTestId("icon-left")).toHaveClass("uugds-check-circle");
  });

  it("checks onIconLeftClick is properly called", async () => {
    const handleClick = jest.fn();
    const { user } = await setup({ onIconLeftClick: handleClick, iconLeft: "uugds-check-circle" });

    await user.click(screen.getByTestId("icon-left"));

    expect(handleClick).toBeCalledTimes(1);
  });

  it("checks iconRight is properly shown", async () => {
    const { user, input } = await setup({ iconRight: "uugds-check-circle" });

    await user.click(input);
    const iconElement = screen.getAllByTestId("icon-right");

    expect(iconElement[0]).toBeInTheDocument();
    expect(iconElement[0]).toHaveClass("uugds-check-circle");
  });

  it("checks onIconRightClick is properly called", async () => {
    const handleClick = jest.fn();
    const { user } = await setup({ onIconRightClick: handleClick, iconRight: "uugds-check-circle" });

    const iconElement = screen.getAllByTestId("icon-right");
    await user.click(iconElement[0]);

    expect(handleClick).toBeCalledTimes(1);
  });

  it("checks iconRightList is properly shown", async () => {
    const handleClick = jest.fn();
    const { user } = await setup({
      iconRightList: [{ icon: "uugds-search" }, { icon: "uugds-check", onClick: handleClick }],
    });

    const iconElement = screen.getAllByTestId("icon-right");
    expect(iconElement?.length).toBeGreaterThanOrEqual(2);
    expect(iconElement[0]).toHaveClass("uugds-search");
    expect(iconElement[1]).toHaveClass("uugds-check");

    await user.click(iconElement[1]);
    expect(handleClick).toBeCalledTimes(1);
  });

  it("checks prefix is properly shown", async () => {
    await setup({ prefix: "test" });

    expect(screen.getByTestId("prefix")).toBeInTheDocument();
  });

  it("checks suffix is properly shown", async () => {
    await setup({ suffix: "test" });

    expect(screen.getByTestId("suffix")).toBeInTheDocument();
  });

  it.each([
    ["error", ["meaning", "negative", "main"]],
    ["warning", ["meaning", "warning", "main"]],
    ["success", ["building", "dark", "softStrongerTransparent"]],
  ])("checks property feedback = %s as text is properly shown", async (feedback, inputColorPath) => {
    const props = { feedback };
    const { input } = await setup(props);

    expect(input).toHaveGdsColor(inputColorPath, "border-color");
  });

  it("checks onFeedbackClick is properly called", async () => {
    const handleClick = jest.fn();
    const { user } = await setup({ onFeedbackClick: handleClick, feedback: "error" });

    await user.click(screen.getByTestId("feedback"));

    expect(handleClick).toBeCalledTimes(1);
  });

  it("checks pending is properly shown", async () => {
    await setup({ pending: true });

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  //feedbackIcon since 1.21.0
}

module.exports = { testExtensionInputProperties };
