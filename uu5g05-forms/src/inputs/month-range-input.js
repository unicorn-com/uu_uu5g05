//@@viewOn:imports
import { createVisualComponent, PropTypes, useRef, Utils } from "uu5g05";
import { Popover } from "uu5g05-elements";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import { validateMonthInputValue } from "../_internal/tools.js";
import useValidatorMap from "../use-validator-map.js";
import withValidationMap from "../with-validation-map.js";
import MonthRangeInputBox from "./month-range-input-box.js";
import MonthPicker from "../_internal/month-picker.js";
import usePicker from "../_internal/use-picker.js";
import { DatePickerContentWrapper } from "../_internal/date-picker-content-wrapper.js";
import { getPresetList } from "../_internal/date-preset-tools.js";
import { getInputComponentColorScheme } from "../_internal/tools.js";
import withCustomizedOnChangeValue from "../_internal/with-customized-on-change-value.js";
import { toIsoMonthValue } from "../_internal/date-tools.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const DEFAULT_PRESET_LIST = [
  "thisMonth",
  "lastMonth",
  "last3Months",
  "last6Months",
  "last12Months",
  "nextMonth",
  "next3Months",
  "next6Months",
  "next12Months",
];
//@@viewOff:constants

let MonthRangeInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MonthRangeInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...MonthRangeInputBox.propTypes,
    value: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    onChange: PropTypes.func,
    min: PropTypes.string,
    max: PropTypes.string,
    presetList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.oneOf(DEFAULT_PRESET_LIST),
        PropTypes.shape({ onClick: PropTypes.func, children: PropTypes.node }),
      ]),
    ),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...MonthRangeInputBox.defaultProps,
    iconLeft: "uugds-calendar",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { presetList: presetListProp, onIconLeftClick, displayPresets, value, ...otherProps } = props;
    const { min, max, step } = otherProps;
    const valueAsArray = typeof value === "string" ? [value, value] : value; // necessary for select of values in MonthPicker
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
    function getCalendar(scrollRef) {
      return (
        <MonthPicker
          value={valueAsArray}
          {...pickerProps}
          min={min}
          max={max}
          step={step}
          selectionMode="range"
          scrollElementRef={scrollRef}
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
          name="monthRange"
        />
        {displayPicker && (
          <Popover {...popoverProps}>
            {({ scrollRef }) => {
              const presetList = getPresetList(
                presetListProp || (displayPresets && DEFAULT_PRESET_LIST),
                handleChange,
                () => setDisplayPicker(false),
                "month",
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
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers

MonthRangeInput = withCustomizedOnChangeValue(MonthRangeInput, (newValue) => {
  if (Array.isArray(newValue)) return newValue.map((it) => toIsoMonthValue(it));
  return toIsoMonthValue(newValue);
});

MonthRangeInput = withValidationMap(MonthRangeInput, {
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueMonth"] },
    feedback: "error",
  },
  required: required(),
  min: {
    message: { import: importLsi, path: ["Validation", "minMonth"] },
    feedback: "error",
  },
  max: {
    message: { import: importLsi, path: ["Validation", "maxMonth"] },
    feedback: "error",
  },
  step: {
    message: { import: importLsi, path: ["Validation", "stepMonth"] },
    feedback: "error",
  },
});
//@@viewOff:helpers

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
        if (step == null || value == null) return true;
        // if min not set, 1970-01-01 must be set, because native calendar calculate step from this date
        let minDate = new Date(min || "1970-01-01");
        let valueDateFrom = new Date(value[0]);
        let valueDateTo = new Date(value[1]);
        let monthsDiffFrom =
          (valueDateFrom.getFullYear() - minDate.getFullYear()) * 12 + valueDateFrom.getMonth() - minDate.getMonth();
        let monthsDiffTo =
          (valueDateTo.getFullYear() - minDate.getFullYear()) * 12 + valueDateTo.getMonth() - minDate.getMonth();
        let stepValidateFrom = monthsDiffFrom % step === 0;
        let stepValidateTo = monthsDiffTo % step === 0;
        return stepValidateFrom && stepValidateTo;
      },
      badValue: (value) => {
        let isValidValue = Array.isArray(value)
          ? validateMonthInputValue(value[0]) && validateMonthInputValue(value[1])
          : false;
        return value == null || isValidValue;
      },
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <MonthRangeInputBox {...props} onValidate={onValidate} />;
    //@@viewOff:render
  },
});

MonthRangeInput.Box = MonthRangeInputBox;

export { MonthRangeInput };
export default MonthRangeInput;
