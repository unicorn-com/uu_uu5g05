//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";
import { Popover } from "uu5g05-elements";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import MonthPicker from "../_internal/month-picker.js";
import withExtensionInput from "../with-extension-input.js";
import withValidationMap from "../with-validation-map.js";
import InputWeek from "../_internal/input-week.js";
import useNativePicker from "../_internal/use-native-picker.js";
import useDateTimeFormat from "../use-date-time-format.js";
import { DatePickerContentWrapper } from "../_internal/date-picker-content-wrapper.js";
import { getPresetList } from "../_internal/date-preset-tools.js";
import { getInputComponentColorScheme } from "../_internal/tools.js";
import withCustomizedOnChangeValue from "../_internal/with-customized-on-change-value.js";
import { toIsoMonthValue } from "../_internal/date-tools.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

const INPUT_WIDTH_MAP = {
  xxs: 120,
  xs: 140,
  s: 160,
  m: 180,
  l: 200,
  xl: 220,
};

const _InputWeek = withExtensionInput(InputWeek);
const { type, ...propTypes } = _InputWeek.propTypes;
const { type: _, _formattedValue, ...defaultProps } = _InputWeek.defaultProps;

let MonthInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Month.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    pickerType: PropTypes.oneOf(["vertical", "native"]),
    clearIcon: PropTypes.icon,
    presetList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.oneOf(["thisMonth", "lastMonth", "nextMonth"]),
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
    clearIcon: undefined,
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { elementRef, onFocus, onBlur, iconRight, presetList: presetListProp, width, ...restProps } = props;
    const { value, min, max, step, size } = restProps;
    const { input, focus, inputProps, displayPicker, pickerProps, popoverProps, setDisplayPicker } = useNativePicker(
      props,
      "month",
      undefined,
      { openOnArrowDown: false },
    );

    const isText = !(focus || (input && input.validity.badInput) || value === null);
    const formattedValue = useDateTimeFormat(value);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    function getCalendar(scrollRef) {
      return (
        <MonthPicker
          value={value}
          {...pickerProps}
          min={min}
          max={max}
          step={step}
          scrollElementRef={scrollRef}
          scrollElementAttrs={{ onMouseDown: (e) => e.preventDefault() }} // prevent invocation of onBlur
          colorScheme={getInputComponentColorScheme(restProps.colorScheme)}
        />
      );
    }

    return (
      <>
        <_InputWeek
          {...restProps}
          _formattedValue={isText ? formattedValue : undefined}
          {...inputProps}
          type="month"
          width={width ?? INPUT_WIDTH_MAP[size]}
        />
        {displayPicker && (
          <Popover {...popoverProps}>
            {({ scrollRef }) => {
              const presetList = getPresetList(presetListProp, props.onChange, () => setDisplayPicker(false), "month");
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

MonthInput = withCustomizedOnChangeValue(MonthInput, toIsoMonthValue);

MonthInput = withValidationMap(MonthInput, {
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

export { MonthInput };
export default MonthInput;
