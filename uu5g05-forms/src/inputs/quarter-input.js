//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import { Popover } from "uu5g05-elements";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import { getInputComponentColorScheme } from "../_internal/tools.js";
import withValidationMap from "../with-validation-map.js";
import QuarterInputBox from "./quarter-input-box.js";
import QuarterPicker from "../_internal/quarter-picker.js";
import { DatePickerContentWrapper } from "../_internal/date-picker-content-wrapper.js";
import { getPresetList } from "../_internal/date-preset-tools.js";
import useDateTimeFormat from "../use-date-time-format.js";
import withExtensionInput from "../with-extension-input.js";
import InputWeek from "../_internal/input-week.js";
import useNativePicker from "../_internal/use-native-picker.js";
import withCustomizedOnChangeValue from "../_internal/with-customized-on-change-value.js";
import { toIsoQuarterValue } from "../_internal/date-tools.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const INPUT_WIDTH_MAP = {
  xxs: 88,
  xs: 100,
  s: 120,
  m: 128,
  l: 140,
  xl: 144,
};
//@@viewOff:constants

//@@viewOn:helpers
const _InputWeek = withExtensionInput(InputWeek);
const { type, ...propTypes } = _InputWeek.propTypes;
const { type: _, _formattedValue, ...defaultProps } = _InputWeek.defaultProps;
//@@viewOff:helpers

let QuarterInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "QuarterInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    value: PropTypes.string,
    onChange: PropTypes.func,
    min: PropTypes.string,
    max: PropTypes.string,
    presetList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.oneOf(["thisQuarter", "nextQuarter", "lastQuarter"]),
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
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { presetList: presetListProp, width, ...otherProps } = props;
    const { value, min, max, step, size } = otherProps;
    const { input, focus, inputProps, displayPicker, pickerProps, popoverProps, setDisplayPicker } = useNativePicker(
      props,
      "quarter",
      undefined,
      { openOnArrowDown: false },
    );

    const isText = !(focus || (input && input.validity.badInput) || value === null);
    const formattedValue = useDateTimeFormat(value);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:renders
    function getCalendar(scrollRef) {
      return (
        <QuarterPicker
          value={value}
          {...pickerProps}
          min={min}
          max={max}
          step={step}
          selectionMode="single"
          scrollElementRef={scrollRef}
          colorScheme={getInputComponentColorScheme(otherProps.colorScheme)}
        />
      );
    }

    return (
      <>
        <_InputWeek
          {...otherProps}
          _formattedValue={isText ? formattedValue : undefined}
          {...inputProps}
          type="quarter"
          width={width ?? INPUT_WIDTH_MAP[size]}
        />
        {displayPicker && (
          <Popover {...popoverProps}>
            {({ scrollRef }) => {
              const presetList = getPresetList(
                presetListProp,
                props.onChange,
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

QuarterInput = withCustomizedOnChangeValue(QuarterInput, toIsoQuarterValue);

QuarterInput = withValidationMap(QuarterInput, {
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

QuarterInput.Box = QuarterInputBox;

export { QuarterInput };
export default QuarterInput;
