//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import { Input } from "uu5g05-elements";
import Config from "../config/config.js";
import withValidationInput from "../with-validation-input.js";
import usePersistFocus from "../_internal/use-persist-focus.js";
import WeekRangeBoxExtension from "../_internal/week-range/week-range-box-extension.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:helpers
const { type, ...inputPropTypes } = Input.propTypes;
const { type: _type, ...inputDefaultProps } = Input.defaultProps;
//@@viewOff:helpers

const _WeekRangeInputBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "WeekRangeInputBox",
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
    return <WeekRangeBoxExtension {...otherProps} focus={focus} onFocus={handleFocus} onBlur={handleBlur} />;
    //@@viewOff:render
  },
});

const WeekRangeInputBox = withValidationInput(_WeekRangeInputBox);

export { WeekRangeInputBox };
export default WeekRangeInputBox;
