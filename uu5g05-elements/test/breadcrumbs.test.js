import { Breadcrumbs } from "uu5g05-elements";
import { VisualComponent, Test } from "uu5g05-test";

let origGetBoundingClientRect;
beforeEach(() => {
  origGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    let width = this.tagName === "DIV" ? 1000 : 100;
    let height = 100;
    let result = { left: 0, top: 0, right: width, bottom: height, width, height };
    return { ...result, toJSON: () => result };
  };
});
afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = origGetBoundingClientRect;
});

function getDefaultProps() {
  return {
    itemList: [
      { children: "item1" },
      { children: "item2", href: "https://www.plus4u.net/" },
      { children: "item3", collapsed: true },
    ],
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Breadcrumbs, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Breadcrumbs", () => {
  VisualComponent.testProperties(setup);

  it("checks itemList is properly shown", async () => {
    await setup();

    expect(Test.screen.getByText("item1")).toBeInTheDocument();
    expect(Test.screen.getByText("item2")).toBeInTheDocument();
    expect(Test.screen.queryByText("item3")).not.toBeInTheDocument();
    expect(Test.screen.getByRole("link", { name: "item2" })).toBeInTheDocument();
  });
});
