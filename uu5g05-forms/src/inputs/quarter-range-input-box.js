//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import { Input } from "uu5g05-elements";
import QuarterRangeBoxExtension from "../_internal/quarter-range/quarter-range-box-extension.js";
import usePersistFocus from "../_internal/use-persist-focus.js";
import withValidationInput from "../with-validation-input.js";
import Config from "../config/config.js";
//@@viewOff:imports

const { type, ...inputPropTypes } = Input.propTypes;
const { type: _type, ...inputDefaultProps } = Input.defaultProps;

const _QuarterRangeInputBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "QuarterRangeInputBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...inputPropTypes,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
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
    return <QuarterRangeBoxExtension {...otherProps} focus={focus} onFocus={handleFocus} onBlur={handleBlur} />;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const QuarterRangeInputBox = withValidationInput(_QuarterRangeInputBox);
//@@viewOff:helpers

export { QuarterRangeInputBox };
export default QuarterRangeInputBox;
