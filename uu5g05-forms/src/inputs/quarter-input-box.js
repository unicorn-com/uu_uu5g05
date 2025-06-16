//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import { Text, Input } from "uu5g05-elements";
import InputBoxExtension from "../_internal/input-box-extension.js";
import Config from "../config/config.js";
import withValidationInput from "../with-validation-input.js";
import useDateTimeFormat from "../use-date-time-format.js";
//@@viewOff:imports

const { type, ...inputPropTypes } = Input.propTypes;
const { type: _type, ...inputDefaultProps } = Input.defaultProps;

const _QuarterInputBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "QuarterInputBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...inputPropTypes,
    inputBoxRef: PropTypes.any,
    value: PropTypes.oneOfType([PropTypes.string]),
    onChange: PropTypes.func,
    onClick: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...inputDefaultProps,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, ...restProps } = props;
    const formattedValue = useDateTimeFormat(value);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <InputBoxExtension name="quarter" {...restProps}>
        {formattedValue ? (
          <Text category="interface" segment="content" type="medium" colorScheme="building">
            {formattedValue}
          </Text>
        ) : (
          formattedValue
        )}
      </InputBoxExtension>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const QuarterInputBox = withValidationInput(_QuarterInputBox);

//@@viewOff:helpers

export { QuarterInputBox };
export default QuarterInputBox;
