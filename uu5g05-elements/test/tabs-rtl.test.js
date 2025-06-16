import { Tabs, UuGds } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

window.visualViewport = window;

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
  return {
    itemList: [
      { code: "code 1", label: "label 1", children: "item 1" },
      { code: "code 2", label: "label 2", children: "item 2" },
    ],
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Tabs, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Tabs", () => {
  VisualComponent.testProperties(setup);

  //colorScheme: set on :after

  it("checks default props", async () => {
    await setup();
    const tabElement = Test.screen.getByRole("tab", { name: "label 2" });
    const spacing = UuGds.SpacingPalette.getValue(["adaptive", "normal", "d"]);

    const elementStyle = window.getComputedStyle(tabElement);

    expect(elementStyle.getPropertyValue("padding-inline-end")).toBe(`${spacing * 0.5}px`);
    expect(elementStyle.getPropertyValue("padding-inline-start")).toBe(`${spacing * 0.5}px`);
    expect(tabElement).toHaveGdsTypography(["interface", "interactive", "medium"]);
  });

  it("checks type = line is properly shown", async () => {
    await setup({ type: "line" });

    const tabElement = Test.screen.getByRole("tab", { name: "label 2" });

    expect(tabElement).toHaveGdsSpacing("padding-inline-end", ["fixed", "b"]);
    expect(tabElement).toHaveGdsSpacing("padding-inline-start", ["fixed", "b"]);
  });

  it("checks type = card-outer is properly shown", async () => {
    await setup({ type: "card-outer" });

    const tabElement = Test.screen.getByRole("tab", { name: "label 2" });

    expect(tabElement).toHaveGdsSpacing("padding-inline-end", ["adaptive", "normal", "d"]);
    expect(tabElement).toHaveGdsSpacing("padding-inline-start", ["adaptive", "normal", "d"]);
  });

  it("checks icon is properly shown", async () => {
    const icon = "uugds-favorites";
    await setup({ itemList: [{ icon, children: "test" }] });

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  it("checks actionList works properly", async () => {
    const handleClick = jest.fn();
    const props = {
      actionList: [{ children: "item1", onClick: handleClick }],
    };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: "item1" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks onChange works properly", async () => {
    const handleClick = jest.fn();
    const props = {
      onChange: handleClick,
    };
    const { user } = await setup(props);

    expect(handleClick).toHaveBeenCalledTimes(0);

    const tabElement = Test.screen.getByRole("tab", { name: "label 2" });

    await user.click(tabElement);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks activeCode works properly", async () => {
    const props = {
      activeCode: "code 2",
    };
    await setup(props);

    const fistTab = Test.screen.getByRole("tab", { name: "label 1" });
    const secondTab = Test.screen.getByRole("tab", { name: "label 2" });

    expect(secondTab).toHaveAttribute("aria-selected", "true");
    expect(fistTab).toHaveAttribute("aria-selected", "false");
  });

  it("checks displayScrollButtons works properly", async () => {
    HTMLElement.prototype.getBoundingClientRect = function () {
      let result = origGetBoundingClientRect.apply(this, arguments);
      if (this.getAttribute("role") == "tablist") {
        result.width = 200;
      } else {
        result.width = 100;
      }
      return { ...result, toJSON: () => result };
    };

    const props = {
      displayScrollButtons: true,
      itemList: [
        { label: "label 2", children: "item 2" },
        { label: "label 1", children: "item 1" },
        { label: "label 2", children: "item 2" },
        { label: "label 1", children: "item 1" },
        { label: "label 2", children: "item 2" },
        { label: "label 1", children: "item 1" },
      ],
    };
    const Wrapper = ({ children }) => <div style={{ maxWidth: 400 }}>{children}</div>;
    await setup(props, { Wrapper });

    const iconElement = Test.screen.getAllByTestId("icon");

    expect(iconElement[0]).toHaveClass("uugds-menu");
    expect(iconElement[1]).toHaveClass("uugds-chevron-left");
    expect(iconElement[2]).toHaveClass("uugds-chevron-right");
  });

  it.each(["s", "m"])("checks size = %s is properly shown", async (size) => {
    await setup({ size });

    const tabElement = Test.screen.getByRole("tab", { name: "label 2" });
    const spacing = UuGds.SpacingPalette.getValue(["adaptive", "normal", "b"]);
    const { height } = UuGds.getSizes("spot", "basic", size);
    const elementStyle = window.getComputedStyle(tabElement);

    expect(elementStyle.getPropertyValue("min-height")).toBe(`${height + 2 * spacing}px`);
  });
});
