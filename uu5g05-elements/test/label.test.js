import Uu5 from "uu5g05";
import { Label } from "uu5g05-elements";
import { VisualComponent, Test } from "uu5g05-test";

function getDefaultProps() {
  return {
    children: "Test",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Label, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Label", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const { element } = await setup();

    expect(element).toHaveGdsTypography(["interface", "content", "medium"]);
    expect(element).toHaveGdsShape(["text", "light", "dim", "common"], { cssReset: false });
  });

  it.each(["Test info", { en: "Info" }])("checks info is properly shown", async (info) => {
    const props = { info };
    await setup(props);

    expect(Test.screen.getByRole("button", { name: "Info" })).toBeInTheDocument();
  });

  it("checks info as node is properly shown", async () => {
    const LsiComponent = jest.fn((props) => {
      let Component = Uu5.Lsi;
      return <Component {...props} lsi={{ en: "Some text...", cs: "Nějaký text..." }} />;
    });
    const info = <LsiComponent />;
    const props = { info };
    await setup(props);

    expect(Test.screen.getByRole("button", { name: "Info" })).toBeInTheDocument();
  });

  it.each([
    ["xxs", "xsmall"],
    ["xs", "small"],
    ["s", "medium"],
    ["m", "medium"],
    ["l", "large"],
    ["xl", "large"],
  ])("checks size = %s is properly applied", async (size, type) => {
    const props = { size };
    const { element } = await setup(props);

    expect(element).toHaveGdsTypography(["interface", "content", type]);
  });

  it("checks htmlFor is properly shown", async () => {
    const props = { htmlFor: "name" };
    const { element } = await setup(props);

    expect(element).toHaveAttribute("for");
  });

  VisualComponent.testColorScheme(setup, "text", "red", "common", false);

  VisualComponent.testSignificance(setup, "text", "dim", ["common", "subdued"], false);

  it("checks empty children is properly shown", async () => {
    const props = { children: undefined };
    const { element } = await setup(props);

    expect(element.childNodes.length).toBe(0);
  });
});
