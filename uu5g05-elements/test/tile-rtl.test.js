import { Tile } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return { children: "Test", aspectRatio: "1x1" };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Tile, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Tile", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    const elementStyle = window.getComputedStyle(element);

    expect(element).toHaveGdsShape(["ground", "light", "building", "common"]);
    expect(elementStyle.getPropertyValue("position")).toBe("relative");
  });

  it("checks actionList property is properly shown", async () => {
    const actionName = "Test action";
    const handleClick = jest.fn();
    const actionList = [{ children: actionName, onClick: handleClick }];
    const { user } = await setup({ actionList });

    await user.click(Test.screen.getByRole("button", { name: actionName }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  VisualComponent.testSignificance(setup, "ground", "building", ["common", "distinct", "subdued"]);

  it.each(["highlighted", "common"])("checks headerSignificance = %s is properly shown", async (headerSignificance) => {
    const props = { headerSignificance, header: "header" };
    const { element } = await setup(props);

    expect(element).toHaveGdsShape(["ground", "light", "building", "common"]);
    expect(Test.screen.getByTestId("header")).toHaveGdsShape(["background", "light", "building", headerSignificance]);
  });

  it.each(["highlighted", "common"])("checks footerSignificance = %s is properly shown", async (footerSignificance) => {
    const props = { footerSignificance, footer: "footer" };
    const { element } = await setup(props);

    expect(element).toHaveGdsShape(["ground", "light", "building", "common"]);
    expect(Test.screen.getByTestId("footer")).toHaveGdsShape(["ground", "light", "building", footerSignificance]);
  });

  it("checks headerColorScheme is properly shown", async () => {
    const headerColorScheme = "green";
    const props = { headerColorScheme, header: "header" };
    await setup(props);

    expect(Test.screen.getByTestId("header")).toHaveGdsShape(["background", "light", headerColorScheme, "distinct"]);
  });

  it("checks footerColorScheme is properly shown", async () => {
    const footerColorScheme = "green";
    const props = { footerColorScheme, footer: "footer" };
    await setup(props);

    expect(Test.screen.getByTestId("footer")).toHaveGdsShape(["ground", "light", footerColorScheme, "distinct"]);
  });

  it.each(["header", <section key="0">header</section>])("checks header is properly called", async (header) => {
    const props = { header };
    await setup(props);

    expect(Test.screen.getByText("header")).toBeInTheDocument();
  });

  it("checks headerOverlap is properly called", async () => {
    const props = { header: "header", headerOverlap: true };
    await setup(props);

    const elementStyle = window.getComputedStyle(Test.screen.getByTestId("header"));

    expect(Test.screen.getByText("header")).toBeInTheDocument();
    expect(elementStyle.getPropertyValue("position")).toBe("absolute");
    expect(elementStyle.getPropertyValue("top")).toBe("0px");
  });

  it("checks footerOverlap is properly called", async () => {
    const props = { footer: "footer", footerOverlap: true };
    await setup(props);

    const elementStyle = window.getComputedStyle(Test.screen.getByTestId("footer"));

    expect(Test.screen.getByText("footer")).toBeInTheDocument();
    expect(elementStyle.getPropertyValue("position")).toBe("absolute");
    expect(elementStyle.getPropertyValue("bottom")).toBe("0px");
  });

  it.each(["footer", <section key="0">footer</section>])("checks footer is properly called", async (footer) => {
    const props = { footer };
    await setup(props);

    expect(Test.screen.getByText("footer")).toBeInTheDocument();
  });

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(0);
  });
});
