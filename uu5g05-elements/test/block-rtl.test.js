import { BackgroundProvider } from "uu5g05";
import { Block, UuGds } from "uu5g05-elements";
import { Test, Utils, VisualComponent, Config } from "uu5g05-test";

function getDefaultProps() {
  /* Change */
  return {};
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Block, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.Block", () => {
  VisualComponent.testProperties(setup);

  it("checks card = full sets effect around whole component", async () => {
    const card = "full";
    const children = "Test content";
    const { element } = await setup({ card, children });

    // TODO MFA Improve content selector by adding data-testid.
    const contentElement = Test.screen.getByText(children).parentElement;
    expect(element).toHaveGdsEffect(["elevationGround"]);
    expect(contentElement).toBeWithoutGdsEffect();
  });

  it("checks card = content sets effect only around content", async () => {
    const card = "content";
    const children = "Test content";
    const { element } = await setup({ card, children });

    // TODO MFA Improve content selector by adding data-testid. But why there is so many divs?
    const contentElement = Test.screen.getByText(children).parentElement.parentElement;
    expect(element).toBeWithoutGdsEffect();
    expect(contentElement).toHaveGdsEffect(["elevationGround"]);
  });

  it("checks card = none switches off all effects ", async () => {
    const card = "none";
    const children = "Test content";
    const { element } = await setup({ card, children });

    // TODO MFA Improve content selector by adding data-testid.
    const contentElement = Test.screen.getByText(children).parentElement;
    expect(element).toBeWithoutGdsEffect();
    expect(contentElement).toBeWithoutGdsEffect();
  });

  it("checks actionList property is properly shown and usable", async () => {
    const actionName = "Test action";
    const handleClick = jest.fn();
    const actionList = [{ children: actionName, onClick: handleClick }];
    const { user } = await setup({ actionList });

    await user.click(Test.screen.getByRole("button", { name: actionName }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("checks header property is properly shown", async () => {
    const header = "Test header";
    await setup({ header });

    expect(Test.screen.getByText(header)).toBeVisible();
  });

  it("checks headerSeparator is properly shown", async () => {
    const header = "Test header";
    const { element } = await setup({ header, headerSeparator: true });

    const headerElement = element.firstChild;
    expect(headerElement).toHaveGdsBorder(["solidThin"], "border-bottom");
  });

  it("checks headerType = title is properly shown", async () => {
    const header = "Test header";
    await setup({ header, headerType: "title" });

    const headerElement = Test.screen.getByText(header);
    expect(headerElement).toHaveGdsTypography(["interface", "title", "common"]);
  });

  it("checks headerType = heading is properly shown", async () => {
    const header = "Test header";
    await setup({ header, headerType: "heading" });

    const headerElement = Test.screen.getByText(header);
    expect(headerElement).toHaveGdsTypography(["story", "heading", "h1"]);
  });

  it("checks level property is properly shown", async () => {
    const header = "Test header";
    await setup({ header, headerType: "heading", level: 3 });

    const headerElement = Test.screen.getByText(header);
    expect(headerElement).toHaveGdsTypography(["story", "heading", "h3"]);
  });

  it("checks level is properly inherited when undefined", async () => {
    const parentHeader = "Test parent header";
    const childHeader = "Test children header";
    const children = <Block headerType="heading" header={childHeader} />;
    await setup({ header: parentHeader, headerType: "heading", level: 3, children });

    const parentHeaderElement = Test.screen.getByText(parentHeader);
    const childHeaderElement = Test.screen.getByText(childHeader);

    expect(parentHeaderElement).toHaveGdsTypography(["story", "heading", "h3"]);
    expect(childHeaderElement).toHaveGdsTypography(["story", "heading", "h4"]);
  });

  it("checks footer property is properly shown", async () => {
    const footer = "Test footer";
    await setup({ footer });

    expect(Test.screen.getByText(footer)).toBeVisible();
  });

  it("checks footerSeparator is properly shown", async () => {
    const footer = "Test footer";
    await setup({ footer, footerSeparator: true });

    const footerElement = Test.screen.getByText(footer);
    expect(footerElement).toHaveGdsBorder(["solidThin"], "border-top");
    expect(footerElement).toHaveGdsColor(["building", "light", "mainDarkest"], "border-top-color");
  });

  it("checks info is hidden by default", async () => {
    const info = "Test info";
    const { user } = await setup({ info });

    // TODO MFA Discuss with authors why it is ALWAYS rendered in the background with height 0px?
    // expect(screen.getByText(info)).not.toBeInTheDocument();
    expect(Test.screen.queryByText(info)).not.toBeInTheDocument();

    const moreInfoBtn = Test.screen.getByTitle("Help");
    await user.click(moreInfoBtn);

    expect(Test.screen.getByText(info)).toBeInTheDocument();
  });

  it("checks initialDisplayInfo ensures info is visible by default", async () => {
    const info = "Test info";
    await setup({ info, initialDisplayInfo: true });

    // TODO MFA Discuss with authors why it is rendered in the background with height 0px?
    expect(Test.screen.getByText(info)).toBeVisible();
  });

  it("checks collapsible property allows to hide content and footer", async () => {
    const children = "Test content";
    const footer = "Test footer";
    const { user } = await setup({ children, footer, collapsible: true });

    await user.click(Test.screen.getByRole("button", { name: "Collapse" }));

    const contentElement = Test.screen.getByText(children);
    const footerElement = Test.screen.getByText(footer);

    expect(contentElement.parentElement).toEqual(footerElement.parentElement);

    const wrapperElement = contentElement.parentElement;
    const wrapperStyle = window.getComputedStyle(wrapperElement);

    expect(wrapperStyle.getPropertyValue("height")).toBe("0px");
  });

  it("checks initialCollapsed property hides content and footer", async () => {
    const children = "Test content";
    const footer = "Test footer";
    await setup({ children, footer, collapsible: true, initialCollapsed: true });

    const wrapperElement = Test.screen.getByTestId("body");
    const wrapperStyle = window.getComputedStyle(wrapperElement);

    expect(wrapperStyle.getPropertyValue("height")).toBe("0px");
  });

  it("checks contentMaxHeight property is properly passed to content element", async () => {
    Utils.omitConsoleLogs('Property "contentMaxHeight" is deprecated');
    const contentMaxHeight = 500;
    const children = "Test content";
    await setup({ children, contentMaxHeight });

    const contentElement = Test.screen.getByText(children);
    const contentStyle = window.getComputedStyle(contentElement);

    expect(contentStyle.getPropertyValue("max-height")).toBe(`${contentMaxHeight}px`);
  });

  // TODO MFA - GDS returns min(NaNpx, 40px) for full radius BUT component has only 40px
  it.each(["none", "elementary", "moderate", "expressive"])(
    "checks borderRadius = %s is properly set to root element with card = full",
    async (borderRadius) => {
      const width = "500px";
      const height = "500px";
      const className = Config.Css.css({ width, height });
      const { element } = await setup({ card: "full", className, borderRadius });

      expect(element).toHaveGdsRadius(["box", borderRadius], { height, width });
    },
  );

  // TODO MFA - GDS returns min(NaNpx, 40px) for full radius BUT component has only 40px
  it.each(["none", "elementary", "moderate", "expressive"])(
    "checks borderRadius = %s is properly set to content element with card = content",
    async (borderRadius) => {
      const width = "500px";
      const height = "500px";
      const children = "Test content";
      const className = Config.Css.css({ width, height });
      await setup({ card: "content", children, className, borderRadius });

      const contentElement = Test.screen.getByText(children).parentElement.parentElement;
      expect(contentElement).toHaveGdsRadius(["box", borderRadius], { height, width });
    },
  );

  // TODO MFA It should be possible to send lsi without en: but it triggers error
  it("checks lsi property properly overrides default content", async () => {
    const lsi = {
      moreInfo: { en: "Test more info" },
      expand: { en: "Test expand" },
      collapse: { en: "Test collapse" },
    };

    const { user } = await setup({ info: "Some info", collapsible: true, lsi });

    expect(Test.screen.getByTitle(lsi.moreInfo.en)).toBeVisible();
    expect(Test.screen.getByTitle(lsi.collapse.en)).toBeVisible();

    await user.click(Test.screen.getByTitle(lsi.collapse.en));

    expect(Test.screen.getByTitle(lsi.expand.en)).toBeVisible();
  });

  it("checks children as function is properly called", async () => {
    const children = jest.fn();
    await setup({ children, headerSeparator: true, footerSeparator: true, card: "full" });

    expect(children).toHaveBeenCalledTimes(1);
    expect(children.mock.lastCall[0]).toEqual({
      style: {
        paddingTop: UuGds.SpacingPalette.getValue(["adaptive", "largeScreen"]).normal.d,
        paddingBottom: UuGds.SpacingPalette.getValue(["adaptive", "largeScreen"]).normal.d,
        paddingLeft: UuGds.SpacingPalette.getValue(["adaptive", "largeScreen"]).normal.d,
        paddingRight: UuGds.SpacingPalette.getValue(["adaptive", "largeScreen"]).normal.d,
      },
    });
  });

  it("checks footer as function is properly called", async () => {
    const footer = jest.fn();
    await setup({ footer });

    expect(footer).toHaveBeenCalledTimes(1);
    expect(footer.mock.lastCall[0]).toEqual({
      style: {
        paddingTop: UuGds.SpacingPalette.getValue(["adaptive", "largeScreen"]).normal.d,
      },
    });
  });

  it.each(["common", "highlighted", "distinct", "subdued"])(
    "checks significance = %s is properly shown",
    async (significance) => {
      const { element } = await setup({ significance, card: "full" });

      expect(element).toHaveGdsShape(["ground", "light", "building", significance]);
    },
  );

  it.each(["light", "dark", "full", "soft"])(
    "checks component has right effect for %s background and card = full",
    async (background) => {
      const Wrapper = ({ children }) => <BackgroundProvider background={background}>{children}</BackgroundProvider>;
      const { element } = await setup({ card: "full" }, { Wrapper });

      expect(element).toHaveGdsShape(["ground", background, "building", "common"]);
    },
  );

  it.each(["light", "dark", "full", "soft"])(
    "checks component has right effect for %s background and card = content",
    async (background) => {
      const Wrapper = ({ children }) => <BackgroundProvider background={background}>{children}</BackgroundProvider>;
      const children = "Test content";
      await setup({ children, card: "content" }, { Wrapper });

      const contentWrapper = Test.screen.getByText(children).parentElement.parentElement;
      expect(contentWrapper).toHaveGdsShape(["ground", background, "building", "common"]);
    },
  );
});
