//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, useScreenSize, useUserPreferences, Utils } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import ScrollableBox from "../../scrollable-box";
import UuGds from "../gds";
import Config from "../../config/config.js";
import Button from "../../button";
import importLsi from "../../lsi/import-lsi";
//@@viewOff:imports

const PRESET_LIST = [
  {
    children: <Lsi import={importLsi} path={["verticalCalendar", "today"]} />,
    getValue: () => new UuDate().toIsoString(),
    selectionType: "day",
  },
  {
    children: <Lsi import={importLsi} path={["verticalCalendar", "yesterday"]} />,
    getValue: () => new UuDate().shiftDay(-1).toIsoString(),
    selectionType: "day",
  },
  {
    children: <Lsi import={importLsi} path={["verticalCalendar", "last7Days"]} />,
    getValue: () => [new UuDate().shiftDay(-6).toIsoString(), new UuDate().toIsoString()],
    selectionType: "day",
    selectionMode: "range",
  },
  {
    children: <Lsi import={importLsi} path={["verticalCalendar", "last30Days"]} />,
    getValue: () => [new UuDate().shiftDay(-29).toIsoString(), new UuDate().toIsoString()],
    selectionType: "day",
    selectionMode: "range",
  },
  {
    children: <Lsi import={importLsi} path={["verticalCalendar", "thisMonth"]} />,
    getValue: () => [new UuDate().startOfMonth().toIsoString(), new UuDate().endOfMonth().toIsoString()],
    selectionType: "day",
    selectionMode: "range",
  },
  {
    children: <Lsi import={importLsi} path={["verticalCalendar", "previousMonth"]} />,
    getValue: () => [
      new UuDate().shiftMonth(-1).startOfMonth().toIsoString(),
      new UuDate().shiftMonth(-1).endOfMonth().toIsoString(),
    ],
    selectionType: "day",
    selectionMode: "range",
  },
];

const CalendarPresets = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "CalendarPresets",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    onSelect: PropTypes.func,
    selectionMode: PropTypes.oneOf(["single", "range"]),
    selectionType: PropTypes.oneOf(["day", "week"]),
    height: PropTypes.unit,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    selectionMode: "single",
    selectionType: "day",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const [screenSize] = useScreenSize();
    const isSmallScreenSize = screenSize === "xs";
    const { weekStartDay } = useUserPreferences();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <ScrollableBox
        scrollIndicator="disappear"
        height={isSmallScreenSize ? undefined : props.height}
        horizontal={isSmallScreenSize}
        scrollbarWidth={10}
        testId="presets"
      >
        <div className={CLASS_NAMES.buttonsContainer(isSmallScreenSize)}>
          {PRESET_LIST.filter(
            (preset) =>
              (!preset.selectionMode || preset.selectionMode === props.selectionMode) &&
              (!preset.selectionType || preset.selectionType === props.selectionType),
          ).map((preset, index) => {
            const isSelected = isSame(preset.getValue(weekStartDay), props.value);
            return (
              <Button
                key={index}
                size="xs"
                significance="subdued"
                pressed={isSelected}
                colorScheme={isSelected ? "primary" : undefined}
                className={CLASS_NAMES.button()}
                onClick={(e) => {
                  if (typeof props.onSelect === "function") {
                    props.onSelect(
                      new Utils.Event({ value: getPresetValue(preset, weekStartDay, props.selectionMode) }),
                      e,
                    );
                  }
                }}
              >
                {preset.children}
              </Button>
            );
          })}
        </div>
      </ScrollableBox>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const getPresetValue = (preset, weekStartDay, selectionMode) => {
  let value = preset.getValue(weekStartDay);
  if (selectionMode === "range" && value && !Array.isArray(value)) {
    value = [value, value];
  }
  return value;
};
const isSame = (value, presetValue) => {
  if (typeof value === "string" && typeof presetValue === "string") return value === presetValue;

  const _value = Array.isArray(value) ? value : [value, value];
  const _presetValue = Array.isArray(presetValue) ? presetValue : [presetValue, presetValue];
  return _value.every((date, index) => date === _presetValue[index]);
};
const CLASS_NAMES = {
  button: () =>
    Config.Css.css({
      // need to overweight default button text alignment
      "&&": {
        justifyContent: "left",
      },
    }),
  buttonsContainer: (isSmallScreenSize) =>
    Config.Css.css({
      width: "max-content",
      display: isSmallScreenSize ? null : "flex",
      flexDirection: isSmallScreenSize ? null : "column",
      gap: isSmallScreenSize ? null : UuGds.SpacingPalette.getValue(["fixed"]).b,
      paddingTop: isSmallScreenSize ? undefined : UuGds.SpacingPalette.getValue(["fixed"]).e,
      paddingBottom: isSmallScreenSize ? UuGds.SpacingPalette.getValue(["fixed"]).e : undefined,
      paddingRight: isSmallScreenSize ? undefined : UuGds.SpacingPalette.getValue(["fixed"]).e,
    }),
};
//@@viewOff:helpers

export { CalendarPresets };
export default CalendarPresets;
