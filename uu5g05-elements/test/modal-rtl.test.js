import { Modal, UuGds } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return { open: true, children: "modal content" };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Modal, { ...getDefaultProps(), ...props }, opts);
}

expect.extend({
  toHaveShape(element, path, border, state = "default", cssReset = true) {
    const style = window.getComputedStyle(element);
    const shape = UuGds.Shape.getValue(path);

    if (!shape) {
      return {
        message: () => `The UuGds.Shape doesn't contains item with path [${path}]`,
        pass: false,
      };
    }

    const shapeStyle = UuGds.Shape.getStateStyles(shape[state], cssReset);
    for (const key of Object.keys(shapeStyle)) {
      if (key === "backgroundColor") {
        continue;
      }
      // Conversion from camelCase to hypens (e.g. backgroundColor -> background-color)
      const propertyName = key.replace(/([a-z])([A-Z])/g, `$1-${border}-$2`).toLowerCase();
      const value = shapeStyle[key];
      let expectedValue = typeof value === "number" ? `${value}px` : value;
      let propertyValue = style.getPropertyValue(propertyName);

      // Normalization
      expectedValue = expectedValue.toLowerCase();
      propertyValue = propertyValue.toLowerCase();

      if (propertyValue === expectedValue) {
        continue;
      } else {
        return {
          message: () =>
            `expected CSS property ${propertyName} to be "${expectedValue}" but received "${propertyValue}"`,
          pass: false,
        };
      }
    }

    return {
      message: () => `expected UuGds.Shape not to be [${path}]`,
      pass: true,
    };
  },
});

