import { MenuItem } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";
import { resetTimers } from "./internal/test-tools.js";
import MenuListContext from "../src/_menu-list/menu-list-context.js";

afterEach(resetTimers);

let origGetBoundingClientRect;
beforeEach(() => {
  origGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    let result = origGetBoundingClientRect.apply(this, arguments);
    return { ...result, toJSON: () => result };
  };
});

afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = origGetBoundingClientRect;
});

function getDefaultProps() {
  return { children: "Test" };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(MenuItem, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.MenuItem", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { props, element } = await setup();
    const elementStyle = window.getComputedStyle(element);

    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-right")).not.toBeInTheDocument();
    expect(Test.screen.queryByRole("button", { name: props.children })).not.toBeInTheDocument();
    expect(element).toHaveGdsSize(["spot", "basic", "m"]);
    expect(element).toHaveGdsRadius(["spot", "moderate"], { height: 36 });
    expect(element).toHaveGdsShape(["interactiveItem", "light", "building", "common"]);
    expect(elementStyle.getPropertyValue("cursor")).toBe("");
    expect(element).toHaveGdsTypography(["interface", "interactive", "medium"]);
    expect(Test.screen.getByRole("menuitem", { name: props.children })).toBeVisible();
  });

  it("checks icon is properly shown", async () => {
    const icon = "uugds-check";
    const props = { icon };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
    expect(Test.screen.queryByTestId("icon-right")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
  });

  it("checks icon without children is properly shown", async () => {
    const icon = "uugds-check";
    const props = { icon, children: undefined };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
    expect(Test.screen.queryByTestId("icon-right")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
  });

  it("checks iconRight is properly shown", async () => {
    const iconRight = "uugds-check";
    const props = { iconRight };
    await setup(props);

    const iconRightElement = Test.screen.getByTestId("icon-right");

    expect(iconRightElement).toBeVisible();
    expect(iconRightElement).toHaveClass(iconRight);
    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
  });

  it("checks both icon and iconRight are properly shown", async () => {
    const icon = "uugds-favorites";
    const iconRight = "uugds-check";
    const props = { icon, iconRight };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");
    const iconRightElement = Test.screen.getByTestId("icon-right");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
    expect(iconRightElement).toBeVisible();
    expect(iconRightElement).toHaveClass(iconRight);
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
  });

  it("checks iconNotification = true is properly shown", async () => {
    const props = { icon: "uugds-check", iconNotification: true };
    await setup(props);

    expect(Test.screen.getByTestId("icon-with-notification")).toBeVisible();
  });

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClick: handleClick, role: "button" };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.children }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks onLabelClick is properly called", async () => {
    const handleLabelClick = jest.fn();
    const props = { onLabelClick: handleLabelClick, children: "Test", itemList: [{ children: "Submenu item 1" }] };
    const { user } = await setup(props, {
      Wrapper: ({ children }) => (
        <MenuListContext.Provider value={{ openSubmenu: jest.fn() }}>{children}</MenuListContext.Provider>
      ),
    });

    const labelElement = Test.screen.getByText("Test");
    const arrowElement = Test.screen.getByTestId("submenu-arrow");
    expect(labelElement).toHaveGdsShape(["interactiveItem", "light", "building", "common"]);
    expect(arrowElement).toHaveGdsShape(["interactiveItem", "light", "building", "common"]);

    await user.click(labelElement);

    expect(handleLabelClick).toHaveBeenCalledTimes(1);
  });

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly set to root element", async (size) => {
    const props = { size };
    const { element } = await setup(props);

    expect(element).toHaveGdsSize(["spot", "basic", size]);
  });

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive", "full"],
    { height: 36 },
    "spot",
  );
  VisualComponent.testColorScheme(setup, "interactiveItem", "green", "common");

  VisualComponent.testSignificance(setup, "interactiveItem", "building", [
    "common",
    "highlighted",
    "distinct",
    "subdued",
  ]);

  it("checks focused is properly shown", async () => {
    const props = { focused: true };
    const { element } = await setup(props);

    expect(element).toHaveGdsShape(["interactiveItem", "light", "building", "common"], { state: "accent" });
  });

  it.each([
    [true, "highlight", "minor"],
    ["cascade", "title", "micro"],
  ])("checks heading = %s is properly shown", async (heading, segment, type) => {
    const props = { heading };
    const { element } = await setup(props);

    expect(element).toHaveGdsTypography(["interface", segment, type]);
  });

  it("checks actionList property is properly shown and usable", async () => {
    const actionName = "Test action";
    const handleClick = jest.fn();
    const actionList = [{ children: actionName, onClick: handleClick }];
    const { user } = await setup({ actionList });

    await user.click(Test.screen.getByRole("button", { name: actionName }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks itemList is properly shown", async () => {
    jest.useFakeTimers();
    const itemList = [{ children: "Copy", icon: "uugds-copy" }];
    const props = { itemList };
    const { element } = await setup(props);

    Test.fireEvent.mouseEnter(element);
    Test.act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(Test.screen.getByTestId("popover")).toBeInTheDocument();
    Test.fireEvent.mouseLeave(element);
    Test.act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(Test.screen.queryByTestId("popover")).not.toBeInTheDocument();
  });

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(0);
  });
});
