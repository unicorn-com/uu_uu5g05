import { Dropdown } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

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
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Dropdown, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Dropdown", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(Test.screen.getByRole("button", { expanded: false })).toBeInTheDocument();
    expect(Test.screen.getByTestId("icon-right")).toHaveClass("uugds-menu-down");
    expect(Test.screen.getByTestId("icon-right")).toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon-with-notification")).not.toBeInTheDocument();
    expect(element).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"]);
    expect(element).toHaveGdsSize(["spot", "basic", "m"]);
    expect(elementStyle.getPropertyValue("width")).toBe("");
    expect(element).toHaveGdsRadius(["spot", "moderate"], { height: 36 });
  });

  //TODO openPosition

  it("checks label is properly shown", async () => {
    const label = "Test";
    const props = { label };
    await setup(props);

    expect(Test.screen.getByRole("button", { name: props.label })).toBeInTheDocument();
  });

  it("checks iconClosed is properly shown", async () => {
    const iconClosed = "uugds-chevron-down";
    const props = { iconClosed };
    await setup(props);

    const iconRightElement = Test.screen.getByTestId("icon-right");

    expect(iconRightElement).toBeVisible();
    expect(iconRightElement).toHaveClass(iconClosed);
    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("checks iconOpen is properly shown", async () => {
    const iconOpen = "uugds-chevron-up";
    const props = { iconOpen, label: "Test" };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.label }));
    const iconRightElement = Test.screen.getByTestId("icon-right");

    expect(iconRightElement).toBeVisible();
    expect(iconRightElement).toHaveClass(iconOpen);
    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("checks itemList is properly shown", async () => {
    const itemList = [{ children: "Copy", icon: "uugds-copy" }];
    const props = { itemList };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { expanded: false }));
    expect(Test.screen.getByTestId("popover")).toBeInTheDocument();
    await user.click(Test.screen.getByRole("button", { expanded: true }));
    expect(Test.screen.queryByTestId("popover")).not.toBeInTheDocument();
  });

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClick: handleClick, label: "Test" };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.label }));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(Test.screen.getByTestId("popover")).toBeInTheDocument();
  });

  it("checks onLabelClick is properly called", async () => {
    const handleLabelClick = jest.fn();
    const props = { onLabelClick: handleLabelClick, label: "Test" };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.label }));

    expect(handleLabelClick).toHaveBeenCalledTimes(1);
    expect(Test.screen.queryByTestId("popover")).not.toBeInTheDocument();
  });

  it("checks pressed = true is properly shown", async () => {
    const props = { pressed: true, onLabelClick: () => {}, label: "Test" };
    await setup(props);

    expect(Test.screen.getByRole("button", { name: props.label })).toHaveGdsShape(
      ["interactiveElement", "light", "neutral", "common"],
      { state: "marked" },
    );
    expect(Test.screen.getByRole("button", { name: props.label })).toHaveAttribute("aria-pressed", "true");
  });

  it("checks pressed = true is ignored without onLabelClick", async () => {
    const props = { pressed: true, label: "Test" };
    await setup(props);

    expect(Test.screen.getByRole("button", { name: props.label })).toHaveAttribute("aria-pressed", "false");
  });

  it("checks closeOnScroll is properly called", async () => {
    const props = { closeOnScroll: true, label: "Test" };
    const { user, element } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.label }));

    expect(Test.screen.getByTestId("popover")).toBeInTheDocument();
    Test.fireEvent.scroll(element);

    expect(Test.screen.queryByTestId("popover")).not.toBeInTheDocument();
  });

  it("checks children is properly shown", async () => {
    const props = { children: "Test" };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(1);
  });
});
