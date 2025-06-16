//@@viewOn:imports
import { createComponent, useLanguage, useUserPreferences } from "uu5g05";
import { UuDateTime } from "uu_i18ng01";
import Config from "../config/config.js";
import useBrowserHourFormat from "./use-browser-hour-format.js";
import withExtensionInput from "../with-extension-input.js";
import InputDateTimeNativeBase from "./input-date-time-native-base.js";
import useNativePicker from "./use-native-picker.js";
//@@viewOff:imports

//@@viewOn:constants
const _InputDateTimeNativeBase = withExtensionInput(InputDateTimeNativeBase);
const { type, ...propTypes } = _InputDateTimeNativeBase.propTypes;
const { type: _, _formattedValue, ...defaultProps } = _InputDateTimeNativeBase.defaultProps;
//@@viewOff:constants

//@@viewOn:helpers
function getTimeFormat(hourFormat, showSeconds) {
  let hours = hourFormat === 12 ? "hh" : "HH";
  let minutes = ":mm";
  let seconds = showSeconds ? ":ss" : "";
  let dayPeriod = hourFormat === 12 ? " A" : "";
  return `${hours}${minutes}${seconds}${dayPeriod}`;
}

function useFormattedValue(value, isText, browserHourFormat, step, timeZone) {
  const [{ shortDateFormat }] = useUserPreferences();
  const [lang] = useLanguage();

  let formattedValue;

  if (isText) {
    if (value) {
      // FIXME: HTML time input's format is derived from browser language and cant be forced.
      // Right now we leave this be and just display the value formatted based on the browser
      // language (navigator.language).
      let timeFormat = getTimeFormat(browserHourFormat, step && step % 60 !== 0);
      formattedValue = new UuDateTime(value, timeZone).format(lang, { format: `${shortDateFormat} ${timeFormat}` });
    } else formattedValue = "";
  }

  return formattedValue;
}
//@@viewOff:helpers

const InputDateTimeNative = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputDateTimeNative",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    iconLeft: "uugds-calendar-time",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onIconLeftClick, value, onFocus, onBlur, timeZone, ...restProps } = props;
    const { step } = restProps;
    const type = "datetime-local";

    const { input, focus, inputProps } = useNativePicker({ ...props, pickerType: "native" }, type, undefined, {
      openOnArrowDown: false,
    });

    const isText = !(focus || (input && input.validity.badInput) || value === null);
    const browserHourFormat = useBrowserHourFormat();
    const formattedValue = useFormattedValue(value, isText, browserHourFormat, step, timeZone);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <_InputDateTimeNativeBase
        {...restProps}
        type={type}
        value={value}
        _formattedValue={formattedValue}
        {...inputProps}
        focus={focus}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { InputDateTimeNative };
export default InputDateTimeNative;
//@@viewOff:exports
