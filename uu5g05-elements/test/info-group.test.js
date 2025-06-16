import { InfoGroup } from "uu5g05-elements";
import Uu5Elements from "uu5g05-elements";
import { Test, VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    itemList: [
      {
        subtitle: "Subtitle 1",
        title: "Title 1",
      },
      {
        imageSrc: "https://cdn.plus4u.net/uu-plus4u5g01/4.0.0/assets/img/anonymous.png",
        subtitle: "Subtitle 2",
        title: "Title 2",
      },
    ],
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(InfoGroup, { ...getDefaultProps(), ...props }, opts);
}

describe("Uu5Elements.InfoGroup", () => {
  VisualComponent.testProperties(setup);

  it("checks default itemList is properly shown", async () => {
    await setup();

    expect(Test.screen.getByText("Title 1")).toBeInTheDocument();
    expect(Test.screen.getByText("Subtitle 1")).toBeInTheDocument();
    expect(Test.screen.getByText("Title 2")).toBeInTheDocument();
    expect(Test.screen.getByText("Subtitle 2")).toBeInTheDocument();
    expect(Test.screen.getByRole("img")).toBeInTheDocument();
  });

  it("checks itemList with component is properly shown", async () => {
    const CustomComponent = jest.fn((props) => {
      let Component = Uu5Elements.Button;
      return <Component {...props} />;
    });

    const props = {
      itemList: [{ component: <CustomComponent /> }],
    };
    await setup(props);

    expect(Test.screen.getByRole("button")).toBeInTheDocument();
  });

  it.each([
    ["xxs", "xsmall", "xsmall"],
    ["xs", "xsmall", "xsmall"],
    ["s", "small", "xsmall"],
    ["m", "medium", "small"],
    ["l", "large", "small"],
    ["xl", "large", "medium"],
  ])("checks size = %s is properly applied", async (size, title, subtitle) => {
    const props = {
      size,
      itemList: [
        {
          imageSrc: "https://cdn.plus4u.net/uu-plus4u5g01/4.0.0/assets/img/anonymous.png",
          subtitle: "Subtitle 1",
          title: "Title 1",
        },
      ],
    };
    await setup(props);

    // const titleElement = Test.screen.getByTestId("title");
    const subtitleElement = Test.screen.getByTestId("subtitle");
    const imgElement = Test.screen.getByRole("img");

    expect(imgElement).toHaveGdsSize(["spot", "basic", size]);
    expect(subtitleElement).toHaveGdsTypography(["interface", "content", subtitle]);
    // NOTE JSDOM currently ignores CSS rules specificity - https://github.com/jsdom/jsdom/issues/3318
    // InfoGroup overrides fontWeight to 700, but JSDOM computes it as 400 due to ignoring the specificity.
    //   => commented out for now
    // const typography = {
    //   ...UuGds.Typography.getValue(["interface", "content", title]),
    //   fontWeight: "700",
    // };
    // expect(titleElement).toHaveGdsTypography(typography);
  });

  it.each([
    ["vertical", "column"],
    ["horizontal", ""],
  ])("checks direction = %s is properly applied", async (direction, flex) => {
    const props = { direction };
    const { element } = await setup(props);

    const elementStyle = window.getComputedStyle(element);
    expect(elementStyle.getPropertyValue("flex-direction")).toBe(flex);
  });

  it("checks autoResize is properly shown", async () => {
    const { element } = await setup({ direction: "horizontal", autoResize: false });

    const elementStyle = window.getComputedStyle(element);
    expect(elementStyle.getPropertyValue("flex-wrap")).toBe("nowrap");
  });

  it.each([
    ["horizontal", '"icon title subtitle"'],
    ["vertical", '"icon title" "icon subtitle"'],
    ["vertical-reverse", '"icon subtitle" "icon title"'],
  ])("checks itemDirection = %s property is properly passed", async (itemDirection, gridTemplateAreas) => {
    await setup({ itemDirection });

    const imgElement = Test.screen.getByRole("img");
    const itemElement = imgElement.parentElement;
    const elementStyle = window.getComputedStyle(itemElement);

    expect(elementStyle.getPropertyValue("grid-template-areas")).toBe(gridTemplateAreas);
  });
});
