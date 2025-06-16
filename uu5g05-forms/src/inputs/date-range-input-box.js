//@@viewOn:imports
import { createVisualComponent, PropTypes, useUserPreferences, Utils } from "uu5g05";
import { Input } from "uu5g05-elements";
import { UuDate } from "uu_i18ng01";
import Config from "../config/config.js";
import withValidationInput from "../with-validation-input.js";
import usePersistFocus from "../_internal/use-persist-focus.js";
import DateRangeBoxExtension from "../_internal/date-range/date-range-box-extension.js";
//@@viewOff:imports

const { type, ...inputPropTypes } = Input.propTypes;
const { type: _, _formattedValue, ...defaultProps } = Input.defaultProps;

//@@viewOn:constants
const DATE_FORMAT = "YYYY-MM-DD";
//@@viewOff:constants

//@@viewOn:helpers
function sortValues(value) {
  const firstValue = value[0] ?? value[1];
  const secondValue = value[1] ?? value[0];
  return [new UuDate(firstValue), new UuDate(secondValue)]
    .sort(UuDate.compare)
    .map((it) => it.format(undefined, { format: DATE_FORMAT }).padStart(10, "0"));
}
//@@viewOff:helpers

const _DateRangeInputBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DateRangeInputBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...inputPropTypes,
    format: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    format: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onFocus, onBlur, format, ...otherProps } = props;
    const { value } = otherProps;

    const [{ shortDateFormat: userPreferencesFormat }] = useUserPreferences();
    const shortDateFormat = format ?? userPreferencesFormat;

    const [focus, handleFocus, handleBlur] = usePersistFocus({
      onFocus,
      onBlur: _handleBlur,
      disabled: otherProps.disabled,
    });

    function _handleBlur(e) {
      if (focus && Array.isArray(value) && value[0] && value[1]) {
        otherProps.onChange(new Utils.Event({ value: sortValues(otherProps.value) }));
      }
      onBlur(e);
    }
    //@@viewOff:private

    //@@viewOn:render
    return (
      <DateRangeBoxExtension
        {...otherProps}
        format={shortDateFormat}
        focus={focus}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
    //@@viewOff:render
  },
});

const DateRangeInputBox = withValidationInput(_DateRangeInputBox);

export { DateRangeInputBox };
export default DateRangeInputBox;
