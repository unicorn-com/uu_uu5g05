import { BackgroundProvider } from "uu5g05";
import { Flag } from "uu5g05-elements";
import { VisualComponent, Test } from "uu5g05-test";

function getDefaultProps() {
  return {
    code: "gb",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Flag, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Flag", () => {
  VisualComponent.testProperties(setup);

  it("checks src is properly shown", async () => {
    const props = { src: "https://cdn.plus4u.net/uu-gds-svgg01/1.0.0/assets/flags/us-rectangle.svg" };
    await setup(props);

    let img = Test.screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(Test.screen.queryByRole("img")).toHaveAttribute("src", props.src);
  });

  it("checks code is properly shown", async () => {
    await setup();

    let img = Test.screen.getByRole("img", { name: "gb" });
    expect(img).toBeInTheDocument();
    expect(Test.screen.queryByRole("img")?.getAttribute?.("src")).toMatch(/\/assets\/flags\/gb-rectangle\.svg$/);
    expect(img).not.toHaveGdsBorder(["solidThin"]);
  });

  it.each([
    ["rectangle", "rectangle"],
    ["square", "square"],
    ["circle", "square"],
  ])("checks type is properly shown", async (type, shape) => {
    const { element } = await setup({ type });
    const elementStyle = window.getComputedStyle(element);

    expect(element?.getAttribute?.("src")).toMatch(new RegExp(`/assets/flags/gb-${shape}\\.svg$`));
    if (type === "circle") {
      expect(elementStyle.getPropertyValue("border-radius")).toBe("50%");
    }
  });

  it.each(["light", "dark"])(
    "checks component has right effect for %s background and bordered = true",
    async (background) => {
      const Wrapper = ({ children }) => <BackgroundProvider background={background}>{children}</BackgroundProvider>;
      const { element } = await setup({ bordered: true }, { Wrapper });

      expect(element).toHaveGdsBorder(["solidThin"]);
      expect(element).toHaveGdsColor(["building", background, "main"], "border-color");
    },
  );

  it.each(["400px", "50%", "8em"])("checks height = %s is properly set to root element", async (height) => {
    const props = { height };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);
    expect(elementStyle.getPropertyValue("height")).toBe(height);
  });

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive", "full"],
    { height: 100, width: 100 },
    "box",
  );
});
