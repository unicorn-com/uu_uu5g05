import { ColorPalette } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(ColorPalette, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.ColorPalette", () => {
  VisualComponent.testProperties(setup);

  it("checks value is properly shown", async () => {
    await setup({ value: "#FFFFFF" });

    expect(Test.screen.getByTestId("selected")).toBeInTheDocument();
  });

  it("checks valueType = object is properly shown", async (color) => {
    const onSelect = jest.fn();
    const { user } = await setup({ onSelect, valueType: "object" });
    const colorSquare = Test.screen.getByTitle("white (#FFFFFF)");

    await user.click(colorSquare);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: {
          value: { colorScheme: "white", cssColor: "#FFFFFF", hex: "#ffffff", opacity: 100, shade: undefined },
        },
      }),
    );
  });

  it("checks valueType = colorScheme is properly shown", async () => {
    const onSelect = jest.fn();
    const { user } = await setup({ onSelect, valueType: "colorScheme" });
    const colorSquare = Test.screen.getByTitle("blue");

    await user.click(colorSquare);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { cssColor: "linear-gradient(135deg, #64B5F6 0%, #1565C0 100%)", value: "blue" },
      }),
    );
  });

  it("checks valueType = cssColor is properly shown", async () => {
    const onSelect = jest.fn();
    const { user } = await setup({ onSelect, valueType: "cssColor" });
    const colorSquare = Test.screen.getByTitle("white (#FFFFFF)");

    await user.click(colorSquare);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { value: "#FFFFFF" },
      }),
    );
  });

  it("checks onSelect is properly called", async () => {
    const select = jest.fn();
    const { user } = await setup({ onSelect: select });
    const colorSquare = Test.screen.getByTitle("white (#FFFFFF)");
    await user.click(colorSquare);

    expect(select).toHaveBeenCalledTimes(1);
  });

  it("checks displayOpacity is properly shown", async () => {
    await setup({ value: "#000000", displayOpacity: true });

    expect(Test.screen.getByText("Opacity")).toBeInTheDocument();
    expect(Test.screen.getByTestId("opacity-palette")).toBeInTheDocument();
  });

  it("checks displayShade is properly shown", async () => {
    await setup({ value: "#9e9e9e", displayShade: true });

    expect(Test.screen.getByText("Shade")).toBeInTheDocument();
    expect(Test.screen.getByTestId("shade-palette")).toBeInTheDocument();
    expect(Test.screen.getByTitle("#F5F5F5")).toBeInTheDocument();
    expect(Test.screen.getByTitle("#E8E8E8")).toBeInTheDocument();
    expect(Test.screen.getByTitle("#D8D8D8")).toBeInTheDocument();
    expect(Test.screen.getByTitle("#BDBDBD")).toBeInTheDocument();
    expect(Test.screen.getByTitle("#9E9E9E")).toBeInTheDocument();
    expect(Test.screen.getByTitle("#8F8F8F")).toBeInTheDocument();
    expect(Test.screen.getByTitle("#757575")).toBeInTheDocument();
    expect(Test.screen.getByTitle("#525252")).toBeInTheDocument();
    expect(Test.screen.getByTitle("#343434")).toBeInTheDocument();
  });
});
