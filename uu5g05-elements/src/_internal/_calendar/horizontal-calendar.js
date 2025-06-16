//@@viewOn:imports
import {
  createVisualComponent,
  PropTypes,
  useEffect,
  useRef,
  useScreenSize,
  useState,
  useUpdateEffect,
  Utils,
} from "uu5g05";
import { UuDate } from "uu_i18ng01";
import Config from "../../config/config.js";
import CalendarGrid from "./calendar-grid.js";
import CalendarHeader from "./calendar-header.js";
import DayLabels from "./day-labels.js";
import WeekNumbers from "../week-numbers.js";
//@@viewOff:imports

//@@viewOn:constants
const TOP_DATE_LIMIT = "9999-12-31";
//@@viewOff:constants

//@@viewOn:helpers
const CLASS_NAMES = {
  container: (isSmallScreenSize) =>
    Config.Css.css({ display: "flex", flexDirection: "column", alignItems: isSmallScreenSize ? undefined : "center" }),
  gridContent: () => Config.Css.css({ display: "flex" }),
};

function getDateTo(dateTo) {
  let newDateTo = new UuDate(dateTo);
  if (newDateTo.getYear() > 9999) return TOP_DATE_LIMIT;

  return dateTo;
}
//@@viewOff:helpers

const HorizontalCalendar = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "HorizontalCalendar",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    currentDate: PropTypes.string,
    selectedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    onSelect: PropTypes.func,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    step: PropTypes.number,
    displayWeekNumbers: PropTypes.bool,
    selectionMode: PropTypes.oneOf(["single", "range"]),
    selectionType: PropTypes.oneOf(["day", "week"]),
    dateMap: CalendarGrid.propTypes.dateMap,
    weekStartDay: CalendarGrid.propTypes.weekStartDay,
    colorScheme: CalendarGrid.propTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    selectionMode: "single",
    dateTo: TOP_DATE_LIMIT,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      currentDate,
      selectedDate,
      dateFrom: propsDateFrom,
      dateTo: propsDateTo,
      step,
      displayWeekNumbers,
      selectionMode,
      selectionType,
      dateMap,
      weekStartDay,
      colorScheme,
    } = props;

    const validDateTo = getDateTo(propsDateTo);

    const [screenSize] = useScreenSize();
    const isSmallScreenSize = screenSize === "xs";
    const [picker, setPicker] = useState("day");
    const [displayDate, setDisplayDate] = useState(() => {
      let _selectedDate = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
      let currDate = new UuDate(_selectedDate || currentDate);
      let dateFrom = propsDateFrom && new UuDate(propsDateFrom);
      let dateTo = validDateTo && new UuDate(validDateTo);
      return (dateFrom && UuDate.compare(currDate, dateFrom) < 0) || (dateTo && UuDate.compare(currDate, dateTo) > 0)
        ? dateFrom
        : currDate;
    });

    // When dateFrom and dateTo limitation changes, check if displayDate is not outside of limit
    // otherwise set new displayDate to the dateFrom
    useEffect(() => {
      let _selectedDate = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
      let currDate = new UuDate(_selectedDate || currentDate);
      let dateFrom = propsDateFrom && new UuDate(propsDateFrom);
      let dateTo = validDateTo && new UuDate(validDateTo);
      setDisplayDate(
        (dateFrom && UuDate.compare(currDate, dateFrom) < 0) || (dateTo && UuDate.compare(currDate, dateTo) > 0)
          ? dateFrom
          : currDate,
      );
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [propsDateFrom, validDateTo]);

    const onIncreaseDate = (e) => {
      if (picker === "day") {
        setDisplayDate(new UuDate(displayDate.shiftMonth(1)));
      } else if (picker === "month") {
        setDisplayDate(new UuDate(displayDate.shiftYear(1)));
      } else {
        setDisplayDate(new UuDate(displayDate.shiftYear(10)));
      }
    };

    const onDecreaseDate = (e) => {
      if (picker === "day") {
        setDisplayDate(new UuDate(displayDate.shiftMonth(-1)));
      } else if (picker === "month") {
        setDisplayDate(new UuDate(displayDate.shiftYear(-1)));
      } else {
        setDisplayDate(new UuDate(displayDate.shiftYear(-10)));
      }
    };

    const onMinimizeDate = (e) => {
      if (picker === "day") {
        setPicker("month");
      } else if (picker === "month") {
        setPicker("year");
      }
    };

    const onDateSelected = (e) => {
      if (picker === "month") {
        setPicker("day");
        setDisplayDate(new UuDate(e.data.value));
      } else if (picker === "year") {
        setPicker("month");
        setDisplayDate(new UuDate(e.data.value));
      } else {
        onSelect(e);
      }
    };

    const firstSelectionInRange = useRef(true);
    const [selectedValue, setSelectedValue] = useState(selectedDate);
    useUpdateEffect(() => setSelectedValue(selectedDate), [selectedDate]);
    const onSelect = (e, completeRangeSelection) => {
      if (typeof props.onSelect === "function") {
        if (selectionMode === "single" || completeRangeSelection || !e.data.value) {
          firstSelectionInRange.current = true;
          props.onSelect(e);
        } else {
          // range selection
          let value = e.data.value;
          if (typeof value === "string") value = [value, value];
          if (firstSelectionInRange.current) {
            firstSelectionInRange.current = false;
            setSelectedValue(value);
          } else {
            let valueList = [...selectedValue, ...value].sort(); // iso strings can be sorted as strings
            e.data.value = [valueList[0], valueList[valueList.length - 1]];
            props.onSelect(e);
            firstSelectionInRange.current = true;
          }
        }
      }
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, CLASS_NAMES.container(isSmallScreenSize));
    return (
      <div {...attrs}>
        <CalendarHeader
          picker={picker}
          displayDate={displayDate}
          dateFrom={propsDateFrom}
          dateTo={validDateTo}
          onDecreaseDate={onDecreaseDate}
          onMinimizeDate={onMinimizeDate}
          onIncreaseDate={onIncreaseDate}
        />
        {picker === "day" && <DayLabels isWeekNumberDisplayed={displayWeekNumbers} weekStartDay={weekStartDay} />}
        <div className={CLASS_NAMES.gridContent()}>
          {displayWeekNumbers && picker === "day" && (
            <WeekNumbers
              date={displayDate}
              isInteractive={selectionType === "week"}
              onWeekSelected={onSelect}
              testId="week-numbers"
              weekStartDay={weekStartDay}
              selectionType={selectionType}
              dateFrom={propsDateFrom}
              dateTo={validDateTo}
              step={step}
            />
          )}
          <CalendarGrid
            currentDate={currentDate}
            picker={picker}
            displayDate={displayDate}
            selectionType={selectionType}
            selectedDate={selectedValue}
            dateFrom={propsDateFrom}
            dateTo={validDateTo}
            step={step}
            onSelect={onDateSelected}
            dateMap={dateMap}
            weekStartDay={weekStartDay}
            colorScheme={colorScheme}
          />
        </div>
      </div>
    );
    //@@viewOff:render
  },
});

export { HorizontalCalendar };
export default HorizontalCalendar;
