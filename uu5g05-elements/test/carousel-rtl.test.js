import { Carousel } from "uu5g05-elements";
import { Test, VisualComponent, Utils } from "uu5g05-test";
import { resetTimers } from "./internal/test-tools.js";

afterEach(resetTimers);

let origGetBoundingClientRect;
beforeEach(() => {
  origGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    let result = origGetBoundingClientRect.apply(this, arguments);
    if (this.getAttribute("data-testid") == "carousel-view") {
      result.width = 500;
    }
    return { ...result, toJSON: () => result };
  };
});

afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = origGetBoundingClientRect;
});

function getDefaultProps() {
  return { children: ["item1", "item2", "item3"] };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Carousel, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Carousel", () => {
  VisualComponent.testProperties(setup);

  it("checks index and onIndexChange properly works", async () => {
    const onIndexChange = jest.fn();
    const props = {
      index: 1,
      children: ["item1", "item2", "item3"],
      onIndexChange,
    };
    const { user } = await setup(props);

    //will test if the correct element is shown
    expect(Test.screen.getByTestId("item-0")).toHaveAttribute("aria-hidden", "true");
    expect(Test.screen.getByTestId("item-1")).toHaveAttribute("aria-hidden", "false");
    expect(Test.screen.getByTestId("item-2")).toHaveAttribute("aria-hidden", "true");

    //test if onIndexChange is called
    await user.click(Test.screen.getByLabelText("next"));

    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });

  it("checks intervalMs is properly called", async () => {
    const onIndexChange = jest.fn();
    jest.useFakeTimers();
    await setup({ intervalMs: 500, onIndexChange });

    Test.act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });

  it("checks contentHeight is properly shown", async () => {
    await setup({ contentHeight: 50 });

    const carouselElement = Test.screen.getByTestId("carousel-view");
    const elementStyle = window.getComputedStyle(carouselElement);

    expect(elementStyle.getPropertyValue("height")).toBe("50px");
  });

  it("checks type = final is properly shown", async () => {
    await setup({ type: "final", index: 2 });

    const activeItem = Test.screen.getByTestId("item-2");
    const elementStyle = window.getComputedStyle(activeItem);

    expect(Test.screen.getByLabelText("next")).toBeDisabled();
    expect(elementStyle.getPropertyValue("order")).toBe("2");
  });

  it("checks type = rewind is properly shown", async () => {
    await setup({ type: "rewind", index: 2 });

    const activeItem = Test.screen.getByTestId("item-2");
    const elementStyle = window.getComputedStyle(activeItem);

    expect(Test.screen.getByLabelText("next")).toBeEnabled();
    expect(elementStyle.getPropertyValue("order")).toBe("2");
  });

  it("checks type = infinite is properly shown", async () => {
    await setup({ type: "infinite", index: 2 });

    const activeItem = Test.screen.getByTestId("item-2");
    const elementStyle = window.getComputedStyle(activeItem);

    expect(Test.screen.getByLabelText("next")).toBeEnabled();
    expect(elementStyle.getPropertyValue("order")).toBe("1");
  });

  it.each(["outer", "inner"])("checks buttons is properly shown", async (buttons) => {
    await setup({ buttons });

    const nextButton = Test.screen.getByLabelText("next");
    const elementStyle = window.getComputedStyle(nextButton);

    if (buttons === "outer") {
      expect(elementStyle.getPropertyValue("align-self")).toBe("center");
    } else {
      expect(elementStyle.getPropertyValue("position")).toBe("absolute");
      expect(elementStyle.getPropertyValue("top")).toBe("0px");
      expect(elementStyle.getPropertyValue("bottom")).toBe("0px");
      expect(elementStyle.getPropertyValue("margin")).toBe("auto 0px");
      expect(elementStyle.getPropertyValue("z-index")).toBe("1");
    }
  });

  it("checks buttons = none is properly shown", async () => {
    await setup({ buttons: "none" });

    const nextButton = Test.screen.queryByLabelText("next");
    const previousButton = Test.screen.queryByLabelText("previous");

    expect(nextButton).not.toBeInTheDocument();
    expect(previousButton).not.toBeInTheDocument();
  });

  it.each(["outer", "inner"])("checks stepper is properly shown", async (stepper) => {
    await setup({ stepper });

    const stepperElement = Test.screen.getByTestId("stepper");
    const elementStyle = window.getComputedStyle(stepperElement);

    if (stepper === "inner") {
      expect(elementStyle.getPropertyValue("position")).toBe("absolute");
      expect(elementStyle.getPropertyValue("inset-inline-start")).toBe("50%");
      expect(elementStyle.getPropertyValue("bottom")).toBe("0px");
      expect(elementStyle.getPropertyValue("transform")).toBe("translateX(-50%)");
      expect(elementStyle.getPropertyValue("z-index")).toBe("1");
    } else {
      expect(stepperElement).toHaveGdsSpacing("padding-left", ["fixed", "e"]);
      expect(stepperElement).toHaveGdsSpacing("padding-top", ["fixed", "e"]);
      expect(stepperElement).toHaveGdsSpacing("padding-right", ["fixed", "e"]);
    }
  });

  it("checks stepper = none is properly shown", async () => {
    await setup({ stepper: "none" });

    const stepperElement = Test.screen.queryByTestId("stepper");

    expect(stepperElement).not.toBeInTheDocument();
  });

  it("checks colorScheme is properly shown", async () => {
    await setup({ colorScheme: "green" });

    expect(Test.screen.queryByLabelText("previous")).toHaveGdsShape([
      "interactiveElement",
      "light",
      "green",
      "subdued",
    ]);
    expect(Test.screen.getByTestId("step-0")).toHaveGdsShape(["interactiveElement", "light", "green", "highlighted"]);
  });

  it("checks virtualization is properly shown", async () => {
    await setup({ virtualization: true });

    expect(Test.screen.queryByText("item3")).not.toBeInTheDocument();
    expect(Test.screen.getByTestId("item-2")).toBeInTheDocument();
  });

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(2);
  });
});
