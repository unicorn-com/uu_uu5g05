//@@viewOn:imports
import { createComponent, useDevice, useUserPreferences, _Tools as Uu5Tools } from "uu5g05";
import InputText from "./input-text.js";
import Config from "../config/config.js";
import useValueTransformation from "./use-value-transformation.js";
//@@viewOff:imports

const InputNumberMobile = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputNumberMobile",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { elementAttrs, _formattedValue, valueType, ...restProps } = props;

    const { platform } = useDevice();

    // we'll use <input type="text" /> but our props.value type is number so we'll need value transformation
    // (formatting for editing and parsing from editing value back to number)
    const [{ numberGroupingSeparator, numberDecimalSeparator }] = useUserPreferences();
    const { formattedValue, onBlur, onChange, onValidate } = useValueTransformation(props, {
      parse: (formattedNumber) =>
        // parse number from textual value from *focused* <input /> (and keep null/undefined untouched)
        parseNumber(formattedNumber, numberGroupingSeparator, numberDecimalSeparator, valueType),
      format: (number) =>
        // format to value usable by *focused* <input />
        formatNumber(number, numberGroupingSeparator, numberDecimalSeparator),
    });
    //@@viewOff:private

    //@@viewOn:render
    return (
      <InputText
        {...restProps}
        // cannot be only type="number", because Samsung and iPhone do not show minus button!
        type="text"
        value={_formattedValue || formattedValue} // preferring _formattedValue from parent (which is present only if blurred & parsable)
        onValidate={onValidate}
        onChange={onChange}
        onBlur={onBlur}
        elementAttrs={{
          ...elementAttrs,
          inputMode: platform === "ios" ? "decimal" : "numeric",
        }}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function parseNumber(numberText, numberGroupingSeparator, numberDecimalSeparator, valueType) {
  if (numberText === null) return null; // invalid value
  if (numberText === undefined) return undefined; // empty value <=> no number, i.e. undefined
  numberText = numberText.trim();
  if (numberText === "") return undefined; // empty value <=> no number, i.e. undefined
  let [integerPart, ...rest] = numberText.replace(/\s/g, "").split(numberDecimalSeparator);
  if (rest.length > 1) return null; // multiple decimal points present
  let normalized = [
    integerPart.replace(new RegExp(Uu5Tools.regexpEscape(numberGroupingSeparator), "g"), ""),
    ...rest,
  ].join(".");
  let number = Number(normalized);
  if (number === 0 && 1 / number === -Infinity) {
    number = 0; // use 0 instead of -0
    normalized = normalized.replace(/^-/, "");
  }
  if (number === Infinity || number === -Infinity) number = NaN;
  return Number.isNaN(number) ? null : valueType === "string" ? normalized : number;
}

function formatNumber(number, numberGroupingSeparator, numberDecimalSeparator) {
  if (number === undefined || number === null) return "";
  // format to editable value (as if input had focus)
  return (number + "").replace(".", () => numberDecimalSeparator);
}
//@@viewOff:helpers

export { InputNumberMobile };
export default InputNumberMobile;
