import { ListItem } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    children: "Test",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(ListItem, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.ListItem", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    expect(element).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"]);
    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  VisualComponent.testColorScheme(setup, "interactiveElement", "green", "common");

  VisualComponent.testSignificance(setup, "interactiveElement", "neutral", [
    "common",
    "highlighted",
    "distinct",
    "subdued",
  ]);

  it("checks actionList property is properly shown and usable", async () => {
    const actionName = "Test action";
    const handleClick = jest.fn();
    const actionList = [{ children: actionName, onClick: handleClick }];
    const { user } = await setup({ actionList });

    await user.click(Test.screen.getByRole("button", { name: actionName }));

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
});
