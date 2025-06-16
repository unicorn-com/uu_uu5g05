import { SwitchSelectVertical } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return { itemList: [{ children: "item 1" }, { children: "item 2" }] };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(SwitchSelectVertical, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.SwitchSelectVertical", () => {
  VisualComponent.testProperties(setup);
  it("checks default property values", async () => {
    const { element } = await setup();

    const menuElement = Test.screen.queryByRole("listbox");
    const elementStyle = window.getComputedStyle(menuElement);

    expect(elementStyle.getPropertyValue("max-height")).toBe("");
    expect(element).toHaveGdsRadius(["box", "moderate"]);
    expect(element).toHaveGdsShape(["ground", "light", "building", "subdued"]);
  });

  it("checks itemList is properly shown", async () => {
    const props = { itemList: [{ children: "item 1" }, { children: "item 2" }] };
    await setup(props);

    expect(Test.screen.getByRole("listbox")).toBeInTheDocument();
    expect(Test.screen.getByRole("option", { name: "item 1" })).toBeInTheDocument();
    expect(Test.screen.getByRole("option", { name: "item 2" })).toBeInTheDocument();
  });

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { itemList: [{ children: "item 1", onClick: handleClick }] };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("option", { name: "item 1" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks height is properly shown", async () => {
    const height = 200;
    const props = {
      height,
    };
    await setup(props);

    const menuElement = Test.screen.queryByRole("listbox");
    const elementStyle = window.getComputedStyle(menuElement);

    expect(elementStyle.getPropertyValue("max-height")).toBe(`${height}px`);
  });
});
