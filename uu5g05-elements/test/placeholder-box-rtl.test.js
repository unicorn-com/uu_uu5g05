import { PlaceholderBox } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return { code: "cart" };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(PlaceholderBox, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.PlaceholderBox", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    await setup();

    expect(Test.screen.getByTestId("svg")).toHaveGdsShape(["text", "light", "steel", "common"], { cssReset: false });
    expect(Test.screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(Test.screen.getByTestId("box")).toBeInTheDocument();
  });

  it.each([
    ["account", "Please, log in first"],
    ["forbidden", "You are not permitted to display this content"],
    ["basket", "Your basket is empty"],
  ])("checks code = %s is properly shown", async (code, text) => {
    const props = { code };
    await setup(props);

    expect(Test.screen.getByText(text)).toBeInTheDocument();
  });

  it("checks header is properly shown", async () => {
    const props = { header: "Test" };
    await setup(props);

    expect(Test.screen.getByText(props.header)).toBeInTheDocument();
  });

  it("checks info is properly shown", async () => {
    const props = { info: "Test" };
    await setup(props);

    expect(Test.screen.getByText(props.info)).toBeInTheDocument();
  });

  it("checks actionList property is properly shown and usable", async () => {
    const actionName = "Test action";
    const handleClick = jest.fn();
    const actionList = [{ children: actionName, onClick: handleClick }];
    const { user } = await setup({ actionList });

    await user.click(Test.screen.getByRole("button", { name: actionName }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["vertical", "column"],
    ["horizontal", "row"],
  ])("checks actionDirection property is properly shown", async (actionDirection, direction) => {
    const actionName = "Test action";
    const handleClick = jest.fn();
    const actionList = [{ children: actionName, onClick: handleClick }];
    const props = { actionList, actionDirection };
    await setup(props);
    const elementStyle = window.getComputedStyle(Test.screen.getByTestId("buttons"));

    expect(elementStyle.getPropertyValue("flex-direction")).toBe(direction);
  });

  it.each(["common", "subdued"])("checks significance = %s is properly shown", async (significance) => {
    const props = { significance };
    await setup(props);

    expect(Test.screen.getByTestId("svg")).toHaveGdsShape(["text", "light", "steel", significance], {
      cssReset: false,
    });
  });
});
