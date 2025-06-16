//@@viewOn:imports
import { createComponent, PropTypes, Utils } from "uu5g05";
import InputText from "./input-text.js";
import Config from "../config/config.js";
import useValidatorMap from "../use-validator-map.js";
import { validateStep } from "./tools.js";
//@@viewOff:imports

//@@viewOn:helpers
function toNumber(numberOrUnlocalizedString) {
  if (typeof numberOrUnlocalizedString !== "string") return numberOrUnlocalizedString;
  if (numberOrUnlocalizedString === "") return undefined;
  return Number(numberOrUnlocalizedString);
}
//@@viewOff:helpers

const InputNumber = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputNumber",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputText.propTypes,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    valueType: PropTypes.oneOf(["number", "string"]),
    onChange: PropTypes.func.isRequired,
    max: PropTypes.number,
    min: PropTypes.number,
    step: PropTypes.number,
    alignment: PropTypes.oneOf(["left", "right"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputText.defaultProps,
    valueType: "number",

    max: undefined,
    min: undefined,
    step: undefined,
    alignment: "left",

    autoComplete: false, // defined in InputText
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { max, min, step, elementAttrs, children, alignment, className, ...inputProps } = props;

    const onValidate = useValidatorMap(props, {
      max: (value) => max == null || value == null || value === "" || toNumber(value) <= max,
      min: (value) => min == null || value == null || value === "" || toNumber(value) >= min,
      step: (value) => validateStep(toNumber(value), step, min),
    });
    //@@viewOff:private

    //@@viewOn:render
    const Comp = children;

    return (
      <Comp
        {...inputProps}
        onValidate={onValidate}
        elementAttrs={{ ...elementAttrs, max, min, step }}
        className={Utils.Css.joinClassName(className, Config.Css.css({ textAlign: alignment }))}
      />
    );
    //@@viewOff:render
  },
});

export { InputNumber };
export default InputNumber;
