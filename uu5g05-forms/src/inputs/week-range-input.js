//@@viewOn:imports
import { createComponent, PropTypes, useDevice, useRef, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UuDate } from "uu_i18ng01";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import useValidatorMap from "../use-validator-map.js";
import withValidationMap from "../with-validation-map.js";
import WeekRangeInputBox from "./week-range-input-box.js";
import { dateToIsoWeek, isoWeekListToDateRange, isoWeekToDateRange } from "../_internal/date-tools.js";
import usePicker from "../_internal/use-picker.js";
import DateCss from "../_internal/date-css.js";
import DatePickerContentWrapper from "../_internal/date-picker-content-wrapper.js";
import { getPresetList } from "../_internal/date-preset-tools.js";
import { getInputComponentColorScheme } from "../_internal/tools.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

//@@viewOn:constants
const DEFAULT_PRESET_LIST = [
  "thisWeek",
  "nextWeek",
  "next2Weeks",
  "next3Weeks",
  "lastWeek",
  "last2Weeks",
  "last3Weeks",
];
//@@viewOff:constants

//@@viewOn:css
const CLASS_NAMES = { ...DateCss };
//@@viewOff:css

const _WeekRangeInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "WeekRangeInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...WeekRangeInputBox.propTypes,
    weekStartDay: Uu5Elements.Calendar.propTypes.weekStartDay,
    timeZone: Uu5Elements.Calendar.propTypes.timeZone,
    value: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    presetList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.oneOf(DEFAULT_PRESET_LIST),
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
    ...WeekRangeInputBox.defaultProps,
    weekStartDay: undefined,
    timeZone: undefined,
    iconLeft: "uugds-calendar",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      elementRef,
      onFocus,
      onBlur,
      iconRight,
      pickerType,
      value: propsValue,
      onChange,
      weekStartDay,
      timeZone,
      presetList: presetListProp,
      displayPresets,
      onIconLeftClick,
      ...otherProps
    } = props;
    const { min, max } = otherProps;
    const { isMobileOrTablet } = useDevice();
    const inputBoxRef = useRef();

    const valueAsArray =
      propsValue &&
      (Array.isArray(propsValue)
        ? propsValue.length === 1
          ? [propsValue[0], propsValue[0]]
          : propsValue
        : [propsValue, propsValue]);

    const isoValue = isoWeekListToDateRange(valueAsArray, weekStartDay); // for calendar
    const { inputProps, displayPicker, setDisplayPicker, pickerProps, popoverProps } = usePicker(
      {
        ...props,
        // need custom onChange function - Calendar returns date range - transform into iso week
        onChange: handleChange,
      },
      undefined, // input type
      // need custom equal function - Calendar returns one week range - dateToIsoWeek transforms first day of the week into week
      (currentValue, newValue) => {
        if (!Array.isArray(newValue) || !Array.isArray(currentValue)) return newValue === currentValue;
        return newValue.every((value, index) => dateToIsoWeek(value) === currentValue[index]);
      },
      { openOnArrowDown: false, rangeSelection: true },
    );

    function handleChange(e) {
      let value = e.data.value;
      if (value) {
        const singleValue = Array.isArray(value) && value.length === 1;
        if (singleValue) value = [value[0], undefined];

        if (typeof value == "string") value = [value, value];
        value = value.map((date) => dateToIsoWeek(date));
      }
      onChange(new Utils.Event({ ...e.data, value }, e));
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const minDate = isoWeekToDateRange(min);
    const maxDate = isoWeekToDateRange(max);

    function getCalendar(scrollRef, isPreset) {
      const isHorizontal = pickerType === "horizontal";
      return (
        <Uu5Elements.Calendar
          value={isoValue}
          {...pickerProps}
          min={minDate && minDate[0]}
          max={maxDate && maxDate[1]}
          displayWeekNumbers
          selectionMode="weekRange"
          direction="vertical"
          scrollElementRef={scrollRef}
          weekStartDay={weekStartDay}
          timeZone={timeZone}
          {...(!isMobileOrTablet && {
            className: CLASS_NAMES.calendar({ isPreset, isHorizontal }),
            height: "100%",
          })}
          colorScheme={getInputComponentColorScheme(otherProps.colorScheme)}
          _instantSelect
        />
      );
    }

    return (
      <>
        <InputBoxWithValidation
          {...otherProps}
          {...inputProps}
          elementRef={Utils.Component.combineRefs(inputProps.elementRef, inputBoxRef)}
          value={valueAsArray}
          onChange={handleChange}
          onBoxClick={() => setDisplayPicker(true)}
          onIconLeftClick={(e) => {
            if (typeof onIconLeftClick === "function") onIconLeftClick(e);
            setDisplayPicker(true);
            inputBoxRef.current?.focus();
          }}
          name="weekRange"
        />
        {displayPicker && (
          <Uu5Elements.Popover {...popoverProps} className={CLASS_NAMES.popover()}>
            {({ scrollRef }) => {
              const presetList = getPresetList(
                presetListProp || (displayPresets && DEFAULT_PRESET_LIST),
                handleChange,
                () => setDisplayPicker(false),
                "week",
              );
              return presetList.length ? (
                <DatePickerContentWrapper presetList={presetList}>
                  {getCalendar(scrollRef, true)}
                </DatePickerContentWrapper>
              ) : (
                getCalendar(scrollRef)
              );
            }}
          </Uu5Elements.Popover>
        )}
      </>
    );
    //@@viewOff:render
  },
});

