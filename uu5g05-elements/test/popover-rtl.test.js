import { DeviceProvider } from "uu5g05";
import { Popover, UuGds } from "uu5g05-elements";
import { Test, VisualComponent, Utils } from "uu5g05-test";

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
  return { children: "Test", onClose: () => {} };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Popover, { ...getDefaultProps(), ...props }, opts);
}

function expectPosition(element, expectedLeft, expectedTop) {
  // TODO JSDOM doesn't support reading style from pseudo-elements (::before) so we're not able to even mock this.
  // const wrapperStyle = window.getComputedStyle(element.parentNode);
  // let wrapperBeforeStyle = window.getComputedStyle(element.parentNode, "before");
  // let reserved = parseFloat(wrapperBeforeStyle.flexBasis) || 0;
  // if (expectedLeft != null) {
  //   let left = (parseFloat(wrapperStyle.left) || 0) + reserved; // unfinished
  //   expect(left).toBe(expectedLeft);
  // }
  // if (expectedTop != null) {
  //   let top = (parseFloat(wrapperStyle.top) || 0) + reserved; // unfinished
  //   expect(top).toBe(expectedTop);
  // }
}

function withoutGdsEffect(shape) {
  let result = { ...shape };
  for (let stateName in shape) {
    let { effect, ...state } = shape[stateName];
    result[stateName] = state;
  }
  return result;
}

describe("Uu5Elements.Popover", () => {
  VisualComponent.testProperties(setup);

  //TODO preferredPosition

  it("checks default property values", async () => {
    const props = {};
    const { element } = await setup(props);

    // expectPosition(element, 0, 0);
    const gdsShape = withoutGdsEffect(UuGds.Shape.getValue(["overlay", "light", "building", "common"]));
    expect(element).toHaveGdsShape(gdsShape);
    expect(element).toHaveGdsRadius(["box", "moderate"]);
  });

  it.skip("element", async () => {
    let div = document.createElement("div");
    div.getBoundingClientRect = () => ({ left: 100, top: 200, right: 150, bottom: 240, width: 50, height: 40 });
    document.body.appendChild(div);

    const { element } = await setup({ element: div });

    expectPosition(element, 100, 200);
    div.parentNode.removeChild(div);
  });

  it.skip("checks pageX is properly shown", async () => {
    const pageX = 100;
    const props = { pageX };
    const { element } = await setup(props);

    expectPosition(element, pageX);
  });

  it.skip("checks pageY is properly shown", async () => {
    const pageY = 100;
    const props = { pageY };
    const { element } = await setup(props);

    expectPosition(element, undefined, pageY);
  });

  it("checks colorScheme is properly shown", async () => {
    const props = { colorScheme: "green" };
    const { element } = await setup(props);

    const gdsShape = withoutGdsEffect(UuGds.Shape.getValue(["overlay", "light", props.colorScheme, "common"]));
    expect(element).toHaveGdsShape(gdsShape);
  });

  it.each(["common", "highlighted", "distinct", "subdued"])(
    "checks significance = %s is properly shown",
    async (significance) => {
      const props = { significance, colorScheme: "building" };
      const { element } = await setup(props);

      const gdsShape = withoutGdsEffect(
        UuGds.Shape.getValue(["overlay", "light", props.colorScheme, props.significance]),
      );
      expect(element).toHaveGdsShape(gdsShape);
    },
  );

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive"],
    { height: 100, width: 100 },
    "box",
  );

  it.skip("checks elementOffset is properly shown", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const elementOffset = 18;
    const props = { element: div, elementOffset, referredPosition: "bottom-right", onClose: () => {} };
    const { element } = await setup(props);

    expectPosition(element, undefined, elementOffset);
    div.parentNode.removeChild(div);
  });

  it.skip.each([
    ["bottom-right", "top"],
    ["right-bottom", "left"],
  ])("checks elementOffset is properly shown with preferredPosition = %s", async (position, property) => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const elementOffset = 18;
    const props = { element: div, elementOffset, onClose: () => {}, preferredPosition: position };
    const { element } = await setup(props);
    expectPosition(
      element,
      property === "left" ? elementOffset : undefined,
      property === "top" ? elementOffset : undefined,
    );
    div.parentNode.removeChild(div);
  });

  it.skip.each([0, 4])("checks displayArrow is properly shown", async (offset) => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const props = { displayArrow: true, element: div, elementOffset: offset };
    const { element } = await setup(props);

    expectPosition(element, undefined, 8 + offset);
    div.parentNode.removeChild(div);
  });

  it("checks onClose is working properly", async () => {
    const handleClose = jest.fn();
    const props = { onClose: handleClose };
    const { user } = await setup(props);

    expect(handleClose).toHaveBeenCalledTimes(0);

    await user.click(document.body);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])("checks closeOnScroll = true is working properly", async (scroll) => {
    const handleClose = jest.fn();
    const props = { closeOnScroll: scroll, onClose: handleClose };
    await setup(props);

    Test.fireEvent.scroll(window, { target: { scrollY: 100 } });

    if (scroll) {
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledWith(expect.objectContaining({ type: "scroll" }));
    } else {
      expect(handleClose).toHaveBeenCalledTimes(0);
    }
  });

  it("checks bottomSheet is properly shown", async () => {
    const handleClose = jest.fn();
    const props = { onClose: handleClose, bottomSheet: true };
    const Wrapper = ({ children }) => (
      <DeviceProvider platform="ios" isMobileOrTablet>
        {children}
      </DeviceProvider>
    );
    const { element } = await setup(props, { Wrapper });
    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("bottom")).toBe("0px");
  });

  it("checks bottomSheet should close on swipe down and expand on swipe up", async () => {
    HTMLElement.prototype.getBoundingClientRect = function () {
      let result = origGetBoundingClientRect.apply(this, arguments);
      if (this.getAttribute("data-testid") == "component-1") {
        result.height = 500;
      }
      return { ...result, toJSON: () => result };
    };
    const handleClose = jest.fn();
    const props = { onClose: handleClose, bottomSheet: true, style: { height: 18 } };
    const Wrapper = ({ children }) => (
      <DeviceProvider platform="ios" isMobileOrTablet>
        {children}
      </DeviceProvider>
    );
    const { element } = await setup(props, { Wrapper });

    //bottomSheet expand test
    Test.fireEvent.touchStart(element, { touches: [{ pageY: 1177, clientX: 168, clientY: 277 }] });
    Test.fireEvent.touchMove(element, { touches: [{ pageY: 857, clientX: 188, clientY: -42 }] });
    Test.fireEvent.touchEnd(element);

    expect(handleClose).toHaveBeenCalledTimes(0);
    expect(element).toHaveStyle(`max-height: calc(${window.innerHeight - 40}px - env(safe-area-inset-bottom))`);

    //bottomSheet onClose test
    Test.fireEvent.touchStart(element, { touches: [{ pageY: 1077, clientX: 208, clientY: 277 }] });
    Test.fireEvent.touchMove(element, { touches: [{ pageY: 1552, clientX: 218, clientY: 752 }] });
    Test.fireEvent.touchEnd(element);

    // must wait because PopoverBottomSheet is closed only after animation finishes (300ms)
    await Utils.wait(400);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("checks relative is working properly", async () => {
    const props = { relative: true, children: "content" };
    await setup(props);

    expect(document.querySelector('[data-uu5portaltype^="popover"]')).not.toBeInTheDocument();
  });
});
