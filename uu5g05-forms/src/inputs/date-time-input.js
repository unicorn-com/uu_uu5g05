//@@viewOn:imports
import { createComponent, PropTypes, useTimeZone } from "uu5g05";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import withValidationMap from "../with-validation-map.js";
import InputDateTime from "../_internal/input-date-time.js";
import InputDateTimeNative from "../_internal/input-date-time-native.js";
import withDateTimeRange from "../_internal/with-date-time-range.js";
import useIsoDateValue from "../_internal/use-iso-date-value.js";
import InputDateTimeValidation from "../_internal/input-date-time-validation.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

//@@viewOn:constants
const InputDateTimeWithRange = withDateTimeRange(InputDateTimeValidation);
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const _DateTimeInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DateTime.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputDateTime.propTypes,
    pickerType: PropTypes.oneOf(["vertical", "native"]),
    rangePosition: InputDateTimeWithRange.propTypes.rangePosition,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputDateTime.defaultProps,
    pickerType: "vertical",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { pickerType, rangePosition, autoComplete, value: valueProp, timeZone, presetList, ...otherProps } = props;

    const value = useIsoDateValue(valueProp, _DateTimeInput.logger);

    const [userTimeZone] = useTimeZone();
    //@@viewOff:private

    //@@viewOn:render
    let Component;

    if (pickerType === "native") {
      Component = InputDateTimeNative;
      otherProps.autoComplete = autoComplete;
    } else {
      otherProps.presetList = presetList;
      if (rangePosition) {
        Component = InputDateTimeWithRange;
        otherProps.rangePosition = rangePosition;
      } else {
        Component = InputDateTimeValidation;
      }
    }

    return <Component {...otherProps} value={value} timeZone={timeZone ?? userTimeZone} />;
    //@@viewOff:render
  },
});

const DateTimeInput = withValidationMap(_DateTimeInput, {
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueDateTime"] },
    feedback: "error",
  },
  required: required(),
  min: {
    message: { import: importLsi, path: ["Validation", "minDateTime"] },
    feedback: "error",
  },
  max: {
    message: { import: importLsi, path: ["Validation", "maxDateTime"] },
    feedback: "error",
  },
  step: {
    message: { import: importLsi, path: ["Validation", "stepDateTime"] },
    feedback: "error",
  },
});

//@@viewOn:exports
export { DateTimeInput };
export default DateTimeInput;
//@@viewOff:exports
