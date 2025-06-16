import { ListLayout } from "uu5g05-elements";
import { VisualComponent, Test } from "uu5g05-test";

const handleClick = jest.fn();
function getDefaultProps() {
  return {
    itemList: [
      {
        label: "Item1",
        children: "Test1",
        actionList: [{ icon: "uugds-pencil", children: "Edit", onClick: handleClick }],
      },
      { label: "Item2", children: "Test2", info: "Some info" },
    ],
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(ListLayout, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.ListLayout", () => {
  VisualComponent.testProperties(setup);

  it("checks itemList is properly displayed", async () => {
    await setup();

    expect(Test.screen.getByText("Item1")).toBeInTheDocument();
    expect(Test.screen.getByText("Item2")).toBeInTheDocument();
    expect(Test.screen.getByText("Test1")).toBeInTheDocument();
    expect(Test.screen.getByText("Test2")).toBeInTheDocument();

    expect(Test.screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(Test.screen.getByRole("button", { name: "Edit" }).firstChild).toHaveClass("uugds-pencil");
    expect(Test.screen.getByRole("button", { name: "Info" })).toBeInTheDocument();

    Test.fireEvent.click(Test.screen.getByRole("button", { name: "Edit" }));
    expect(handleClick).toHaveBeenCalledTimes(1);

    Test.fireEvent.click(Test.screen.getByRole("button", { name: "Info" }));
    expect(Test.screen.getByRole("tooltip", { name: "Some info" })).toBeInTheDocument();
  });

  it("checks collapsibleItemList is properly displayed", async () => {
    const collapsibleItemList = [
      { label: "Age", children: 33 },
      { label: "Sex", children: "Male" },
    ];
    const { user } = await setup({ collapsibleItemList });
    const linkElement = Test.screen.getByText("Show more");

    expect(linkElement).toBeInTheDocument();

    await user.click(linkElement);

    expect(Test.screen.getByText("Age")).toBeInTheDocument();
    expect(Test.screen.getByText("33")).toBeInTheDocument();
  });
});
