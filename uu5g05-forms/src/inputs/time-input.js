//@@viewOn:imports
import { createComponent, PropTypes, useRef, useUpdateLayoutEffect, useUserPreferences, Utils } from "uu5g05";
import { Popover } from "uu5g05-elements";
import { UuDateTime } from "uu_i18ng01";
import TimePicker, { createUuDateTime } from "../_internal/time-picker.js";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import withExtensionInput from "../with-extension-input.js";
import withValidationMap from "../with-validation-map.js";
import InputTime from "../_internal/input-time.js";
import useNativePicker from "../_internal/use-native-picker.js";
import { getInputComponentColorScheme } from "../_internal/tools.js";
import { HOUR_MS } from "../_native/time/hour-slot.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

const _InputTime = withExtensionInput(InputTime);
const { type, ...propTypes } = _InputTime.propTypes;
const { type: _, _formattedValue, ...defaultProps } = _InputTime.defaultProps;

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  popover: ({ minWidth }) => {
    return Config.Css.css({ minWidth });
  },
};
//@@viewOff:css

//@@viewOn:helpers
const isSameTime = (t1, t2) => {
  // Time can be HH:mm, HH:mm:ss or undefined
  if ((t1 && !t2) || (!t1 && t2)) return false;
  else if (!t1 && !t2) return true;

  if (t1 === t2) return true;

  if (t1.indexOf("T") > -1) {
    return new UuDateTime(t1).getTime() === new UuDateTime(t2).getTime();
  } else {
    const aParts = t1.split(":");
    const bParts = t2.split(":");

    const aTime = new Date();
    aTime.setHours(aParts[0]);
    aTime.setMinutes(aParts[1]);
    aTime.setSeconds(aParts[2] || 0);

    const bTime = new Date();
    bTime.setHours(bParts[0]);
    bTime.setMinutes(bParts[1]);
    bTime.setSeconds(bParts[2] || 0);

    return aTime.getTime() === bTime.getTime();
  }
};

function getInputSuffix({ value, summerTimeSuffix, winterTimeSuffix, suffix, date, timeZone }) {
  if (!(summerTimeSuffix || winterTimeSuffix) || !date || !value) return suffix;

  timeZone ??= date ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

  const dateValue = new Date(value);
  const dateMs = dateValue.getTime();
  const localHour = new UuDateTime(dateMs, timeZone).getHour();

  if (new UuDateTime(dateMs - HOUR_MS, timeZone).getHour() === localHour) return winterTimeSuffix;
  if (new UuDateTime(dateMs + HOUR_MS, timeZone).getHour() === localHour) return summerTimeSuffix;
}
//@@viewOff:helpers

