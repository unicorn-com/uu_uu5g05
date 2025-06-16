//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import { Input } from "uu5g05-elements";
import MonthRangeBoxExtension from "../_internal/month-range/month-range-box-extension.js";
import withValidationInput from "../with-validation-input.js";
import Config from "../config/config.js";
import usePersistFocus from "../_internal/use-persist-focus.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:helpers
const { type, ...inputPropTypes } = Input.propTypes;
const { type: _type, ...inputDefaultProps } = Input.defaultProps;
//@@viewOff:helpers

const _MonthRangeInputBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MonthRangeInputBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...inputPropTypes,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
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
    return <MonthRangeBoxExtension {...otherProps} focus={focus} onFocus={handleFocus} onBlur={handleBlur} />;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const MonthRangeInputBox = withValidationInput(_MonthRangeInputBox);
//@@viewOff:helpers

export { MonthRangeInputBox };
export default MonthRangeInputBox;
