//@@viewOn:imports
import { createVisualComponent, PropTypes, useRef, Utils } from "uu5g05";
import { Popover } from "uu5g05-elements";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import { getInputComponentColorScheme, validateYearInputValue } from "../_internal/tools.js";
import useValidatorMap from "../use-validator-map.js";
import withValidationMap from "../with-validation-map.js";
import YearRangeInputBox from "./year-range-input-box.js";
import YearPicker from "../_internal/year-picker.js";
import usePicker from "../_internal/use-picker.js";
import withStringYearInput from "../_internal/with-string-year.js";
import { DatePickerContentWrapper } from "../_internal/date-picker-content-wrapper.js";
import { getPresetList } from "../_internal/date-preset-tools.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const DEFAULT_PRESET_LIST = [
  "thisYear",
  "nextYear",
  "lastYear",
  "next2Years",
  "next3Years",
  "last2Years",
  "last3Years",
];
//@@viewOff:constants

const _YearRangeInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "YearRangeInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...YearRangeInputBox.propTypes,
    value: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.number]),
    min: PropTypes.number,
    max: PropTypes.number,
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
    ...YearRangeInputBox.defaultProps,
    iconLeft: "uugds-calendar",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { presetList: presetListProp, onIconLeftClick, displayPresets, value, ...otherProps } = props;
    const { min, max, step } = otherProps;
    const valueAsArray = typeof value === "number" ? [value, value] : value; // necessary for select of values in YearPicker
    const inputBoxRef = useRef();
    const { inputProps, displayPicker, setDisplayPicker, pickerProps, popoverProps } = usePicker(
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
        <YearPicker
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
          name="yearRange"
        />
        {displayPicker && (
          <Popover {...popoverProps}>
            {({ scrollRef }) => {
              const presetList = getPresetList(
                presetListProp || (displayPresets && DEFAULT_PRESET_LIST),
                handleChange,
                () => setDisplayPicker(false),
                "year",
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
const StringYearRangeInput = withStringYearInput(_YearRangeInput);

const YearRangeInput = withValidationMap(StringYearRangeInput, {
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueYear"] },
    feedback: "error",
  },
  required: required(),
  min: {
    message: { import: importLsi, path: ["Validation", "minYear"] },
    feedback: "error",
  },
  max: {
    message: { import: importLsi, path: ["Validation", "maxYear"] },
    feedback: "error",
  },
  step: {
    message: { import: importLsi, path: ["Validation", "stepYear"] },
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
        // if min not set, 1970 is to be set
        let minDate = min || 1970;
        let valueDateFrom = value[0];
        let valueDateTo = value[1];
        let yearsDiffFrom = valueDateFrom - minDate;
        let yearsDiffTo = valueDateTo - minDate;
        let stepValidateFrom = yearsDiffFrom % step === 0;
        let stepValidateTo = yearsDiffTo % step === 0;
        return stepValidateFrom && stepValidateTo;
      },
      badValue: (value) => {
        let isValidValue = Array.isArray(value)
          ? validateYearInputValue(value[0]) && validateYearInputValue(value[1])
          : false;
        return value == null || isValidValue;
      },
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <YearRangeInputBox {...props} onValidate={onValidate} />;
    //@@viewOff:render
  },
});

YearRangeInput.Box = YearRangeInputBox;

export { YearRangeInput };
export default YearRangeInput;
