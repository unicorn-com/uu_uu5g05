import { Header } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Header, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Header", () => {
  VisualComponent.testProperties(setup);

  it("checks icon is properly shown", async () => {
    const icon = "uugds-favorites";
    const props = { icon };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  it("checks title is properly called", async () => {
    const props = { title: "Title" };
    await setup(props);

    expect(Test.screen.getByText("Title")).toBeInTheDocument();
  });

  it("checks subtitle is properly called", async () => {
    const props = { subtitle: "Subtitle" };
    await setup(props);

    expect(Test.screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it("checks title and subtitle are properly called", async () => {
    const props = { title: "Title", subtitle: "Subtitle" };
    await setup(props);

    expect(Test.screen.getByText("Title")).toBeInTheDocument();
    expect(Test.screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it("checks icon with title and subtitle is properly shown", async () => {
    const icon = "uugds-favorites";
    const props = { icon, title: "Title", subtitle: "Subtitle" };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
    expect(Test.screen.getByText("Title")).toBeInTheDocument();
    expect(Test.screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it.each([[1], [2], [3], [4], [5]])("checks level=%p is properly shown", async (level) => {
    const props = { title: "Title", subtitle: "Subtitle", level };
    await setup(props);

    expect(Test.screen.getByText("Title")).toHaveGdsTypography(["story", "heading", "h" + level]);
    expect(Test.screen.getByText("Subtitle")).not.toHaveGdsTypography(["story", "heading", "h" + level]);
  });

  it.each([
    ["horizontal", '"icon title subtitle"'],
    ["vertical", '"icon title" "icon subtitle"'],
    ["vertical-reverse", '"icon subtitle" "icon title"'],
  ])("checks direction property is properly passed", async (direction, gridTemplateAreas) => {
    const { element } = await setup({ direction, title: "title", subtitle: "subtitle" });

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("grid-template-areas")).toBe(gridTemplateAreas);
  });

  it("checks onIconClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onIconClick: handleClick, icon: "Test" };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.children }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks onIconClick is not called when icon is not a string", async () => {
    const handleClick = jest.fn();
    const props = { onIconClick: handleClick, icon: 22 };
    const { user } = await setup(props);

    await user.click(Test.screen.getByText("22"));

    expect(handleClick).toHaveBeenCalledTimes(0);
  });
});
