import { ContentSizeProvider, createComponent, Utils } from "uu5g05";
import { ActionGroup } from "uu5g05-elements";
import Uu5Elements from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

let origGetBoundingClientRect;
let origOffsetWidthProperty;
beforeEach(() => {
  origGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    let width = this.offsetWidth;
    let height = 100;
    let result = { left: 0, top: 0, right: width, bottom: height, width, height };
    return { ...result, toJSON: () => result };
  };
  origOffsetWidthProperty = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    get: function () {
      return this.tagName === "DIV" ? 1000 : 100;
    },
    configurable: true,
  });
});
afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = origGetBoundingClientRect;
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", origOffsetWidthProperty);
});

function getDefaultProps() {
  return { itemList: [{ children: "item1", primary: true }, { children: "item2" }] };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(ActionGroup, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.ActionGroup", () => {
  VisualComponent.testProperties(setup);

  it("checks itemList is properly shown", async () => {
    await setup();

    expect(Test.screen.getByRole("button", { name: "item1" })).toBeInTheDocument();
    expect(Test.screen.getByRole("button", { name: "item2" })).toBeInTheDocument();
  });

  it("checks itemList with component as a function is properly shown", async () => {
    let containerWidth = 1000;
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      get: function () {
        return this.textContent === "create"
          ? 100
          : this.textContent === "button"
            ? 300
            : this.textContent === "button-compact"
              ? 100
              : this.tagName === "DIV"
                ? containerWidth
                : 36;
      },
      configurable: true,
    });

    const CustomComponent = createComponent({
      uu5Tag: "TestCustomComponent",
      render: jest.fn((props) => {
        let Component = props.displayType === "menu-item" ? Uu5Elements.MenuItem : Uu5Elements.Button;
        return <Component {...props}>{props.displayType}</Component>;
      }),
    });
    const CustomComponent2 = jest.fn((props) => {
      let Component = props.displayType === "menu-item" ? Uu5Elements.MenuItem : Uu5Elements.Button;
      return <Component {...props}>{props.displayType}</Component>;
    });

    const props = {
      itemList: [
        { children: "create", icon: "uugds-plus" },
        { component: CustomComponent, icon: "empty" },
        { component: CustomComponent2 },
      ],
    };

    let { view, user } = await setup(props);

    let lastCall = CustomComponent.mock.calls[CustomComponent.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(expect.objectContaining({ displayType: "button" }));
    let lastCall2 = CustomComponent2.mock.calls[CustomComponent2.mock.calls.length - 1];
    expect(lastCall2[0]).toEqual(expect.objectContaining({ displayType: "button" }));
    view.unmount();

    containerWidth = 300;
    ({ view, user } = await setup(props));
    lastCall = CustomComponent.mock.calls[CustomComponent.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(expect.objectContaining({ displayType: "button-compact" }));
    lastCall2 = CustomComponent2.mock.calls[CustomComponent2.mock.calls.length - 1];
    expect(lastCall2[0]).toEqual(expect.objectContaining({ displayType: "button" })); // without icon should receive displayType="button" (never "button-compact"; based on changes in ActionGroup on 2024-12-09)
    view.unmount();

    containerWidth = 50;
    ({ view, user } = await setup(props));
    const dropdown = Test.screen.getByTestId("icon");
    await user.click(dropdown);

    lastCall = CustomComponent.mock.calls[CustomComponent.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(expect.objectContaining({ displayType: "menu-item" }));
    lastCall2 = CustomComponent2.mock.calls[CustomComponent2.mock.calls.length - 1];
    expect(lastCall2[0]).toEqual(expect.objectContaining({ displayType: "menu-item" }));
  });

  it("checks itemList with component an element is properly shown", async () => {
    let containerWidth = 1000;
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      get: function () {
        return this.textContent === "create"
          ? 100
          : this.textContent === "button"
            ? 300
            : this.textContent === "button-compact"
              ? 100
              : this.tagName === "DIV"
                ? containerWidth
                : 36;
      },
      configurable: true,
    });

    const CustomComponent = jest.fn((props) => {
      let Component = props.displayType === "menu-item" ? Uu5Elements.MenuItem : Uu5Elements.Button;
      return <Component {...props}>{props.displayType}</Component>;
    });
    const CustomComponent2 = jest.fn((props) => {
      let Component = props.displayType === "menu-item" ? Uu5Elements.MenuItem : Uu5Elements.Button;
      return <Component {...props}>{props.displayType}</Component>;
    });

    const props = {
      itemList: [
        { children: "create", icon: "uugds-plus" },
        { component: <CustomComponent />, icon: "empty" },
        { component: <CustomComponent2 /> },
      ],
    };

    let { view, user } = await setup(props);

    let lastCall = CustomComponent.mock.calls[CustomComponent.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(expect.objectContaining({ displayType: "button" }));
    let lastCall2 = CustomComponent2.mock.calls[CustomComponent2.mock.calls.length - 1];
    expect(lastCall2[0]).toEqual(expect.objectContaining({ displayType: "button" }));
    view.unmount();

    containerWidth = 300;
    ({ view, user } = await setup(props));
    lastCall = CustomComponent.mock.calls[CustomComponent.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(expect.objectContaining({ displayType: "button-compact" }));
    lastCall2 = CustomComponent2.mock.calls[CustomComponent2.mock.calls.length - 1];
    expect(lastCall2[0]).toEqual(expect.objectContaining({ displayType: "button" })); // without icon should receive displayType="button" (never "button-compact"; based on changes in ActionGroup on 2024-12-09)
    view.unmount();

    containerWidth = 50;
    ({ view, user } = await setup(props));
    const dropdown = Test.screen.getByTestId("icon");
    await user.click(dropdown);

    lastCall = CustomComponent.mock.calls[CustomComponent.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(expect.objectContaining({ displayType: "menu-item" }));
    lastCall2 = CustomComponent2.mock.calls[CustomComponent2.mock.calls.length - 1];
    expect(lastCall2[0]).toEqual(expect.objectContaining({ displayType: "menu-item" }));
  });

  it("checks collapsedMenuProps is properly shown", async () => {
    const props = {
      collapsedMenuProps: { colorScheme: "positive", significance: "highlighted" },
      itemList: [
        { collapsedChildren: "item1", collapsed: true },
        { collapsedChildren: "item2", collapsed: true },
      ],
    };
    const { user } = await setup(props);

    expect(Test.screen.queryByRole("button", { name: "item1" })).not.toBeInTheDocument();
    expect(Test.screen.queryByRole("button", { name: "item2" })).not.toBeInTheDocument();

    const collapsedButton = Test.screen.getByRole("button", { expanded: false });

    await user.click(collapsedButton);

    const expandedButton = Test.screen.getByRole("button", { expanded: true });

    expect(expandedButton).toBeInTheDocument();
    expect(expandedButton).toHaveGdsShape(["interactiveElement", "light", "positive", "highlighted"], {
      state: "accent",
    });
  });

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly set", async (size) => {
    const props = {
      itemList: [{ children: "item1", size }],
    };
    await setup(props);

    expect(Test.screen.getByRole("button", { name: "item1" })).toHaveGdsSize(["spot", "basic", size]);
  });

  it.each([
    ["left", "flex-start"],
    ["right", "flex-end"],
  ])("checks alignment=%p is properly shown", async (alignment, value) => {
    const { element } = await setup({ alignment });

    let flexElement = alignment === "left" ? element.firstChild.firstChild.firstChild : element; // left-aligned has extra scrollable wrapper (which has 2 div-s)
    const elementStyle = window.getComputedStyle(flexElement);

    expect(elementStyle.getPropertyValue("justify-content")).toBe(value);
  });

  it("checks onMeasure is properly computed", async () => {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      get: function () {
        return this.textContent === "item" ? 100 : 36;
      },
      configurable: true,
    });

    const measure = jest.fn();
    const props = {
      itemList: [{ children: "item" }],
      onMeasure: measure,
    };
    await setup(props);

    expect(measure).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: {
          minWidth: 36,
          maxWidth: 100,
        },
      }),
    );
  });

  it("itemList[].collapsed='duplicated' is properly shown", async () => {
    const props = {
      itemList: [
        { children: "item1", collapsed: "duplicated" },
        { children: "item2", collapsed: true },
        { children: "item3" },
      ],
    };
    const { user } = await setup(props);

    expect(Test.screen.getByRole("button", { name: "item1" })).toBeInTheDocument();
    expect(Test.screen.queryByRole("button", { name: "item2" })).not.toBeInTheDocument();
    expect(Test.screen.getByRole("button", { name: "item3" })).toBeInTheDocument();

    const collapsedButton = Test.screen.getByRole("button", { expanded: false });
    await user.click(collapsedButton);

    expect(Test.screen.getByRole("menuitem", { name: "item1" })).toBeInTheDocument();
    expect(Test.screen.getByRole("menuitem", { name: "item2" })).toBeInTheDocument();
    expect(Test.screen.queryByRole("menuitem", { name: "item3" })).not.toBeInTheDocument();
  });

  it("should use item component's statics actionGroup.collapsed as fallback", async () => {
    const noop = () => {};
    const Component1 = createComponent({
      render: (props) => <span {...Utils.VisualComponent.getAttrs(props)}>Component1</span>,
    });
    Component1.actionGroup = { collapsed: false };
    const Component2 = createComponent({
      render: (props) => <span {...Utils.VisualComponent.getAttrs(props)}>Component2</span>,
    });
    Component2.actionGroup = { collapsed: true };
    const Component3 = createComponent({
      render: (props) => <span {...Utils.VisualComponent.getAttrs(props)}>Component3</span>,
    });
    Component3.actionGroup = { collapsed: { xs: false, s: "always", m: "auto" } };

    const props = {
      itemList: [{ component: Component1 }, { component: Component2 }, { component: Component3 }],
    };

    let { view } = await setup(props, {
      wrapper: (props) => (
        <ContentSizeProvider contentSize="xs" onChange={noop}>
          {props.children}
        </ContentSizeProvider>
      ),
    });
    expect(Test.screen.getByText("Component1")).toBeInTheDocument();
    expect(Test.screen.queryByText("Component2")).not.toBeInTheDocument();
    expect(Test.screen.getByText("Component3")).toBeInTheDocument();
    view.unmount();

    ({ view } = await setup(props, {
      wrapper: (props) => (
        <ContentSizeProvider contentSize="s" onChange={noop}>
          {props.children}
        </ContentSizeProvider>
      ),
    }));
    expect(Test.screen.getByText("Component1")).toBeInTheDocument();
    expect(Test.screen.queryByText("Component2")).not.toBeInTheDocument();
    expect(Test.screen.queryByText("Component3")).not.toBeInTheDocument();
    view.unmount();

    ({ view } = await setup(props, {
      wrapper: (props) => (
        <ContentSizeProvider contentSize="xl" onChange={noop}>
          {props.children}
        </ContentSizeProvider>
      ),
    }));
    expect(Test.screen.getByText("Component1")).toBeInTheDocument();
    expect(Test.screen.queryByText("Component2")).not.toBeInTheDocument();
    expect(Test.screen.getByText("Component3")).toBeInTheDocument();
    view.unmount();
  });
});
