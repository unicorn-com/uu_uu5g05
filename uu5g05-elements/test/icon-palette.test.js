import { _IconPalette as IconPalette, UuGds } from "uu5g05-elements";
import { VisualComponent, Test } from "uu5g05-test";

function getDefaultProps() {
  return {
    itemList: ["uugds-left", "uugds-right"],
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(IconPalette, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.IconPalette", () => {
  VisualComponent.testProperties(setup);

  it("checks empty itemList is properly shown", async () => {
    await setup({ itemList: [] });

    expect(Test.screen.getByText("No icons found")).toBeInTheDocument();
  });

  it("checks default itemList is properly shown", async () => {
    await setup();

    expect(Test.screen.getByTitle("uugds-left")).toBeInTheDocument();
    expect(Test.screen.getByTitle("uugds-right")).toBeInTheDocument();
  });

  it("checks onSelect is properly called", async () => {
    const onSelect = jest.fn();
    const { user } = await setup({ onSelect });
    const iconItem = Test.screen.getByTitle("uugds-left");

    await user.click(iconItem);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("checks value is properly shown", async () => {
    await setup({ value: "uugds-left" });
    const iconItem = Test.screen.getByTitle("uugds-left");

    const color = UuGds.ColorPalette.getValue(["meaning", "primary", "main"]);
    expect(iconItem).toHaveGdsEffect(["outlineIndentedExpressive"], { color });
  });
});
