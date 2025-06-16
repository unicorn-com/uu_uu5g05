import { Svg } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return { code: "uugdssvg-svg-account" };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Svg, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Svg", () => {
  it("checks default property values", async () => {
    const { element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("height")).toBe("88px");
    expect(Test.screen.queryByRole("img")).not.toBeInTheDocument();
    expect(element).toHaveGdsShape(["text", "light", "steel", "common"], { cssReset: false });
  });

  it("checks uri is properly shown", async () => {
    const props = {
      uri: "Testhttps://cdn.plus4u.net/uu-gds-svgg01/1.0.0/assets/illustrations/activity/task.svg",
    };
    await setup(props);

    expect(Test.screen.getByRole("img")).toBeInTheDocument();
  });

  it("checks type = img is properly shown", async () => {
    const props = { type: "img" };
    await setup(props);

    expect(Test.screen.getByRole("img")).toBeInTheDocument();
  });

  it("checks type = svg is properly shown", async () => {
    const props = { type: "svg" };
    await setup(props);

    expect(Test.screen.queryByRole("img")).not.toBeInTheDocument();
    expect(Test.screen.getByTestId("component-1")).toBeInTheDocument();
  });

  VisualComponent.testColorScheme(setup, "text", "green", "common", false);

  it("checks height is properly shown", async () => {
    const height = 200;
    const props = {
      height,
    };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);

    expect(elementStyle.getPropertyValue("height")).toBe(`${height}px`);
  });

  it("checks children is properly shown", async () => {
    const props = { children: "Test" };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(1);
  });
});
