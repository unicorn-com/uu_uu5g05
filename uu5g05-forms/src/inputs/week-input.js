//@@viewOn:imports
import { createComponent, PropTypes, useDevice, UserPreferencesProvider, useUserPreferences } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import withExtensionInput from "../with-extension-input.js";
import withValidationMap from "../with-validation-map.js";
import InputWeek from "../_internal/input-week.js";
import { dateToIsoWeek, isoWeekToDateRange } from "../_internal/date-tools.js";
import useNativePicker from "../_internal/use-native-picker.js";
import DatePickerContentWrapper from "../_internal/date-picker-content-wrapper.js";
import { getPresetList } from "../_internal/date-preset-tools.js";
import DateCss from "../_internal/date-css.js";
import { getInputComponentColorScheme } from "../_internal/tools.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

const INPUT_WIDTH_MAP = {
  xxs: 160,
  xs: 180,
  s: 200,
  m: 220,
  l: 240,
  xl: 260,
};

const _InputWeek = withExtensionInput(InputWeek);
const { type, ...propTypes } = _InputWeek.propTypes;
const { type: _, _formattedValue, ...defaultProps } = _InputWeek.defaultProps;

//@@viewOn:css
const CLASS_NAMES = { ...DateCss };
//@@viewOff:css

let WeekInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Week.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    weekStartDay: Uu5Elements.Calendar.propTypes.weekStartDay,
    timeZone: Uu5Elements.Calendar.propTypes.timeZone,
    pickerType: PropTypes.oneOf(["vertical", "native"]),
    clearIcon: PropTypes.icon,
    presetList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.oneOf(["thisWeek", "nextWeek", "lastWeek"]),
        PropTypes.shape({
          onClick: PropTypes.func,
          children: PropTypes.node,
        }),
      ]),
    ),
    format: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    weekStartDay: undefined,
    timeZone: undefined,
    iconLeft: "uugds-calendar",
    pickerType: "vertical",
    clearIcon: undefined,
    width: undefined,
    format: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      elementRef,
      onFocus,
      onBlur,
      iconRight,
      weekStartDay,
      timeZone,
      presetList: presetListProp,
      width,
      ...restProps
    } = props;
    const { onChange, value, pickerType, min, max, size } = restProps;
    const { isMobileOrTablet } = useDevice();
    const { displayPicker, inputProps, popoverProps, pickerProps, setDisplayPicker } = useNativePicker(
      {
        ...props,
        // need custom onChange function - Calendar returns date range - transform into iso week
        onChange: (e) => {
          if (typeof onChange === "function") {
            if (e.data.value) {
              e.data.value = dateToIsoWeek(e.data.value[0]);
            }
            onChange(e);
          }
        },
      },
      "week",
      // need custom equal function - Calendar returns one week range - dateToIsoWeek transforms first day of the week into week
      (currentValue, newValue) => dateToIsoWeek(newValue && newValue[0]) === currentValue,
      { openOnArrowDown: false },
    );

    // need to always set weekStartDay to 1 to proper display of ISO week
    const [userPreferences] = useUserPreferences();
    const updatedUserPreferences = { ...userPreferences, weekStartDay: 1 };
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
          value={isoWeekToDateRange(value)}
          {...pickerProps}
          min={minDate && minDate[0]}
          max={maxDate && maxDate[1]}
          displayWeekNumbers
          selectionMode="week"
          direction={pickerType}
          weekStartDay={weekStartDay}
          timeZone={timeZone}
          scrollElementRef={scrollRef}
          {...(!isMobileOrTablet && {
            className: CLASS_NAMES.calendar({ isPreset, isHorizontal }),
            height: "100%",
          })}
          colorScheme={getInputComponentColorScheme(restProps.colorScheme)}
        />
      );
    }

    return (
      <>
        <_InputWeek {...restProps} {...inputProps} type="week" width={width ?? INPUT_WIDTH_MAP[size]} />
        {displayPicker && (
          <Uu5Elements.Popover {...popoverProps} className={CLASS_NAMES.popover()}>
            {({ scrollRef }) => {
              const presetList = getPresetList(presetListProp, props.onChange, () => setDisplayPicker(false), "week");
              return (
                <UserPreferencesProvider {...updatedUserPreferences}>
                  {presetList.length ? (
                    <DatePickerContentWrapper presetList={presetList}>
                      {getCalendar(scrollRef, true)}
                    </DatePickerContentWrapper>
                  ) : (
                    getCalendar(scrollRef)
                  )}
                </UserPreferencesProvider>
              );
            }}
          </Uu5Elements.Popover>
        )}
      </>
    );
    //@@viewOff:render
  },
});

WeekInput = withValidationMap(WeekInput, {
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
  step: {
    message: { import: importLsi, path: ["Validation", "stepWeek"] },
    feedback: "error",
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { WeekInput };
export default WeekInput;
