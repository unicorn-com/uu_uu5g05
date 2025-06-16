//@@viewOn:importsQuarterRangeInputBox
import { createVisualComponent, PropTypes, useRef, Utils } from "uu5g05";
import { Popover } from "uu5g05-elements";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import { getInputComponentColorScheme, validateQuarterInputValue } from "../_internal/tools.js";
import useValidatorMap from "../use-validator-map.js";
import withValidationMap from "../with-validation-map.js";
import QuarterRangeInputBox from "./quarter-range-input-box.js";
import QuarterPicker from "../_internal/quarter-picker.js";
import usePicker from "../_internal/use-picker.js";
import { DatePickerContentWrapper } from "../_internal/date-picker-content-wrapper.js";
import { getPresetList } from "../_internal/date-preset-tools.js";
import withCustomizedOnChangeValue from "../_internal/with-customized-on-change-value.js";
import { toIsoQuarterValue } from "../_internal/date-tools.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const DEFAULT_PRESET_LIST = ["thisQuarter", "nextQuarter", "lastQuarter"];
//@@viewOff:constants

//@@viewOn:helpers
const formatQuarterToNumber = (value) => {
  let parts = value.split("-");
  let year = parts[0];
  let quarterNumber = Number(parts[1].slice(1, 2));
  return `${year}-0${quarterNumber}`;
};
//@@viewOff:helpers

let QuarterRangeInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "QuarterRangeInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...QuarterRangeInputBox.propTypes,
    value: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    min: PropTypes.string,
    max: PropTypes.string,
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
    ...QuarterRangeInputBox.defaultProps,
    iconLeft: "uugds-calendar",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { presetList: presetListProp, onIconLeftClick, displayPresets, value, ...otherProps } = props;
    const { min, max, step } = otherProps;
    const valueAsArray = typeof value === "string" ? [value, value] : value; // necessary for select of values in QuarterPicker
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
        <QuarterPicker
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
          name="quarterRange"
        />
        {displayPicker && (
          <Popover {...popoverProps}>
            {({ scrollRef }) => {
              const presetList = getPresetList(
                presetListProp || (displayPresets && DEFAULT_PRESET_LIST),
                handleChange,
                () => setDisplayPicker(false),
                "quarter",
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

QuarterRangeInput = withCustomizedOnChangeValue(QuarterRangeInput, (newValue) => {
  if (Array.isArray(newValue)) return newValue.map((it) => toIsoQuarterValue(it));
  return toIsoQuarterValue(newValue);
});

//@@viewOn:helpers
QuarterRangeInput = withValidationMap(QuarterRangeInput, {
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueQuarter"] },
    feedback: "error",
  },
  required: required(),
  min: {
    message: { import: importLsi, path: ["Validation", "minQuarter"] },
    feedback: "error",
  },
  max: {
    message: { import: importLsi, path: ["Validation", "maxQuarter"] },
    feedback: "error",
  },
  step: {
    message: { import: importLsi, path: ["Validation", "stepQuarter"] },
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
        // if min not set, 1970-01-01 is to be set
        let formatedMin = formatQuarterToNumber(min);
        let formatedValueFrom;
        let formatedValueTo;
        if (Array.isArray(value)) {
          formatedValueFrom = formatQuarterToNumber(value[0]);
          formatedValueTo = formatQuarterToNumber(value[1]);
        } else {
          formatQuarterToNumber(value);
        }

        let minDate = new Date(formatedMin || "1970-01-01");
        let valueDateFrom = new Date(formatedValueFrom);
        let valueDateTo = new Date(formatedValueTo);
        let quarterDiffFrom =
          (valueDateFrom.getFullYear() - minDate.getFullYear()) * 4 + valueDateFrom.getMonth() - minDate.getMonth();
        let quarterDiffTo =
          (valueDateTo.getFullYear() - minDate.getFullYear()) * 4 + valueDateTo.getMonth() - minDate.getMonth();
        let stepValidateFrom = quarterDiffFrom % step === 0;
        let stepValidateTo = quarterDiffTo % step === 0;
        return stepValidateFrom && stepValidateTo;
      },
      badValue: (value) => {
        let isValidValue = Array.isArray(value)
          ? validateQuarterInputValue(value[0]) && validateQuarterInputValue(value[1])
          : false;
        return value == null || isValidValue;
      },
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <QuarterRangeInputBox {...props} onValidate={onValidate} />;
    //@@viewOff:render
  },
});

QuarterRangeInput.Box = QuarterRangeInputBox;

export { QuarterRangeInput };
export default QuarterRangeInput;
