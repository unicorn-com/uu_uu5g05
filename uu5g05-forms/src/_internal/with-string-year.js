import { createComponent, PropTypes } from "uu5g05";
import Config from "../config/config.js";

function convertToNumber(stringValue) {
  if (stringValue == undefined) return stringValue;
  if (Array.isArray(stringValue)) return stringValue.map((item) => convertToNumber(item));

  let result = typeof stringValue === "string" ? Number(stringValue) : stringValue;
  if (isNaN(result)) result = undefined;
  return result;
}

function convertToString(numberValue) {
  if (numberValue == undefined) return numberValue;
  if (Array.isArray(numberValue)) return numberValue.map((item) => convertToString(item));

  return typeof numberValue === "string"
    ? /^\d+$/.test(numberValue)
      ? numberValue.padStart(4, "0")
      : numberValue // keep non-numeric string value as-is
    : String(numberValue).padStart(4, "0");
}

const withStringYearInput = (Input) => {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withStringYearInput(${Input.uu5Tag || Input.displayName})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Input.propTypes,
      value: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.number),
        PropTypes.arrayOf(PropTypes.string),
      ]),
      min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: Input.defaultProps,
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { value, min, max, onChange, ...otherProps } = props;

      const handleChange =
        typeof onChange === "function"
          ? (e) => {
              e.data.value = convertToString(e.data.value);
              onChange(e);
            }
          : undefined;
      //@@viewOff:private

      //@@viewOn:render
      return (
        <Input
          {...otherProps}
          onChange={handleChange}
          min={convertToNumber(min)}
          max={convertToNumber(max)}
          value={convertToNumber(value)}
        />
      );
      //@@viewOff:render
    },
  });
};

export default withStringYearInput;
