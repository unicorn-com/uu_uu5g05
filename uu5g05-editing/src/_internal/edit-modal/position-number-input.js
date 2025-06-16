//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements, { UuGds } from "uu5g05-elements";
import Uu5Forms, { withExtensionInput, withFormInput, withFormItem } from "uu5g05-forms";
import Config from "../../config/config.js";
//@@viewOff:imports

const Css = {
  main() {
    return Config.Css.css({
      display: "flex",
      gap: UuGds.getValue(["SpacingPalette", "fixed", "c"]),
      justifySelf: "stretch",
    });
  },
  input() {
    return Config.Css.css({
      flex: 1,
    });
  },
  button: () => Config.Css.css({ flex: "none" }),
};

//@@viewOn:helpers
const NumberInputWithFeedback = withExtensionInput(Uu5Forms.Number.Input);
//@@viewOff:helpers

const _PositionNumberBase = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PositionNumberBase",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Uu5Forms.Number.Input.propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    min: 1,
    step: 1,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onChange, step, min, max } = props;

    const _add = () => onChange?.(new Utils.Event({ value: value + step }));
    const _subtract = () => onChange?.(new Utils.Event({ value: value - step }));
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      // NOTE Intentionally not using {...attrs} as all visual props are forwarded to the actual <input>.
      <div className={Css.main()}>
        <NumberInputWithFeedback {...props} className={Utils.Css.joinClassName(Css.input(), props.className)} />
        <Uu5Elements.Button icon="uugds-minus" onClick={_subtract} disabled={value <= min} className={Css.button()} />
        <Uu5Elements.Button icon="uugds-plus" onClick={_add} disabled={value >= max} className={Css.button()} />
      </div>
    );
    //@@viewOff:render
  },
});
const PositionNumber = withFormInput(_PositionNumberBase);
const FormPositionNumber = withFormItem(PositionNumber);

export { PositionNumber, FormPositionNumber };
export default PositionNumber;
