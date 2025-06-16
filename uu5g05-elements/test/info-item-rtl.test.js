import { BackgroundProvider } from "uu5g05";
import { InfoItem } from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    title: "Title", // component doesn't render anything without title/subtitle/icon
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(InfoItem, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.InfoItem", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    const props = { title: "Test" };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);

    const titleElement = Test.screen.getByTestId("title");
    expect(titleElement).toBeInTheDocument();
    expect(Test.screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(Test.screen.queryByRole("link")).not.toBeInTheDocument();
    expect(Test.screen.queryByTestId("subtitle")).not.toBeInTheDocument();
    expect(titleElement).toHaveGdsShape(["text", "light", "building", "common"], { cssReset: false });
    expect(elementStyle.getPropertyValue("grid-template-areas")).toBe('"icon title" "icon title"');
    expect(Test.screen.queryByRole("button", { name: props.title })).not.toBeInTheDocument();
  });

  it("checks icon is properly shown", async () => {
    const icon = "uugds-favorites";
    const props = { icon, title: undefined };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  it("checks icon with title is properly shown", async () => {
    const icon = "uugds-play-circle";
    const props = { icon, title: "Test" };
    await setup(props);

    const iconElement = Test.screen.getByTestId("icon");

    expect(iconElement).toBeVisible();
    expect(iconElement).toHaveClass(icon);
  });

  it("checks iconText is properly shown", async () => {
    const props = { iconText: "Test" };
    await setup(props);

    expect(Test.screen.getByText("Test")).toBeInTheDocument();
  });

  it("checks imageSrc is properly called", async () => {
    const props = { imageSrc: "https://cdn.plus4u.net/uu-plus4u5g01/4.0.0/assets/img/anonymous.png" };
    await setup(props);

    let img = Test.screen.getByRole("img");
    expect(img).toBeInTheDocument();
    let imgStyle = getComputedStyle(img);
    expect(imgStyle.backgroundImage).toBe(`url(${props.imageSrc})`);
  });

  it("checks title is properly called", async () => {
    const props = { title: "Title" };
    await setup(props);

    expect(Test.screen.getByTestId("title")).toBeInTheDocument();
  });

  it("checks subtitle is properly called", async () => {
    const props = { subtitle: "Subtitle" };
    await setup(props);

    expect(Test.screen.getByTestId("subtitle")).toBeInTheDocument();
  });

  it("checks title and subtitle are properly called", async () => {
    const props = { title: "Title", subtitle: "Subtitle" };
    await setup(props);

    expect(Test.screen.getByTestId("title")).toBeInTheDocument();
    expect(Test.screen.getByTestId("subtitle")).toBeInTheDocument();
  });

  it.each(["xxs", "xs", "s", "m", "l", "xl"])("checks size = %s is properly applied", async (size) => {
    const props = {
      size,
      icon: "https://example.com/a.svg",
    };
    await setup(props);
    const imgElement = Test.screen.getByRole("img");
    expect(imgElement).toHaveGdsSize(["spot", "basic", size]);
  });

  it("checks colorScheme is properly shown", async () => {
    const props = { colorScheme: "green", icon: "uugds-react", title: "Title", subtitle: "Subtitle" };
    await setup(props);

    const iconRootElement = Test.screen.getByTestId("icon").parentNode;
    const titleElement = Test.screen.getByTestId("title");
    const subtitleElement = Test.screen.getByTestId("subtitle");
    expect(iconRootElement).toHaveGdsShape(["interactiveElement", "light", props.colorScheme, "common"]);
    expect(titleElement).toHaveGdsShape(["text", "light", "building", "common"], { cssReset: false });
    expect(subtitleElement).toHaveGdsShape(["text", "light", "building", "subdued"], { cssReset: false });
  });

  it.each(["common", "highlighted", "subdued"])("checks significance = %s is properly shown", async (significance) => {
    const props = { significance, colorScheme: "building", icon: "uugds-react", title: "Title", subtitle: "Subtitle" };
    await setup(props);

    const iconRootElement = Test.screen.getByTestId("icon").parentNode;
    const titleElement = Test.screen.getByTestId("title");
    const subtitleElement = Test.screen.getByTestId("subtitle");
    expect(iconRootElement).toHaveGdsShape(["interactiveElement", "light", props.colorScheme, props.significance]);
    expect(titleElement).toHaveGdsShape(["text", "light", "building", "common"], { cssReset: false });
    expect(subtitleElement).toHaveGdsShape(["text", "light", "building", "subdued"], { cssReset: false });
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

  it("checks onClick is properly called", async () => {
    const handleClick = jest.fn();
    const props = { onClick: handleClick, title: "Test" };
    const { user } = await setup(props);

    await user.click(Test.screen.getByRole("button", { name: props.title }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it.each(["light", "dark", "full", "soft"])(
    "checks component has right effect for %s background",
    async (background) => {
      const Wrapper = ({ children }) => <BackgroundProvider background={background}>{children}</BackgroundProvider>;
      const props = {
        colorScheme: "building",
        significance: "common",
        icon: "uugds-react",
        title: "Title",
        subtitle: "Subtitle",
      };
      await setup(props, { Wrapper });

      const iconRootElement = Test.screen.getByTestId("icon").parentNode;
      const titleElement = Test.screen.getByTestId("title");
      const subtitleElement = Test.screen.getByTestId("subtitle");
      expect(iconRootElement).toHaveGdsShape(["interactiveElement", background, props.colorScheme, props.significance]);
      expect(titleElement).toHaveGdsShape(["text", background, "building", "common"], { cssReset: false });
      expect(subtitleElement).toHaveGdsShape(["text", background, "building", "subdued"], { cssReset: false });
    },
  );

  VisualComponent.testTooltip(setup);

  VisualComponent.testTooltipLsi(setup);

  it("checks empty title&subtitle&icon renders nothing", async () => {
    Test.render(
      <div data-testid="div">
        <InfoItem />
      </div>,
    );

    expect(Test.screen.getByTestId("div")).toBeEmptyDOMElement();
  });
});
