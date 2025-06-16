import { Pagination } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    count: 3,
    onChange: jest.fn(),
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Pagination, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Pagination", () => {
  VisualComponent.testProperties(setup);

  it("checks index is properly shown", async () => {
    await setup({ index: 1 });

    const firstButton = Test.screen.getByRole("button", { name: "1" });
    const secondButton = Test.screen.getByRole("button", { name: "2" });
    const thirdButton = Test.screen.getByRole("button", { name: "3" });

    expect(firstButton).toBeInTheDocument();
    expect(secondButton).toBeInTheDocument();
    expect(thirdButton).toBeInTheDocument();

    expect(firstButton).toHaveGdsShape(["interactiveElement", "light", "neutral", "subdued"]);
    expect(secondButton).toHaveGdsShape(["interactiveElement", "light", "neutral", "common"]);
    expect(thirdButton).toHaveGdsShape(["interactiveElement", "light", "neutral", "subdued"]);
  });

  it("checks onChange is properly called", async () => {
    const onChange = jest.fn();
    const props = {
      pageIndex: 1,
      onChange,
    };
    const { user } = await setup(props);

    const secondButton = Test.screen.getByRole("button", { name: "2" });
    await user.click(secondButton);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("checks count is properly shown", async () => {
    await setup({ count: 2 });

    const firstButton = Test.screen.getByRole("button", { name: "1" });
    const secondButton = Test.screen.getByRole("button", { name: "2" });
    const thirdButton = Test.screen.queryByRole("button", { name: "3" });

    expect(firstButton).toBeInTheDocument();
    expect(secondButton).toBeInTheDocument();
    expect(thirdButton).not.toBeInTheDocument();
  });

  it("checks type = compact is properly shown", async () => {
    const { user } = await setup({ type: "compact" });

    const compactButton = Test.screen.getByRole("button", { name: "Page 1 of 3" });
    await user.click(compactButton);

    expect(compactButton).toBeInTheDocument();
    const menuItem = Test.screen.getAllByRole("menuitem");

    expect(menuItem[0]).toBeInTheDocument();
    expect(menuItem[1]).toBeInTheDocument();
    expect(menuItem[2]).toBeInTheDocument();
    expect(Test.screen.getByRole("textbox")).toBeInTheDocument();
  });

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly set to root element", async (size) => {
    const props = { size };
    await setup(props);

    const buttonElement = Test.screen.getByRole("button", { name: "1" });

    expect(buttonElement).toHaveGdsSize(["spot", "basic", size]);
  });

  it("checks ellipsis is properly shown", async () => {
    await setup({ count: 30 });

    const ellipsisButton = Test.screen.getByRole("button", { name: "..." });

    expect(ellipsisButton).toBeInTheDocument();
    expect(ellipsisButton).toBeDisabled();
    expect(ellipsisButton).toHaveGdsShape(["interactiveElement", "light", "neutral", "subdued"]);
  });
});