const _TimeInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Time.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    pickerType: PropTypes.oneOf(["vertical", "native"]),
    displaySeconds: PropTypes.bool,
    format: PropTypes.oneOf([12, 24]),
    step: TimePicker.propTypes.step,
    displayPicker: PropTypes.bool, // vertical only
    onDisplayPickerChange: PropTypes.func, // vertical only
    clearIcon: PropTypes.icon,
    preselectedPickerValue: TimePicker.propTypes.preselectedPickerValue,
    timeZone: PropTypes.string,
    date: PropTypes.string,
    summerTimeTemplate: TimePicker.propTypes.summerTimeTemplate,
    winterTimeTemplate: TimePicker.propTypes.winterTimeTemplate,
    summerTimeSuffix: TimePicker.propTypes.summerTimeSuffix,
    winterTimeSuffix: TimePicker.propTypes.winterTimeSuffix,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    iconLeft: "uugds-clock",
    pickerType: "vertical",
    displayPicker: false,
    onDisplayPickerChange: undefined,
    clearIcon: undefined,
    preselectedPickerValue: TimePicker.defaultProps.preselectedPickerValue,
    timeZone: undefined,
    date: undefined,
    summerTimeTemplate: TimePicker.defaultProps.summerTimeTemplate,
    winterTimeTemplate: TimePicker.defaultProps.winterTimeTemplate,
    summerTimeSuffix: TimePicker.defaultProps.summerTimeSuffix,
    winterTimeSuffix: TimePicker.defaultProps.winterTimeSuffix,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      value,
      onFocus,
      onBlur,
      elementRef,
      displayPicker: displayPickerProp,
      displaySeconds: displaySecondsProp,
      format: formatProp,
      step,
      onDisplayPickerChange: onDisplayPickerChangeProp,
      preselectedPickerValue,
      timeZone,
      date,
      summerTimeTemplate,
      winterTimeTemplate,
      clearIcon,
      summerTimeSuffix,
      winterTimeSuffix,
      suffix,
      ...restProps
    } = props;

    const { pickerType, min, max } = restProps;
    const displaySeconds = displaySecondsProp || step % 60 > 0;

    const [{ hourFormat: userPreferencesHourFormat }] = useUserPreferences();
    const format = formatProp ?? userPreferencesHourFormat;

    const onDisplayPickerChange =
      typeof onDisplayPickerChangeProp === "function"
        ? (displayPicker) => {
            onDisplayPickerChangeProp(new Utils.Event({ displayPicker }));
          }
        : null;

    const { inputProps, displayPicker, pickerProps, popoverProps } = useNativePicker(
      { ...props, onDisplayPickerChange },
      "time",
      undefined,
      {
        openOnArrowDown: false,
      },
    );

    const valueDt = createUuDateTime(value || undefined, timeZone);
    const inputValue = value ? valueDt.format(undefined, { format: "HH:mm:ss" }) : value;

    const minDt = min ? createUuDateTime(min, timeZone) : null;
    const maxDt = max ? createUuDateTime(max, timeZone) : null;

    const inputStep = step || (pickerType === "vertical" && displaySeconds ? 1 : undefined);

    const inputRef = useRef();

    useUpdateLayoutEffect(() => {
      if (value && date) {
        const newValue = new UuDateTime(date.split("-"), timeZone).setHour(...inputValue.split(":")).toIsoString();
        if (value !== newValue) {
          props.onChange(new Utils.Event({ value: newValue }));
        }
      }
    }, [date, timeZone]);

    function getFormat() {
      let result = format === 24 ? "HH:mm" : "h:mm aa";

      if (inputStep < 60) result = result.replace("mm", "mm:ss");

      return result;
    }

    function getCorrectTimeValue(timeValue) {
      if (!timeValue) return;
      if (date && pickerType !== "native") return timeValue.toIsoString();
      return timeValue.format(undefined, { format: "HH:mm" + (displaySeconds ? ":ss" : "") });
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const suffixValue = getInputSuffix({ suffix, summerTimeSuffix, winterTimeSuffix, value, date });

    return (
      <>
        <_InputTime
          {...restProps}
          {...inputProps}
          min={getCorrectTimeValue(minDt)}
          max={getCorrectTimeValue(maxDt)}
          step={inputStep}
          type={pickerType === "native" ? "time" : undefined}
          value={value}
          elementRef={Utils.Component.combineRefs(inputRef, inputProps.elementRef)}
          format={getFormat()}
          date={date}
          timeZone={timeZone}
          suffix={suffixValue}
          hideSummerPrefix={!!summerTimeSuffix}
          hideWinterPrefix={!!winterTimeSuffix}
        />
        {displayPicker && (
          <Popover
            {...popoverProps}
            className={Css.popover({ minWidth: inputRef.current.getBoundingClientRect().width })}
          >
            {({ scrollRef }) => {
              return (
                <TimePicker
                  value={value}
                  {...pickerProps}
                  onSelect={(e) => {
                    // this picker cannot be closed on select, because value is changing by scrolling or selection and user can select another value
                    if (typeof props.onChange === "function" && !isSameTime(value, e.data.value)) {
                      props.onChange(e);
                    }
                  }}
                  step={displaySecondsProp ? undefined : props.step}
                  displaySeconds={displaySecondsProp}
                  format={format}
                  scrollElementRef={scrollRef}
                  scrollElementAttrs={{ onMouseDown: (e) => e.preventDefault() }} // prevent invocation of onBlur
                  min={min}
                  max={max}
                  timeZone={timeZone}
                  preselectedPickerValue={preselectedPickerValue}
                  date={date}
                  summerTimeTemplate={summerTimeTemplate}
                  winterTimeTemplate={winterTimeTemplate}
                  colorScheme={getInputComponentColorScheme(restProps.colorScheme)}
                  summerTimeSuffix={summerTimeSuffix}
                  winterTimeSuffix={winterTimeSuffix}
                />
              );
            }}
          </Popover>
        )}
      </>
    );
    //@@viewOff:render
  },
});

const TimeInput = withValidationMap(_TimeInput, {
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueTime"] },
    feedback: "error",
  },
  required: required(),
  min: {
    message: { import: importLsi, path: ["Validation", "minTime"] },
    feedback: "error",
  },
  max: {
    message: { import: importLsi, path: ["Validation", "maxTime"] },
    feedback: "error",
  },
  step: {
    message: { import: importLsi, path: ["Validation", "stepTime"] },
    feedback: "error",
  },
});

//@@viewOn:exports
export { TimeInput };
export default TimeInput;
//@@viewOff:exports
