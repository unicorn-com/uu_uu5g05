import { MenuList } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";
import { resetTimers } from "./internal/test-tools.js";
import { addMatcherToHaveLineShape } from "./internal/line-tools.js";

addMatcherToHaveLineShape();

afterEach(resetTimers);

let origGetBoundingClientRect;
beforeAll(() => {
  origGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    let result = origGetBoundingClientRect.apply(this, arguments);
    return { ...result, toJSON: () => result };
  };
});

afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = origGetBoundingClientRect;
});

function getDefaultProps() {
  return { itemList: [{ children: "item 1" }, { children: "item 2" }] };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(MenuList, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.MenuList", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("height")).toBe("");
    expect(Test.screen.getByRole("menuitem", { name: "item 1" })).toBeInTheDocument();
    expect(Test.screen.getByRole("menuitem", { name: "item 2" })).toBeInTheDocument();
  });

  it("checks compactSubmenu is properly shown", async () => {
    const itemList = [{ children: "item 1", itemList: [{ children: "nested item" }] }, { children: "item 2" }];
    const props = { compactSubmenu: true, itemList };
    const { user } = await setup(props);

    expect(Test.screen.queryByRole("menuitem", { name: "nested item" })).not.toBeInTheDocument();
    expect(Test.screen.getByRole("menuitem", { name: "item 1" })).toBeInTheDocument();
    expect(Test.screen.getByRole("menuitem", { name: "item 2" })).toBeInTheDocument();

    await user.click(Test.screen.getByRole("menuitem", { name: "item 1" }));

    await Test.waitFor(() => {
      expect(Test.screen.getByRole("menuitem", { name: "nested item" })).toBeInTheDocument();
      expect(Test.screen.getByRole("button")).toBeInTheDocument();
      expect(Test.screen.getByRole("menuitem", { name: "item 1" })).toBeInTheDocument();
      expect(Test.screen.queryByRole("menuitem", { name: "item 2" })).not.toBeInTheDocument();
    });

    await user.click(Test.screen.getByRole("button"));
    await Test.waitFor(() => {
      expect(Test.screen.queryByRole("button")).not.toBeInTheDocument();
      expect(Test.screen.queryByRole("menuitem", { name: "nested item" })).not.toBeInTheDocument();
      expect(Test.screen.getByRole("menuitem", { name: "item 1" })).toBeInTheDocument();
      expect(Test.screen.getByRole("menuitem", { name: "item 2" })).toBeInTheDocument();
    });
  });

  it.each(["400px", "50%", "8em"])("checks height = %s is properly set to root element", async (maxHeight) => {
    const props = { maxHeight };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);
    expect(elementStyle.getPropertyValue("max-height")).toBe(maxHeight);
  });

  it("checks children is properly shown", async () => {
    const props = { children: "Test" };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(2);
  });

  it("checks itemList[].collapsibleColorScheme is properly shown", async () => {
    const props = {
      itemList: [
        { children: "Item 1" },
        { collapsible: true, children: "Item 2", itemList: [{ children: "Nested item 1" }] },
      ],
    };
    const { view } = await setup(props);
    const hrCount = document.querySelectorAll("hr").length;
    view.unmount();

    await setup({
      ...props,
      itemList: props.itemList.map((it) => (it.collapsible ? { ...it, collapsibleColorScheme: "red" } : it)),
    });
    let lineEls = document.querySelectorAll("hr");
    expect(lineEls.length).toBe(hrCount + 1);
    expect(lineEls[lineEls.length - 1]).toHaveLineShape(["light", "red", "highlighted"], "vertical");
  });
});
