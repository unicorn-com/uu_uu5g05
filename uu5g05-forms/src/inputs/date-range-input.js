//@@viewOn:imports
import { createVisualComponent, PropTypes, useEffect, useDevice, useRef, Utils, useMemo } from "uu5g05";
import { Calendar, Popover } from "uu5g05-elements";
import { UuDate } from "uu_i18ng01";
import DateRangeInputBox from "./date-range-input-box.js";
import Config from "../config/config.js";
import usePicker from "../_internal/use-picker.js";
import DateCss from "../_internal/date-css.js";
import withValidationMap from "../with-validation-map.js";
import { required } from "../config/validations.js";
import useValidatorMap from "../use-validator-map.js";
import { getDaysDiff, getInputComponentColorScheme } from "../_internal/tools.js";
import { DatePickerContentWrapper } from "../_internal/date-picker-content-wrapper.js";
import { getPresetList } from "../_internal/date-preset-tools.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const DEFAULT_PRESET_LIST = ["today", "yesterday", "last7Days", "last30Days", "thisMonth", "previousMonth"];
const ADDITIONAL_PRESET_LIST = ["tomorrow", "nextWeek", "lastWeek", "nextMonth", "lastMonth"];
//@@viewOff:constants

//@@viewOn:css
const CLASS_NAMES = { ...DateCss };
//@@viewOff:css

//@@viewOn:helpers
function fixSingleRangeValue(value) {
  if (typeof value === "string") {
    const date = new UuDate(value).toIsoString();
    return [date, date];
  } else if (typeof value === "object" && value.length === 2 && value[0] && value[1]) {
    return [new UuDate(value[0]), new UuDate(value[1])].map((it) => it.toIsoString());
  }
  return value;
}

function useIsoDateValue(value, logger) {
  const isValid = useRef(true);

  useEffect(() => {
    if (value) {
      const inValidIndex = value.findIndex((item) => item && typeof item !== "string");
      if (inValidIndex > -1) {
        isValid.current = false;
        logger.error(`Invalid prop "value[${inValidIndex}]" of type "${typeof value}", expected "string".`);
      } else {
        isValid.current = true;
      }
    } else {
      isValid.current = true;
    }
  }, [value]);

  if (isValid.current) return value;
  return undefined;
}

function validateDateValue(value) {
  if (!value) return false;
  try {
    new UuDate(value);
    return true;
  } catch (e) {
    return false;
  }
}

const InputBoxWithValidation = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + `InputBoxWithValidation`,
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { min, max, step } = props;

    const onValidate = useValidatorMap(props, {
      max: (value) => {
        return max == null || value == null || (Array.isArray(value) && value[0] <= max && value[1] <= max);
      },
      min: (value) => {
        return min == null || value == null || (Array.isArray(value) && value[0] >= min && value[1] >= min);
      },
      step: (value) => {
        if (step == null || value == null || step === 1) return true;
        // if min not set, 1970-01-01 must be set, because native calendar calculate step from this date
        let minDate = new Date(min || "1970-01-01");
        let valueDateFrom = new Date(value[0]);
        let valueDateTo = new Date(value[1]);
        let daysDiffFrom = getDaysDiff(minDate, valueDateFrom);
        let daysDiffTo = getDaysDiff(minDate, valueDateTo);
        let stepValidateFrom = daysDiffFrom % step === 0;
        let stepValidateTo = daysDiffTo % step === 0;
        return stepValidateFrom && stepValidateTo;
      },
      badValue: (value) => {
        return value == null || (Array.isArray(value) && validateDateValue(value[0]) && validateDateValue(value[1]));
      },
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <DateRangeInputBox {...props} onValidate={onValidate} />;
    //@@viewOff:render
  },
});
//@@viewOff:helpers

const { onBoxClick: onBoxClickPropType, ...dateRangeInputBoxPropTypes } = DateRangeInputBox.propTypes;
const { onBoxClick: onBoxClickDefaultProp, ...dateRangeInputBoxDefaultProps } = DateRangeInputBox.defaultProps;

const _DateRangeInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DateRangeInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...dateRangeInputBoxPropTypes,
    value: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    onChange: PropTypes.func,
    min: PropTypes.string,
    max: PropTypes.string,
    displayWeekNumbers: PropTypes.bool,
    displayNavigation: PropTypes.bool,
    displayPresets: PropTypes.bool,
    weekStartDay: Calendar.propTypes.weekStartDay,
    timeZone: Calendar.propTypes.timeZone,
    format: PropTypes.string,
    presetList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.oneOf([...DEFAULT_PRESET_LIST, ...ADDITIONAL_PRESET_LIST]),
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
    ...dateRangeInputBoxDefaultProps,
    weekStartDay: undefined,
    timeZone: undefined,
    format: undefined,
    presetList: undefined,
    iconLeft: "uugds-calendar",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      value: propsValue,
      displayWeekNumbers,
      displayNavigation,
      displayPresets,
      weekStartDay,
      timeZone,
      presetList: presetListProp,
      onIconLeftClick,
      ...otherProps
    } = props;
    const { min, max, step } = otherProps;

    const inputBoxRef = useRef();

    const { displayPicker, setDisplayPicker, inputProps, popoverProps, pickerProps } = usePicker(
      {
        ...props,
        onChange: handleChange,
      },
      undefined,
      undefined,
      { openOnArrowDown: false, rangeSelection: true },
    );
    const { isMobileOrTablet } = useDevice();

    const valueAsArray = useMemo(
      () => (typeof propsValue === "string" ? [propsValue, propsValue] : propsValue),
      [propsValue],
    ); // necessary for select of values
    const validValueAsArray = useIsoDateValue(valueAsArray, _DateRangeInput.logger);
    const value = fixSingleRangeValue(validValueAsArray);

    function handleChange(e) {
      let value = e.data.value;

      const singleValue = Array.isArray(value) && value.length === 1;
      if (singleValue) value = [value[0], undefined];

      if (typeof value == "string") value = [value, value];
      props.onChange(new Utils.Event({ ...e.data, value }, e));
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:renders
    function getCalendar(scrollRef, isPreset) {
      return (
        <Calendar
          value={value?.filter(Boolean)}
          {...pickerProps}
          selectionMode="range"
          direction="vertical"
          min={min}
          max={max}
          step={step}
          displayNavigation={displayNavigation}
          displayWeekNumbers={displayWeekNumbers}
          weekStartDay={weekStartDay}
          timeZone={timeZone}
          scrollElementRef={scrollRef}
          {...(!isMobileOrTablet && { className: CLASS_NAMES.calendar({ isPreset }), height: "100%" })}
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
          value={value}
          onChange={handleChange}
          onBoxClick={() => setDisplayPicker(true)}
          onIconLeftClick={(e) => {
            if (typeof onIconLeftClick === "function") onIconLeftClick(e);
            setDisplayPicker(true);
            inputBoxRef.current?.focus();
          }}
          name="dateRange"
        />
        {displayPicker ? (
          <Popover {...popoverProps} className={CLASS_NAMES.popover()}>
            {({ scrollRef }) => {
              const presetList = getPresetList(
                presetListProp || (displayPresets && DEFAULT_PRESET_LIST),
                handleChange,
                () => setDisplayPicker(false),
                "dateRange",
              );

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

const DateRangeInput = withValidationMap(_DateRangeInput, {
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

DateRangeInput.Box = DateRangeInputBox;

export { DateRangeInput };
export default DateRangeInput;
