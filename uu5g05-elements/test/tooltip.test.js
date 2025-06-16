import { Tooltip, UuGds } from "uu5g05-elements";
import { VisualComponent } from "uu5g05-test";

function getDefaultProps() {
  return {
    delayMs: 0,
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Tooltip, { ...getDefaultProps(), ...props }, opts);
}

function withoutGdsEffect(shape) {
  let result = { ...shape };
  for (let stateName in shape) {
    let { effect, ...state } = shape[stateName];
    result[stateName] = state;
  }
  return result;
}

describe("Uu5Elements.Tooltip", () => {
  VisualComponent.testProperties(setup);
  //TODO test delayMs, element, elementOffset, preferredPosition, pageX, displayArrow, bottomSheet

  it("checks colorScheme is properly shown", async () => {
    const props = { colorScheme: "green", significance: "common" };
    const { element } = await setup(props);

    const gdsShape = withoutGdsEffect(
      UuGds.Shape.getValue(["overlay", "light", props.colorScheme, props.significance]),
    );
    expect(element).toHaveGdsShape(gdsShape);
  });

  it.each(["common", "highlighted"])("checks significance = %s is properly shown", async (significance) => {
    const props = { significance, colorScheme: "building" };
    const { element } = await setup(props);

    const gdsShape = withoutGdsEffect(
      UuGds.Shape.getValue(["overlay", "light", props.colorScheme, props.significance]),
    );
    expect(element).toHaveGdsShape(gdsShape);
  });

  it("checks onClose is working properly", async () => {
    const handleClose = jest.fn();
    const props = { onClose: handleClose };
    const { user } = await setup(props);

    expect(handleClose).toHaveBeenCalledTimes(0);

    await user.click(document.body);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  VisualComponent.testBorderRadius(
    setup,
    ["none", "elementary", "moderate", "expressive"],
    { height: 100, width: 100 },
    "box",
  );

  it("checks relative is working properly", async () => {
    const props = { relative: true, children: "content" };
    await setup(props);

    expect(document.querySelector('[data-uu5portaltype^="popover"]')).not.toBeInTheDocument();
  });
});