describe("Uu5Elements.Modal", () => {
  //modal solves disabled in a different way
  VisualComponent.testProperties(setup, { excludes: ["disabled"] });

  it("checks default property values", async () => {
    const { element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(Test.screen.getByRole("dialog")).toBeInTheDocument();
    expect(elementStyle.getPropertyValue("width")).toBe("640px");
    expect(element).toHaveGdsRadius(["box", "moderate"]);
    expect(element.firstChild).toHaveShape(["line", "light", "building", "subdued"], "bottom");
  });

  it("checks onClose is properly called", async () => {
    const handleClick = jest.fn();
    const { user } = await setup({ onClose: handleClick });

    await user.click(Test.screen.getByRole("button", { name: "close" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks header is properly shown", async () => {
    const props = { header: "header" };
    await setup(props);

    expect(Test.screen.getByText("header")).toBeInTheDocument();
  });

  it("checks headerSeparator is properly shown", async () => {
    const props = { header: "header", headerSeparator: false };
    const { element } = await setup(props);

    expect(element.firstChild).not.toHaveShape(["line", "light", "building", "subdued"], "bottom");
  });

  it("checks actionList property is properly shown and usable", async () => {
    const actionName = "Test action";
    const handleClick = jest.fn();
    const actionList = [{ children: actionName, onClick: handleClick }];
    const { user } = await setup({ actionList });

    await user.click(Test.screen.getByRole("button", { name: actionName }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks actionLeft property is properly shown and usable", async () => {
    const actionName = "Test action";
    const handleClick = jest.fn();
    const actionLeft = { children: actionName, onClick: handleClick };
    const { user } = await setup({ actionLeft });

    await user.click(Test.screen.getByRole("button", { name: actionName }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks initialLeftOpen is properly shown", async () => {
    await setup({ left: "left", initialLeftOpen: true });

    expect(Test.screen.getByRole("button", { name: "menu" })).toBeInTheDocument();
    expect(Test.screen.getByTestId("drawer-open")).toBeInTheDocument();
  });

  it("checks leftWidth is properly shown", async () => {
    const leftWidth = 400;
    const { user } = await setup({ left: "left", leftWidth });

    await user.click(Test.screen.getByRole("button", { name: "menu" }));

    const drawerElement = Test.screen.getByTestId("scrollable-box");
    const elementStyle = window.getComputedStyle(drawerElement);

    expect(elementStyle.getPropertyValue("width")).toBe(`${leftWidth}px`);
  });

  it("checks left is properly shown", async () => {
    await setup({ left: "left" });

    const drawerElement = Test.screen.getByTestId("scrollable-box");
    const elementStyle = getComputedStyle(drawerElement);

    expect(elementStyle.getPropertyValue("width")).toBe("248px");
    expect(Test.screen.getByRole("button", { name: "menu" })).toBeInTheDocument();
    expect(drawerElement).toBeInTheDocument();
  });

  it("checks footer and footerSeparator are properly shown", async () => {
    const props = { footer: "footer" };
    await setup(props);

    expect(Test.screen.getByText("footer")).toBeInTheDocument();
    expect(Test.screen.getByText("footer")).toHaveShape(["line", "light", "building", "subdued"], "top");
  });

  it("checks footerSeparator = false is properly shown", async () => {
    const props = { footer: "footer", footerSeparator: false };
    await setup(props);

    expect(Test.screen.getByText("footer")).not.toHaveShape(["line", "light", "building", "subdued"], "top");
  });

  it("checks info is hidden by default", async () => {
    const info = "Test info";
    await setup({ info });

    let infoElement = Test.screen.queryByText(info);

    expect(infoElement).not.toBeInTheDocument();
  });

  it("checks initialDisplayInfo ensures info is visible by default", async () => {
    const info = "Test info";
    await setup({ info, initialDisplayInfo: true });

    expect(Test.screen.getByText(info)).toBeVisible();
  });

  it("checks width is properly shown", async () => {
    const width = 500;
    const { element } = await setup({ width });

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("width")).toBe(`${width}px`);
  });

  it("checks fullscreen is properly shown", async () => {
    const { element } = await setup({ fullscreen: true });

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("width")).toBe("100%");
    expect(elementStyle.getPropertyValue("height")).toBe("100%");
  });

  VisualComponent.testBorderRadius(setup, ["none", "elementary", "moderate", "expressive"], { height: 640 }, "box");

  it("checks scrollable is properly shown", async () => {
    await setup({ scrollable: false });

    expect(Test.screen.queryByTestId("scrollable")).not.toBeInTheDocument();
  });

  it.each([
    [false, 0],
    [true, 1],
  ])("checks closeOnEsc properly works", async (closeOnEsc, num) => {
    const handleClose = jest.fn();
    const { element } = await setup({ onClose: handleClose, closeOnEsc });

    Test.fireEvent.keyDown(element, { key: "Escape", code: "Escape" });

    expect(handleClose).toHaveBeenCalledTimes(num);
  });

  it("checks closeOnOverlayClick property is properly called", async () => {
    const handleClick = jest.fn();
    const { element, user } = await setup({ onClose: handleClick, closeOnOverlayClick: true });

    await user.click(element.parentNode);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks closeOnButtonClick = false properly works", async () => {
    const handleClose = jest.fn();
    await setup({ onClose: handleClose, closeOnButtonClick: false });

    expect(Test.screen.queryByRole("button", { name: "close" })).not.toBeInTheDocument();
  });

  it("checks lsi property properly overrides default content", async () => {
    const lsi = {
      moreInfo: { en: "Test more info" },
    };
    await setup({ info: "Some info", lsi });

    expect(Test.screen.getByTitle(lsi.moreInfo.en)).toBeVisible();
  });

  it("checks children as function is properly called", async () => {
    const children = jest.fn();
    const props = { children };
    await setup(props);

    expect(children).toHaveBeenCalledTimes(1);
    expect(children.mock.lastCall[0]).toEqual({
      style: {
        paddingTop: UuGds.SpacingPalette.getValue(["adaptive", "largeScreen"]).normal.d,
        paddingBottom: UuGds.SpacingPalette.getValue(["adaptive", "largeScreen"]).normal.d,
        paddingLeft: UuGds.SpacingPalette.getValue(["adaptive", "largeScreen"]).normal.d,
        paddingRight: UuGds.SpacingPalette.getValue(["adaptive", "largeScreen"]).normal.d,
      },
    });
  });

  it("checks restrainedHeader properly works", async () => {
    const props = { header: "Test header", children: "Test content", restrainedHeader: true };
    const { view } = await setup(props);
    expect(Test.screen.queryByText("Test header")).not.toBeInTheDocument();
    view.unmount();

    await setup({ ...props, restrainedHeader: false });
    expect(Test.screen.getByText("Test header")).toBeInTheDocument();
  });
});
