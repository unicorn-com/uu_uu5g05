import { InputComponent, VisualComponent } from "uu5g05-test";
import { Input } from "uu5g05-elements";

function getDefaultProps() {
  return {};
}

async function setup(props = {}, opts) {
  const api = await InputComponent.setup(Input, { ...getDefaultProps(), ...props }, opts);
  return { ...api, input: api.element };
}

describe("Uu5Elements.Input", () => {
  VisualComponent.testProperties(setup);
  InputComponent.testProperties(setup);

  it.each(["ground", "upper"])("checks effect = %s is properly shown", async (effect) => {
    const props = { effect };
    const finalEffect = effect.charAt(0).toUpperCase() + effect.slice(1);
    const { element } = await setup(props);

    expect(element).toHaveGdsEffect([`elevation${finalEffect}`]);
  });
});
