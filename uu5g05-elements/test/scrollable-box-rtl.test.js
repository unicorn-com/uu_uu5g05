import { Utils } from "uu5g05";
import { ScrollableBox } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return { children: "Test" };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(ScrollableBox, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.ScrollableBox", () => {
  VisualComponent.testProperties(setup);

  //TODO disableOverscroll - overscroll-behavior not in computed styles
  //TODO scrollIndicator, scrollbarWidth - jsdom doesn't support the second argument for getComputedStyle

  it("checks default property values", async () => {
    const { element } = await setup({ initialScrollX: 150 });

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("height")).toBe("");
    expect(elementStyle.getPropertyValue("max-height")).toBe("");
    expect(elementStyle.getPropertyValue("min-height")).toBe("");
  });

  it("checks height is properly shown", async () => {
    const height = 200;
    const props = {
      height,
    };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("height")).toBe(`${height}px`);
  });

  it("checks maxHeight is properly shown", async () => {
    const maxHeight = 200;
    const props = {
      maxHeight,
    };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("max-height")).toBe(`${maxHeight}px`);
  });

  it("checks minHeight is properly shown", async () => {
    const minHeight = 200;
    const props = {
      minHeight,
    };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("min-height")).toBe(`${minHeight}px`);
  });

  it("checks initialScrollX is properly shown", async () => {
    const initialScrollX = 40;
    const props = {
      initialScrollX,
    };
    await setup(props);
    const content = Test.screen.getByText("Test");

    expect(content.scrollLeft).toBe(40);
  });

  it("checks initialScrollY is properly shown", async () => {
    const initialScrollY = 40;
    const props = {
      initialScrollY,
    };
    await setup(props);
    const content = Test.screen.getByText("Test");

    expect(content.scrollTop).toBe(40);
  });

  it("checks scrollElementRef is properly shown", async () => {
    let scrollElementRef = Utils.Component.createRef();
    const props = {
      scrollElementRef: scrollElementRef,
      initialScrollY: 40,
      initialScrollX: 20,
    };
    await setup(props);

    expect(scrollElementRef.current).toBeTruthy();
    expect(scrollElementRef.current.scrollLeft).toBe(20);
    expect(scrollElementRef.current.scrollTop).toBe(40);
  });

  it("checks horizontal is properly shown", async () => {
    const props = {
      horizontal: true,
      height: "50px",
      style: { width: 50 },
      children: (
        <div style={{ width: 200 }}>
          Lorem ipsum dolor sit amet consectetur adipiscing elit. Ex sapien vitae pellentesque sem placerat in id.
          Pretium tellus duis convallis tempus leo eu aenean.
        </div>
      ),
    };
    const { element } = await setup(props);

    Test.fireEvent.scroll(element, {
      target: {
        scrollLeft: 40,
      },
    });

    expect(element.scrollLeft).toBe(40);
  });

  it("checks scrollIndicatorOffset left and right are properly shown", async () => {
    const props = {
      scrollIndicatorOffset: { leftTop: 16, leftBottom: 17, rightTop: 18, rightBottom: 19 },
      horizontal: true,
      initialScrollX: 50,
      style: { width: 50 },
      height: "50px",
      children: (
        <div style={{ minWidth: 200 }}>
          Lorem ipsum dolor sit amet consectetur adipiscing elit. Ex sapien vitae pellentesque sem placerat in id.
          Pretium tellus duis convallis tempus leo eu aenean.
        </div>
      ),
    };
    const { element, view } = await setup(props);
    Object.defineProperty(element.firstChild, "scrollWidth", { value: 200 });

    view.rerender(Utils.Element.create(ScrollableBox, { ...getDefaultProps(), ...props }));

    const leftStyle = window.getComputedStyle(Test.screen.getByTestId("left"));
    const rightStyle = window.getComputedStyle(Test.screen.getByTestId("right"));

    expect(leftStyle.getPropertyValue("margin-bottom")).toBe("17px");
    expect(leftStyle.getPropertyValue("margin-top")).toBe("16px");
    expect(rightStyle.getPropertyValue("margin-bottom")).toBe("19px");
    expect(rightStyle.getPropertyValue("margin-top")).toBe("18px");
  });

  it("checks scrollIndicatorOffset top and bottom are properly shown", async () => {
    const props = {
      scrollIndicatorOffset: { topLeft: 16, topRight: 17, bottomLeft: 18, bottomRight: 19 },
      horizontal: true,
      initialScrollY: 50,
      style: { width: 50 },
      height: "50px",
      children: (
        <div style={{ minWidth: 200 }}>
          Lorem ipsum dolor sit amet consectetur adipiscing elit. Ex sapien vitae pellentesque sem placerat in id.
          Pretium tellus duis convallis tempus leo eu aenean.
        </div>
      ),
    };
    const { element, view } = await setup(props);
    Object.defineProperty(element.firstChild, "scrollHeight", { value: 200 });

    view.rerender(Utils.Element.create(ScrollableBox, { ...getDefaultProps(), ...props }));

    const topStyle = window.getComputedStyle(Test.screen.getByTestId("top"));
    const bottomStyle = window.getComputedStyle(Test.screen.getByTestId("bottom"));

    expect(topStyle.getPropertyValue("margin-inline-end")).toBe("17px");
    expect(topStyle.getPropertyValue("margin-inline-start")).toBe("16px");
    expect(bottomStyle.getPropertyValue("margin-inline-end")).toBe("19px");
    expect(bottomStyle.getPropertyValue("margin-inline-start")).toBe("18px");
  });
});
