//@@viewOn:imports
import { createComponent, UserPreferencesProvider, useDevice, PropTypes } from "uu5g05";
import { Popover } from "uu5g05-elements";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import YearPicker from "../_internal/year-picker";
import withExtensionInput from "../with-extension-input.js";
import withValidationMap from "../with-validation-map.js";
import NumberInput from "./number-input.js";
import TextInput from "./text-input.js";
import useNativePicker from "../_internal/use-native-picker.js";
import withStringYearInput from "../_internal/with-string-year.js";
import { DatePickerContentWrapper } from "../_internal/date-picker-content-wrapper.js";
import { getPresetList } from "../_internal/date-preset-tools.js";
import { getInputComponentColorScheme } from "../_internal/tools.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

const INPUT_WIDTH_MAP = {
  xxs: 80,
  xs: 80,
  s: 100,
  m: 100,
  l: 120,
  xl: 120,
};

const _NumberInput = withExtensionInput(NumberInput);
const { type, ...propTypes } = _NumberInput.propTypes;
const { type: _, _formattedValue, ...defaultProps } = _NumberInput.defaultProps;

const _TextInput = withExtensionInput(TextInput);

const RESTRICTED_KEY_LIST = ["e", "E", ",", ".", "-", "+"];
// limitation given by standard
const MIN_YEAR = 0;
const MAX_YEAR = 9999;

let YearInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "YearInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    clearIcon: PropTypes.icon,
    presetList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.oneOf(["thisYear", "nextYear", "lastYear"]),
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
    clearIcon: undefined,
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { elementRef, onFocus, onBlur, iconRight, presetList: presetListProp, width, ...restProps } = props;
    const { min, max, value, step, size } = restProps;
    const { isMobileOrTablet } = useDevice();
    let Input = isMobileOrTablet ? _TextInput : _NumberInput;
    const inputType = isMobileOrTablet ? "text" : "number";
    const { inputProps, displayPicker, pickerProps, popoverProps, setDisplayPicker } = useNativePicker(
      { ...props, pickerType: "not-native" }, // disable behavior of native inpu ot mobile devices - opening keyboard, show picker onClick etc...
      inputType,
      undefined,
      {
        openOnArrowDown: false,
      },
    );

    let inputComponentProps = { ...restProps, ...inputProps };

    // block unsupported keys
    inputComponentProps.elementAttrs = inputComponentProps.elementAttrs || {};
    const onKeyDown = inputComponentProps.elementAttrs.onKeyDown;
    // some keys does not cause call of onChange event
    inputComponentProps.elementAttrs.onKeyDown = (e) => {
      if (RESTRICTED_KEY_LIST.includes(e.key)) {
        e.preventDefault();
      }
      if (typeof onKeyDown === "function") onKeyDown(e);
    };

    // restrict possible values
    const onChange = inputComponentProps.onChange;
    inputComponentProps.onChange = (e) => {
      // there is possibility then year is returned as a number in case of mobile device - there is used text input instead of string to disable opening native keyboard
      if (typeof e.data.value === "string") e.data.value = Number(e.data.value);
      if (e.data.value) {
        if (e.data.value > MAX_YEAR || e.data.value < MIN_YEAR) {
          return; // stop propagation of change to the parent onChange => block changes
        }
      }
      if (typeof onChange === "function") onChange(e);
    };

    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    function getCalendar(scrollRef) {
      return (
        <YearPicker
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
        <UserPreferencesProvider numberGroupingSeparator={""}>
          <Input
            {...inputComponentProps}
            min={min}
            max={max}
            readOnly={inputProps.readOnly || isMobileOrTablet}
            width={width ?? INPUT_WIDTH_MAP[size]}
          />
        </UserPreferencesProvider>
        {displayPicker && (
          <Popover {...popoverProps}>
            {({ scrollRef }) => {
              const presetList = getPresetList(presetListProp, props.onChange, () => setDisplayPicker(false), "year");
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

YearInput = withStringYearInput(YearInput);

YearInput = withValidationMap(YearInput, {
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

export { YearInput };
export default YearInput;
