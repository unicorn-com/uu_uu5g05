//@@viewOn:imports
import { createVisualComponent, PropTypes, useRef, useUserPreferences, Utils } from "uu5g05";
import { UuDateTime } from "uu_i18ng01";
import Config from "./config/config.js";
import HorizontalCalendar from "./_internal/_calendar/horizontal-calendar.js";
import VerticalCalendar from "./_internal/_calendar/vertical-calendar.js";
//@@viewOff:imports

let Calendar = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Calendar",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    onSelect: PropTypes.func,
    min: PropTypes.string,
    max: PropTypes.string,
    step: PropTypes.number,
    displayWeekNumbers: PropTypes.bool,
    selectionMode: PropTypes.oneOf(["single", "range", "week", "weekRange"]),
    direction: PropTypes.oneOf(["horizontal", "vertical"]),
    displayNavigation: PropTypes.bool, // vertical only
    displayPresets: PropTypes.bool, // vertical only
    height: PropTypes.unit, // vertical only
    dateMap: VerticalCalendar.propTypes.dateMap,
    weekStartDay: PropTypes.number,
    timeZone: PropTypes.string,
    colorScheme: PropTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    direction: "horizontal",
    displayWeekNumbers: false,
    displayNavigation: true,
    displayPresets: false,
    dateMap: undefined,
    weekStartDay: undefined,
    timeZone: undefined,
    colorScheme: "primary",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      value,
      direction,
      displayNavigation,
      displayPresets,
      height,
      onSelect,
      min: dateFrom,
      max: dateTo,
      step,
      displayWeekNumbers,
      selectionMode,
      dateMap,
      weekStartDay: propsWeekStartDay,
      timeZone,
      colorScheme,
      _instantSelect, //NOTE: Internal prop to override onSelect functionality for range selectionMode. onSelect is call every time when new date is select.
    } = props;

    const [pref] = useUserPreferences();

    const weekStartDay = propsWeekStartDay !== undefined ? propsWeekStartDay : pref.weekStartDay;

    // format is specified by format option, language is useless here => it is not needed to read it from useLanguge context
    const selectedTimeZone = timeZone !== undefined ? timeZone : pref.timeZone;
    const currentDate = new UuDateTime(null, selectedTimeZone).format("en", { format: "YYYY-MM-DD" });

    const lastLoggedInvalidValueRef = useRef();
    function getValue() {
      try {
        // Validate value
        if (Array.isArray(value)) {
          value.forEach((item) => new UuDateTime(item));
        } else {
          new UuDateTime(value);
        }
        return value;
      } catch (e) {
        if (!Utils.Object.shallowEqual(lastLoggedInvalidValueRef.current, value)) {
          Calendar.logger.warn(e);
        }
        lastLoggedInvalidValueRef.current = value;
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props);
    return (
      <div {...attrs}>
        {direction === "horizontal" ? (
          <HorizontalCalendar
            currentDate={currentDate}
            selectedDate={getValue()}
            onSelect={onSelect}
            dateFrom={dateFrom}
            dateTo={dateTo}
            step={step}
            displayWeekNumbers={displayWeekNumbers}
            {...SELECTION_PROPS_MAP[selectionMode]}
            testId="horizontal-calendar"
            dateMap={dateMap}
            weekStartDay={weekStartDay}
            colorScheme={colorScheme}
          />
        ) : (
          <VerticalCalendar
            currentDate={currentDate}
            value={getValue()}
            onSelect={onSelect}
            dateFrom={dateFrom}
            dateTo={dateTo}
            step={step}
            displayWeekNumbers={displayWeekNumbers}
            {...SELECTION_PROPS_MAP[selectionMode]}
            direction={direction}
            displayNavigation={displayNavigation}
            displayPresets={displayPresets}
            height={height}
            scrollElementRef={props.scrollElementRef}
            scrollElementAttrs={props.scrollElementAttrs}
            testId="vertical-calendar"
            dateMap={dateMap}
            weekStartDay={weekStartDay}
            colorScheme={colorScheme}
            _instantSelect={_instantSelect}
          />
        )}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const SELECTION_PROPS_MAP = {
  single: {
    selectionMode: "single",
    selectionType: "day",
  },
  range: {
    selectionMode: "range",
    selectionType: "day",
  },
  week: {
    selectionMode: "single",
    selectionType: "week",
  },
  weekRange: {
    selectionMode: "range",
    selectionType: "week",
  },
};
//@@viewOff:helpers

Calendar = Utils.Component.memo(Calendar);

export { Calendar };
export default Calendar;
