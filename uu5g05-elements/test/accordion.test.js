import { Accordion } from "uu5g05-elements";
import { VisualComponent, Test } from "uu5g05-test";

function getDefaultProps() {
  return {
    itemList: [
      { header: "item1", initialOpen: true, children: "test" },
      { header: "item2", children: "test" },
      { header: "item3", children: "test" },
    ],
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Accordion, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Accordion", () => {
  VisualComponent.testProperties(setup);

  it("checks itemList is properly shown", async () => {
    const { user } = await setup();

    expect(Test.screen.getByRole("button", { name: "item1" })).toBeInTheDocument();
    expect(Test.screen.getByRole("button", { name: "item2" })).toBeInTheDocument();
    expect(Test.screen.getByRole("button", { name: "item3" })).toBeInTheDocument();
    expect(Test.screen.getByTestId("panel-0")).toHaveAttribute("aria-expanded", "true");

    await user.click(Test.screen.getByRole("button", { name: "item2" }));

    expect(Test.screen.getByTestId("panel-0")).toHaveAttribute("aria-expanded", "false");
    expect(Test.screen.getByTestId("panel-1")).toHaveAttribute("aria-expanded", "true");
    expect(Test.screen.getByTestId("panel-2")).toHaveAttribute("aria-expanded", "false");

    await user.click(Test.screen.getByRole("button", { name: "item3" }));

    expect(Test.screen.getByTestId("panel-0")).toHaveAttribute("aria-expanded", "false");
    expect(Test.screen.getByTestId("panel-1")).toHaveAttribute("aria-expanded", "false");
    expect(Test.screen.getByTestId("panel-2")).toHaveAttribute("aria-expanded", "true");
  });
});
