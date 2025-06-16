import { PropTypes } from "uu5g05";
import { ButtonGroup } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";
import { addMatcherToHaveLineShape } from "./internal/line-tools.js";

const { COLOR_SCHEME } = PropTypes;

addMatcherToHaveLineShape();

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
      { children: "Left" },
      { icon: "uugds-pencil" },
      { icon: "uugds-check", children: "Right", itemList: [{ children: "Dropdown item 1" }] },
    ],
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(ButtonGroup, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.ButtonGroup", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values (with itemList)", async () => {
    const { element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(Test.screen.getByText("Left")).toBeInTheDocument();
    expect(Test.screen.getByText("Right")).toBeInTheDocument();
    const iconList = Test.screen.getAllByTestId("icon");
    expect(iconList.length).toBe(2);
    expect(iconList[0]).toHaveClass("uugds-pencil");
    expect(iconList[1]).toHaveClass("uugds-check");

    let firstButtonElement = element.childNodes[0];
    let firstButtonStyle = getComputedStyle(firstButtonElement);
    expect(firstButtonStyle.getPropertyValue("border-start-end-radius")).toBe("0");
    expect(firstButtonStyle.getPropertyValue("border-end-end-radius")).toBe("0");
    expect(firstButtonElement).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"]);
    expect(firstButtonElement).toHaveGdsSize(["spot", "basic", "m"]);
    expect(Test.screen.getByRole("button", { name: "Left" })).toBe(firstButtonElement);

    let firstSeparatorElement = element.childNodes[1];
    expect(firstSeparatorElement).toHaveLineShape(["light", "neutral", "subdued"], "vertical");

    let secondButtonElement = element.childNodes[2];
    let secondButtonStyle = getComputedStyle(secondButtonElement);
    expect(secondButtonStyle.getPropertyValue("border-start-end-radius")).toBe("0");
    expect(secondButtonStyle.getPropertyValue("border-end-start-radius")).toBe("0");
    expect(secondButtonStyle.getPropertyValue("border-start-start-radius")).toBe("0");
    expect(secondButtonStyle.getPropertyValue("border-end-end-radius")).toBe("0");
    expect(secondButtonElement).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"]);
    expect(secondButtonElement).toHaveGdsSize(["spot", "basic", "m"]);

    let secondSeparatorElement = element.childNodes[3];
    expect(secondSeparatorElement).toHaveLineShape(["light", "neutral", "subdued"], "vertical");

    // dropdown
    let thirdButtonElement = element.childNodes[4];
    let thirdButtonStyle = getComputedStyle(thirdButtonElement);
    expect(thirdButtonStyle.getPropertyValue("border-start-end-radius")).not.toBe("0");
    expect(thirdButtonStyle.getPropertyValue("border-end-start-radius")).toBe("0");
    expect(thirdButtonStyle.getPropertyValue("border-start-start-radius")).toBe("0");
    expect(thirdButtonStyle.getPropertyValue("border-end-end-radius")).not.toBe("0");
    expect(thirdButtonElement).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"]);
    expect(thirdButtonElement).toHaveGdsSize(["spot", "basic", "m"]);
    expect(Test.screen.getByRole("button", { name: "Right", expanded: false })).toBe(thirdButtonElement);

    expect(elementStyle.getPropertyValue("width")).toBe("");
    expect(element).toHaveGdsRadius(["spot", "moderate"], { height: 36 });
  });

  it.each(
    [...COLOR_SCHEME.building, ...COLOR_SCHEME.meaning, ...COLOR_SCHEME.basic].map((colorScheme) => [colorScheme]),
  )("checks colorScheme is propagated onto buttons", async (colorScheme) => {
    const props = { colorScheme };
    await setup(props);
    const buttonList = Test.screen.getAllByRole("button");
    for (let buttonElement of buttonList) {
      expect(buttonElement).toHaveGdsShape(["interactiveElement", "light", colorScheme, "common"]);
    }
  });

  it.each([["common"], ["highlighted"], ["distinct"], ["subdued"]])(
    "checks significance is propagated onto buttons",
    async (significance) => {
      const props = { significance };
      await setup(props);
      const buttonList = Test.screen.getAllByRole("button");
      for (let buttonElement of buttonList) {
        expect(buttonElement).toHaveGdsShape(["interactiveElement", "light", "neutral", significance]);
      }
    },
  );

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive", "full"],
    { height: 36 },
    "spot",
  );

  it.each([["xxs"], ["xs"], ["s"], ["m"], ["l"], ["xl"]])("checks size is propagated onto buttons", async (size) => {
    const props = { size };
    await setup(props);
    const buttonList = Test.screen.getAllByRole("button");
    for (let buttonElement of buttonList) {
      expect(buttonElement).toHaveGdsSize(["spot", "basic", size]);
    }
  });

  it.each(["400px", "50%", "8em"])("checks width = %s is properly set to root element", async (width) => {
    const props = { width };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);
    expect(elementStyle.getPropertyValue("width")).toBe(width);
  });
});