const WeekRangeInput = withValidationMap(_WeekRangeInput, {
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueWeek"] },
    feedback: "error",
  },
  required: required(),
  min: {
    message: { import: importLsi, path: ["Validation", "minWeek"] },
    feedback: "error",
  },
  max: {
    message: { import: importLsi, path: ["Validation", "maxWeek"] },
    feedback: "error",
  },
});

const InputBoxWithValidation = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "WeekRangeInputBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    max: PropTypes.string,
    min: PropTypes.string,
    step: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    max: undefined,
    min: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { max, min, step, onValidate: propsOnValidate, value, ...inputProps } = props;

    const onValidate = useValidatorMap(props, {
      max: (value) => {
        if (!max || (Array.isArray(value) ? value.length === 0 : !value)) return true;

        let [maxYear, maxWeek] = max.split("-W");
        return value.every((value) => {
          let [year, week] = value.split("-W");
          return maxYear > year || (maxYear === year && maxWeek >= week);
        });
      },
      min: (value) => {
        if (!min || (Array.isArray(value) ? value.length === 0 : !value)) return true;

        let [minYear, minMonth] = min.split("-W");
        return value.every((value) => {
          let [year, week] = value.split("-W");
          return minYear < year || (minYear === year && minMonth <= week);
        });
      },
      badValue: (value) => {
        if (!value) return true;

        const validateValue = (weekValue) => {
          let [year, week] = weekValue.split("-W").map((item) => Number(item));

          // check if result of parsing value is valid value
          if (isNaN(year) || isNaN(week)) return false;
          let lastDay = new UuDate({ year, day: 31, month: 12 });
          // TODO get startWeekDay from user preferences
          let lastWeek = lastDay.getWeek();

          // check if last day of the year is not part of the first week of the next year
          if (lastWeek === 1) {
            lastDay.shiftDay(-7);
            lastWeek = lastDay.getWeek();
          }

          return week <= lastWeek;
        };

        if (typeof value === "string") {
          return validateValue(value);
        } else {
          let emptyValueIndex = value.findIndex((it) => it === undefined);
          if (emptyValueIndex > -1) return false;
          return value.every((item) => validateValue(item));
        }
      },
    });
    //@@viewOff:private

    //@@viewOn:render
    return <WeekRangeInputBox {...inputProps} onValidate={onValidate} value={value} />;
    //@@viewOff:render
  },
});

WeekRangeInput.Box = WeekRangeInputBox;

export { WeekRangeInput };
export default WeekRangeInput;
