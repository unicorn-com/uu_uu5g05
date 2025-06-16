//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import { Input } from "uu5g05-elements";
import YearRangeBoxExtension from "../_internal/year-range/year-range-box-extension.js";
import withValidationInput from "../with-validation-input.js";
import usePersistFocus from "../_internal/use-persist-focus.js";
import Config from "../config/config.js";
//@@viewOff:imports

const { type, ...inputPropTypes } = Input.propTypes;
const { type: _type, ...inputDefaultProps } = Input.defaultProps;

const _YearRangeInputBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "YearRangeInputBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...inputPropTypes,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...inputDefaultProps,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onFocus, onBlur, ...otherProps } = props;
    const { value, onChange, disabled } = otherProps;

    const [focus, handleFocus, handleBlur] = usePersistFocus({
      onFocus,
      onBlur: _handleBlur,
      disabled,
    });

    function _handleBlur(e) {
      if (focus && Array.isArray(value) && value[0] && value[1]) {
        onChange(new Utils.Event({ value }));
      }
      onBlur(e);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <YearRangeBoxExtension {...otherProps} focus={focus} onFocus={handleFocus} onBlur={handleBlur} />;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const YearRangeInputBox = withValidationInput(_YearRangeInputBox);

//@@viewOff:helpers

export { YearRangeInputBox };
export default YearRangeInputBox;
