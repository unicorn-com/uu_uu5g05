//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import Config from "../../config/config.js";
import InputBox from "../input-box.js";
import useDateTimeFormat from "../../use-date-time-format.js";
//@@viewOff:imports

//@@viewOn:constants
const SEPARATOR = " - ";
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const QuarterRangeBoxPlaceholder = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "QuarterRangeBoxPlaceholder",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputBox.propTypes,
    value: PropTypes.array,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputBox.defaultProps,
    value: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, ...otherProps } = props;
    const singleValue = value?.[0] && !value?.[1];
    let formattedValue = useDateTimeFormat(singleValue ? value[0] : value);
    if (singleValue) formattedValue += SEPARATOR;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <InputBox name="quarterRange" {...otherProps}>
        {formattedValue}
      </InputBox>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { QuarterRangeBoxPlaceholder };
export default QuarterRangeBoxPlaceholder;
//@@viewOff:exports
