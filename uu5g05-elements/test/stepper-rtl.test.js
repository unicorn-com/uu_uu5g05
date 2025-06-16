import { Stepper } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return { itemList: [{ title: "Step 1" }, { title: "Step 2" }], stepIndex: 0, progressIndex: 0 };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Stepper, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Stepper", () => {
  VisualComponent.testProperties(setup);
  it("checks default property values", async () => {
    await setup();

    const elementStyle = window.getComputedStyle(Test.screen.getByRole("tablist"));

    expect(Test.screen.getByTestId("icon")).toBeInTheDocument();
    expect(Test.screen.getByTestId("icon")).toHaveClass("uugds-pencil");
    expect(Test.screen.getByText("Step 1")).toBeInTheDocument();
    expect(Test.screen.getByText("Step 2")).toBeInTheDocument();
    expect(Test.screen.getByText("2")).toBeInTheDocument();
    expect(Test.screen.queryByText("1")).not.toBeInTheDocument();
    expect(elementStyle.getPropertyValue("flex-direction")).toBe("row");
    expect(Test.screen.getByTestId("line")).toBeInTheDocument();
  });

  it("checks stepIndex and progressIndex is properly shown", async () => {
    const props = { itemList: [{ title: "Step 1" }, { title: "Step 2" }], stepIndex: 0, progressIndex: 1 };
    await setup(props);

    const icons = Test.screen.getAllByTestId("icon");
    expect(icons[0]).toBeInTheDocument();
    expect(icons[0]).toHaveClass("uugds-pencil");
    expect(icons[1]).toBeInTheDocument();
    expect(icons[1]).toHaveClass("uugds-check");
  });

  it("checks vertical is properly shown", async () => {
    const props = { itemList: [{ title: "Step 1" }, { title: "Step 2" }], vertical: true };
    await setup(props);

    const elementStyle = window.getComputedStyle(Test.screen.getByRole("tablist"));

    expect(elementStyle.getPropertyValue("flex-direction")).toBe("column");
  });

  it("checks displayLines is properly shown", async () => {
    const props = { itemList: [{ title: "Step 1" }, { title: "Step 2" }], displayLines: false };
    await setup(props);

    expect(Test.screen.queryByTestId("line")).not.toBeInTheDocument();
  });

  it("checks iconUnfinished and iconActive are properly shown", async () => {
    const props = {
      itemList: [{ title: "Step 1" }, { title: "Step 2" }],
      stepIndex: 0,
      progressIndex: 0,
      iconUnfinished: "uugds-circle",
      iconActive: "uugds-favorites",
    };
    await setup(props);

    const icons = Test.screen.getAllByTestId("icon");
    expect(icons[0]).toBeInTheDocument();
    expect(icons[0]).toHaveClass("uugds-favorites");
    expect(icons[1]).toBeInTheDocument();
    expect(icons[1]).toHaveClass("uugds-circle");
  });

  it("checks iconFinished is properly shown", async () => {
    const props = {
      itemList: [{ title: "Step 1" }, { title: "Step 2" }],
      stepIndex: 1,
      progressIndex: 1,
      iconFinished: "uugds-favorites",
    };
    await setup(props);

    const icons = Test.screen.getAllByTestId("icon");
    expect(icons[0]).toBeInTheDocument();
    expect(icons[0]).toHaveClass("uugds-favorites");
  });

  it("checks iconAlert is properly shown", async () => {
    const props = {
      stepIndex: 1,
      validityList: [false, true],
      iconAlert: "uugds-favorites",
    };
    await setup(props);

    const icons = Test.screen.getAllByTestId("icon");
    expect(icons[0]).toBeInTheDocument();
    expect(icons[0]).toHaveClass("uugds-favorites");
  });

  it("checks validityList is properly shown", async () => {
    const props = {
      stepIndex: 1,
      validityList: [false, true],
    };
    await setup(props);

    const icons = Test.screen.getAllByTestId("icon");
    expect(icons[0]).toBeInTheDocument();
    expect(icons[0]).toHaveClass("uugds-alert");
  });

  it("checks onChange is properly called", async () => {
    const handleClick = jest.fn();
    const props = {
      itemList: [{ title: "Step 1" }, { title: "Step 2" }],
      stepIndex: 1,
      progressIndex: 1,
      iconFinished: "uugds-favorites",
      onChange: handleClick,
    };
    const { user } = await setup(props);

    const icons = Test.screen.getAllByTestId("icon");
    await user.click(icons[0]);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
