//@@viewOn:imports
import { createVisualComponent, PropTypes, useUserPreferences } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import Config from "../../config/config.js";
import UuGds from "../gds";
import DayGrid from "./day-grid.js";
import MonthGrid from "./month-grid.js";
import YearGrid from "./year-grid.js";
//@@viewOff:imports

const CalendarGrid = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "CalendarGrid",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    currentDate: PropTypes.string,
    picker: PropTypes.oneOf(["day", "month", "year"]).isRequired,
    displayDate: PropTypes.object.isRequired, // UuDate format
    selectionType: PropTypes.oneOf(["day", "week"]),
    selectedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]), // Includes values with string ISO format
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    onSelect: PropTypes.func,
    hideDaysOfDifferentMonth: PropTypes.bool,
    dateMap: DayGrid.propTypes.dateMap,
    weekStartDay: DayGrid.propTypes.weekStartDay,
    colorScheme: PropTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    hideDaysOfDifferentMonth: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { picker, dateMap, weekStartDay: propsWeekStartDay, colorScheme } = props;
    const [pref] = useUserPreferences();

    const weekStartDay = propsWeekStartDay !== undefined ? propsWeekStartDay : pref.weekStartDay;

    // const selectedValue = useRef();

    const onSelect = (e) => {
      if (typeof props.onSelect === "function") {
        if (picker === "month" || picker === "year") {
          props.onSelect(e);
        } else {
          // select whole week if selectionTyoe is week
          if (props.selectionType === "week") {
            let _selectedDate = new UuDate(e.data.value);
            let dayShifh = weekStartDay - _selectedDate.getWeekDay();
            if (dayShifh > 0) dayShifh -= 7;
            e.data.value = [_selectedDate.shiftDay(dayShifh).toIsoString(), _selectedDate.shiftDay(6).toIsoString()];
          }
          props.onSelect(e);
        }
      }
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    if (picker === "year") {
      return (
        <div className={CLASS_NAMES.monthYearGrid()}>
          <YearGrid
            onSelect={onSelect}
            currentDate={props.currentDate}
            displayDate={props.displayDate}
            dateFrom={props.dateFrom}
            dateTo={props.dateTo}
            colorScheme={colorScheme}
          />
        </div>
      );
    } else if (picker === "month") {
      return (
        <div className={CLASS_NAMES.monthYearGrid()}>
          <MonthGrid
            onSelect={onSelect}
            currentDate={props.currentDate}
            displayDate={props.displayDate}
            dateFrom={props.dateFrom}
            dateTo={props.dateTo}
            colorScheme={colorScheme}
          />
        </div>
      );
    }
    return (
      <div className={CLASS_NAMES.dayGrid()}>
        <DayGrid
          onSelect={onSelect}
          currentDate={props.currentDate}
          displayDate={props.displayDate}
          dateFrom={props.dateFrom}
          dateTo={props.dateTo}
          step={props.step}
          selectionType={props.selectionType}
          selectedDate={
            !props.selectedDate || Array.isArray(props.selectedDate)
              ? props.selectedDate
              : [props.selectedDate, props.selectedDate]
          }
          hideDaysOfDifferentMonth={props.hideDaysOfDifferentMonth}
          dateMap={dateMap}
          weekStartDay={weekStartDay}
          colorScheme={colorScheme}
        />
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const CLASS_NAMES = {
  monthYearGrid: () =>
    Config.Css.css({
      display: "grid",
      grid: "auto / repeat(4, 1fr)",
      gridGap: UuGds.SpacingPalette.getValue(["fixed"]).b,
      marginTop: UuGds.SpacingPalette.getValue(["fixed"]).b,
      width: "100%",
      justifyItems: "center",
    }),
  dayGrid: () =>
    Config.Css.css({
      display: "grid",
      grid: "auto / repeat(7, 1fr)",
      gridGap: UuGds.SpacingPalette.getValue(["fixed"]).b,
      width: "100%",
    }),
};
//@@viewOff:helpers

export { CalendarGrid };
export default CalendarGrid;
