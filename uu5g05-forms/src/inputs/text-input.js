//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";
import Config from "../config/config.js";
import { maxLength, minLength, pattern, required } from "../config/validations.js";
import withValidationMap from "../with-validation-map.js";
import InputTextLength from "../_internal/input-text-length.js";
//@@viewOff:imports

//@@viewOn:constants
const INPUT_WIDTH_MAP = {
  xxs: 180,
  xs: 200,
  s: 220,
  m: 240,
  l: 260,
  xl: 280,
};
//@@viewOff:constants

const { type, ...propTypes } = InputTextLength.propTypes;
const { type: _, _formattedValue, ...defaultProps } = InputTextLength.defaultProps;

const _TextInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Text.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    spellCheck: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    spellCheck: undefined,
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { spellCheck, elementAttrs, width, ...otherProps } = props;
    const { size } = otherProps;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <InputTextLength
        {...otherProps}
        elementAttrs={{ ...elementAttrs, spellCheck }}
        width={width ?? INPUT_WIDTH_MAP[size]}
      />
    );
    //@@viewOff:render
  },
});

const TextInput = withValidationMap(_TextInput, {
  required: required(),
  pattern: pattern(),
  minLength: minLength(),
  maxLength: maxLength(),
});

//@@viewOn:helpers
//@@viewOff:helpers

export { TextInput, _TextInput };
export default TextInput;
