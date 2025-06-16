//@@viewOn:imports
import { useState, Utils } from "uu5g05";
import useValidatorMap from "../use-validator-map.js";
import Config from "../config/config.js";
//@@viewOff:imports

const REFERENCE_EQUALS = (a, b) => a === b;

let logger;
function getLogger() {
  if (!logger) logger = Utils.LoggerFactory.get(Config.TAG + "useValueTransformation");
  return logger;
}

// provides two-way transformation between props.value (API "value", e.g. number) and formatted
// user-editable value ("formattedValue", e.g. string with custom decimal / thousand separators; user can
// edit this value and parser must be able to parse it to API "value" or return null if unparsable)
function useValueTransformation(props, { parse, format, equals = REFERENCE_EQUALS }) {
  const { value, onChange, onBlur } = props;
  // we need parsing&formatting function for transformations and following steps must be upholded (note that `null`
  // means that user-editable value is unparsable, e.g. parsing "-" yields no number so parsed value would be null):

  // 1. Keep text input value in local state. We need this during user typing as he can type invalid values too
  //    (e.g. user starts with typing "-" in the number input).
  let [formattedValue, setFormattedValue] = useState();
  // if props.value doesn't match formattedValue then sync it to formattedValue, e.g. when doing form reset
  // (but don't sync if props.value === null because that means that the input value is unparsable;
  // in other words, props.value has always biggest priority except when it is null)
  let valueFromFormattedValue = parse(formattedValue);
  if (value !== null && !equals(value, valueFromFormattedValue)) {
    // if focused/blurred input is distinguished then this is meant to format to a string
    // for focused input (e.g. input is kept focused and form gets reset via hotkey)
    let newFormattedValue = format(value);
    if (newFormattedValue !== formattedValue) {
      formattedValue = newFormattedValue;
      setFormattedValue(formattedValue);
      valueFromFormattedValue = parse(formattedValue);
      if (!equals(value, valueFromFormattedValue)) {
        getLogger().error(
          "Invalid value/parse/format passed to useValueTransformation() - the triplet doesn't follow `parse(format(value)) === value` requirement. An unexpected behaviour might happen due to that.",
          { value, formattedValue, parsedFormattedValue: valueFromFormattedValue },
        );
      }
    }
  }

  // 2. Add validator for badValue (validator returns false iff parsed value is null).
  const onValidate = useValidatorMap(props, {
    badValue: () => valueFromFormattedValue !== null,
  });

  // 3. In onChange replace e.data.value with parsed value (e.g. number). If parsing fails,
  //    set e.data.value to null and possibly skip onChange if previous value was null too.
  const handleChange = (e) => {
    setFormattedValue(e.data.value);
    let valueFromFormattedValue = parse(e.data.value);
    // skip onChange if new value is same as current props.value
    if (typeof onChange === "function" && !equals(valueFromFormattedValue, value)) {
      e.data = { ...e.data, value: valueFromFormattedValue };
      onChange(e);
    }
  };

  // 4. In onBlur update formatted value to be properly formatted (if value !== null). The current formatted value
  //    will be already matching but it might come from user so there might be extra spaces, etc., e.g.
  //    " - 1 2345,6" -> "-12345,6"
  const handleBlur = (e) => {
    if (value !== null) {
      let newFormattedValue = format(value);
      setFormattedValue(newFormattedValue);
    }
    if (typeof onBlur === "function") onBlur(e);
  };

  return { value, formattedValue, onChange: handleChange, onBlur: handleBlur, onValidate };
}

export { useValueTransformation };
export default useValueTransformation;
