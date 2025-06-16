import { LinkPanel } from "uu5g05-elements";
import { VisualComponent, Test } from "uu5g05-test";

function getDefaultProps() {
  return {
    header: "Test",
    children: "children",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(LinkPanel, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.LinkPanel", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    await setup({ open: false });

    const linkElement = Test.screen.getByRole("link", { name: "Test" });

    expect(linkElement).toBeInTheDocument();
    expect(Test.screen.getByText("Test")).toBeInTheDocument();
    expect(Test.screen.queryByText("children")).not.toBeInTheDocument();
    expect(linkElement).toHaveGdsShape(["text", "light", "building", "common"], { cssReset: false });
  });

  it("checks open = true is properly shown", async () => {
    const props = { open: true };
    await setup(props);

    const collapsibleBox = Test.screen.getByTestId("collapsible-box");
    const elementStyle = window.getComputedStyle(collapsibleBox);

    expect(elementStyle.getPropertyValue("overflow")).not.toBe("hidden");
    expect(elementStyle.getPropertyValue("height")).not.toBe("0px");
    expect(Test.screen.getByText("children")).toBeInTheDocument();
  });

  it("checks onChange is properly called", async () => {
    const handleClick = jest.fn();
    const props = {
      onChange: handleClick,
    };
    const { user } = await setup(props);
    const header = Test.screen.getByRole("link", { name: "Test" });

    await user.click(header);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks colorScheme is properly shown", async () => {
    await setup({ colorScheme: "primary" });
    const linkElement = Test.screen.getByRole("link", { name: "Test" });

    expect(linkElement).toHaveGdsShape(["text", "light", "primary", "common"], { cssReset: false });
  });

  it.each(["common", "subdued"])("checks significance = %s is properly shown", async (significance) => {
    await setup({ significance });
    const linkElement = Test.screen.getByRole("link", { name: "Test" });

    expect(linkElement).toHaveGdsShape(["text", "light", "building", significance], { cssReset: false });
  });

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childElementCount).toBe(2);
  });
});
