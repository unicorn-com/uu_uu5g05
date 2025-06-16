//@@viewOn:imports
import { createComponent, PropTypes, useDevice, useUserPreferences, Utils } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import { Calendar, Popover } from "uu5g05-elements";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import DateRangeInputBox from "./date-range-input-box.js";
import withExtensionInput from "../with-extension-input.js";
import withValidationMap from "../with-validation-map.js";
import InputDate from "../_internal/input-date.js";
import useNativePicker from "../_internal/use-native-picker.js";
import DateCss from "../_internal/date-css.js";
import useIsoDateValue from "../_internal/use-iso-date-value.js";
import { DatePickerContentWrapper } from "../_internal/date-picker-content-wrapper.js";
import { getPresetList } from "../_internal/date-preset-tools.js";
import { getInputComponentColorScheme } from "../_internal/tools.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

//@@viewOn:constants
const CALENDAR_SCROLL_ELEMENT_ATTRS = { onMouseDown: (e) => e.preventDefault() }; // prevent invocation of onBlur

const _InputDate = withExtensionInput(InputDate);
const { type, ...propTypes } = _InputDate.propTypes;
const { type: _, _formattedValue, ...defaultProps } = _InputDate.defaultProps;
//@@viewOff:constants

//@@viewOn:css
const CLASS_NAMES = { ...DateCss };
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

let DateInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Date.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    min: PropTypes.string,
    max: PropTypes.string,
    pickerType: PropTypes.oneOf(["horizontal", "vertical", "native"]),
    displayWeekNumbers: PropTypes.bool,
    displayNavigation: PropTypes.bool, // vertical only
    displayPicker: PropTypes.bool, // vertical only
    onDisplayPickerChange: PropTypes.func, // vertical only
    clearIcon: PropTypes.icon,
    dateMap: Calendar.propTypes.dateMap,
    weekStartDay: Calendar.propTypes.weekStartDay,
    timeZone: Calendar.propTypes.timeZone,
    format: PropTypes.string,
    presetList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.oneOf([
          "today",
          "yesterday",
          "dayBeforeYesterday",
          "tomorrow",
          "nextWeek",
          "lastWeek",
          "nextMonth",
          "lastMonth",
        ]),
        PropTypes.shape({
          onClick: PropTypes.func,
          children: PropTypes.node,
        }),
      ]),
    ),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    iconLeft: "uugds-calendar",
    pickerType: "vertical",
    displayWeekNumbers: false,
    displayNavigation: true,
    displayPicker: false,
    onDisplayPickerChange: undefined,
    clearIcon: undefined,
    dateMap: Calendar.defaultProps.dateMap,
    weekStartDay: undefined,
    timeZone: undefined,
    format: undefined,
    presetList: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      onFocus,
      onBlur,
      displayWeekNumbers,
      displayNavigation,
      displayPicker: displayPickerProp,
      onDisplayPickerChange: onDisplayPickerChangeProp,
      dateMap,
      weekStartDay,
      timeZone,
      format,
      presetList: presetListProp,
      value: valueProp,
      clearIcon,
      ...restProps
    } = props;
    const { pickerType, min, max } = restProps;
    const { isMobileOrTablet } = useDevice();

    const [{ shortDateFormat: userPreferencesFormat }] = useUserPreferences();
    const shortDateFormat = format ?? userPreferencesFormat;

    const value = useIsoDateValue(valueProp, DateInput.logger);

    const onDisplayPickerChange =
      typeof onDisplayPickerChangeProp === "function"
        ? (displayPicker) => {
            onDisplayPickerChangeProp(new Utils.Event({ displayPicker }));
          }
        : null;

    const { inputProps, displayPicker, popoverProps, pickerProps, setDisplayPicker } = useNativePicker(
      { ...props, value, onDisplayPickerChange },
      "date",
      undefined,
      { openOnArrowDown: false },
    );

    function isOnlyOneMonth() {
      if (min && max) {
        const minDate = new UuDate(min);
        const maxDate = new UuDate(max);

        return minDate.getYear() === maxDate.getYear() && minDate.getMonth() === maxDate.getMonth();
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    function getCalendar(scrollRef, isPreset) {
      const isHorizontal = pickerType === "horizontal";
      const onlyOneMonth = isOnlyOneMonth();
      return (
        <Calendar
          value={value}
          {...pickerProps}
          selectionMode="single"
          direction={pickerType}
          min={props.min}
          max={props.max}
          displayNavigation={onlyOneMonth ? false : displayNavigation}
          displayWeekNumbers={displayWeekNumbers}
          scrollElementRef={scrollRef}
          scrollElementAttrs={CALENDAR_SCROLL_ELEMENT_ATTRS} // non-changing static reference so that memo works
          dateMap={dateMap}
          weekStartDay={weekStartDay}
          timeZone={timeZone}
          {...(!isMobileOrTablet && {
            className: CLASS_NAMES.calendar({ isPreset, isHorizontal, height: onlyOneMonth ? 276 : undefined }),
            height: "100%",
          })}
          colorScheme={getInputComponentColorScheme(restProps.colorScheme)}
        />
      );
    }

    return (
      <>
        <_InputDate
          {...restProps}
          value={value}
          {...inputProps}
          format={shortDateFormat}
          type={pickerType === "native" ? "date" : undefined}
        />
        {displayPicker ? (
          <Popover {...popoverProps} className={CLASS_NAMES.popover()}>
            {({ scrollRef }) => {
              const presetList = getPresetList(presetListProp, props.onChange, () => setDisplayPicker(false), "date");
              return presetList.length ? (
                <DatePickerContentWrapper presetList={presetList}>
                  {getCalendar(scrollRef, true)}
                </DatePickerContentWrapper>
              ) : (
                getCalendar(scrollRef)
              );
            }}
          </Popover>
        ) : null}
      </>
    );
    //@@viewOff:render
  },
});

DateInput = withValidationMap(DateInput, {
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueDate"] },
    feedback: "error",
  },
  required: required(),
  min: {
    message: { import: importLsi, path: ["Validation", "minDate"] },
    feedback: "error",
  },
  max: {
    message: { import: importLsi, path: ["Validation", "maxDate"] },
    feedback: "error",
  },
  step: {
    message: { import: importLsi, path: ["Validation", "stepDate"] },
    feedback: "error",
  },
});

DateInput.Box = DateRangeInputBox;

export { DateInput };
export default DateInput;
