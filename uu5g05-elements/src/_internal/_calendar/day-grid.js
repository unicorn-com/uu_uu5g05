//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import Config from "../../config/config.js";
import Text from "../../text.js";
import DateItem from "./date-item.js";
import Tools from "../tools.js";
//@@viewOff:imports

const DAYS_IN_WEEK = 7;
const SATURDAY = 6;
const SUNDAY = 7;
// Other items than index 34 could be items of different month and last week row
const ENOUGH_ITEMS_RENDERED = 34;

const DayGrid = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DayGrid",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onSelect: PropTypes.func.isRequired,
    currentDate: PropTypes.string,
    displayDate: PropTypes.object.isRequired,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    step: PropTypes.number,
    selectionType: PropTypes.oneOf(["day", "week"]),
    selectedDate: PropTypes.array,
    hideDaysOfDifferentMonth: PropTypes.bool,
    dateMap: PropTypes.object,
    weekStartDay: PropTypes.number.isRequired,
    colorScheme: DateItem.propTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    dateMap: undefined,
    weekStartDay: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onSelect, dateMap, weekStartDay, step, selectionType, colorScheme: colorSchemeProp } = props;

    const selectedDate = props.selectedDate ?? [];
    const currentDate = props.currentDate ? new UuDate(props.currentDate) : null;
    const dateFrom = props.dateFrom ? new UuDate(props.dateFrom) : null; // Max calendar limitation
    const dateTo = props.dateTo ? new UuDate(props.dateTo) : null; // Min calendar limitation
    const selectedDateFrom = selectedDate[0] ? new UuDate(selectedDate[0]) : selectedDate[0];
    const selectedDateTo = selectedDate[1] ? new UuDate(selectedDate[1]) : selectedDate[1];
    const displayDate = new UuDate(props.displayDate).startOfMonth();
    // Shift date by user preference
    while (weekStartDay !== displayDate.getWeekDay()) {
      displayDate.shiftDay(-1);
    }
    const firstDayOfTheCalendar = new UuDate(displayDate);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const dayGrid = [];
    // When first date of the month and week doesn't start with day '1',
    // we have to display days of a different month.
    let differentMonthFlag = displayDate.getDay() !== 1;
    let dateFromWeekStart;
    for (let i = 0; i < 42; i++) {
      let currentDay = displayDate.getDay();
      if (currentDay === 1 && i !== 0) {
        differentMonthFlag = !differentMonthFlag;
      }

      const dateMapItem = dateMap?.[displayDate.toIsoString()];
      const { colorScheme, significance } = dateMapItem ?? {};
      const visualProps = {};
      if (colorScheme || dateMapItem) visualProps.colorScheme = colorScheme ?? colorSchemeProp;
      if (significance) visualProps.significance = significance;

      let outOfLimit =
        (dateFrom && UuDate.compare(displayDate, dateFrom) < 0) || (dateTo && UuDate.compare(displayDate, dateTo) > 0);
      if (!outOfLimit && step && step !== 1) {
        if (selectionType === "week") {
          dateFromWeekStart ??= (dateFrom ? new UuDate(dateFrom) : new UuDate("1970-01-01")).startOfWeek(weekStartDay);
          let displayDateWeekStart = new UuDate(displayDate).startOfWeek(weekStartDay);
          outOfLimit =
            Math.round(Tools.getDaysDiff(dateFromWeekStart.toDate(), displayDateWeekStart.toDate()) / 7) % step !== 0;
        } else {
          outOfLimit =
            Tools.getDaysDiff((dateFrom || new UuDate("1970-01-01")).toDate(), displayDate.toDate()) % step !== 0;
        }
      }
      let isWeekend = displayDate.getWeekDay() === SATURDAY || displayDate.getWeekDay() === SUNDAY;
      if (
        props.hideDaysOfDifferentMonth &&
        differentMonthFlag &&
        Math.abs(new UuDate(firstDayOfTheCalendar).endOfMonth().getDay() - firstDayOfTheCalendar.getDay()) + 1 >=
          DAYS_IN_WEEK
      ) {
        // Do not display first row if it contains only days from a different month and hideDaysOfDifferentMonth is defined
      } else if (props.hideDaysOfDifferentMonth && differentMonthFlag && i > ENOUGH_ITEMS_RENDERED) {
        // Do not display last row if it contains only days from a different month and hideDaysOfDifferentMonth is defined
      } else if (props.hideDaysOfDifferentMonth && differentMonthFlag) {
        // Display empty button of different month only when hideDaysOfDifferentMonth is defined
        dayGrid.push(<DateItem key={i} type={"hidden"} />);
      } else if (
        (selectedDateFrom && UuDate.compare(displayDate, selectedDateFrom) === 0) ||
        (selectedDateTo && UuDate.compare(displayDate, selectedDateTo) === 0)
      ) {
        // Display selected date (min, max)
        dayGrid.push(
          <DateItem
            key={i}
            type={"selected"}
            onClick={onSelect}
            date={displayDate.toIsoString()}
            disabled={outOfLimit}
            elementAttrs={{ "aria-selected": selectedDate ? "true" : "false" }}
            colorScheme={colorSchemeProp}
            {...visualProps}
          >
            <Text category="interface" segment="interactive" type="medium">
              {currentDay}
            </Text>
          </DateItem>,
        );
      } else if (
        selectedDateFrom &&
        selectedDateTo &&
        UuDate.compare(displayDate, selectedDateFrom) > 0 &&
        UuDate.compare(displayDate, selectedDateTo) < 0
      ) {
        // Display day that is between a selected range
        dayGrid.push(
          <DateItem
            key={i}
            type={"midSelected"}
            onClick={onSelect}
            date={displayDate.toIsoString()}
            disabled={outOfLimit}
            colorScheme={colorSchemeProp}
            {...visualProps}
          >
            <Text
              category="interface"
              segment="interactive"
              type="medium"
              colorScheme={isWeekend ? "negative" : undefined}
            >
              {currentDay}
            </Text>
          </DateItem>,
        );
      } else if (currentDate && UuDate.compare(displayDate, currentDate) === 0) {
        // Display current day
        dayGrid.push(
          <DateItem
            key={i}
            type={"current"}
            onClick={onSelect}
            date={displayDate.toIsoString()}
            disabled={outOfLimit}
            elementAttrs={{ "aria-current": currentDay ? "date" : false }}
            testId="current-day"
            colorScheme={colorSchemeProp}
            {...visualProps}
          >
            <Text
              category="interface"
              segment="interactive"
              type="medium"
              colorScheme={isWeekend ? "negative" : undefined}
            >
              {currentDay}
            </Text>
          </DateItem>,
        );
      } else if (differentMonthFlag) {
        // Display different days of different month
        dayGrid.push(
          <DateItem
            key={i}
            type={"different"}
            onClick={onSelect}
            date={displayDate.toIsoString()}
            disabled={outOfLimit}
            colorScheme={colorSchemeProp}
            {...visualProps}
          >
            <Text
              category="interface"
              segment="interactive"
              type="medium"
              colorScheme={isWeekend ? "negative" : undefined}
              disabled
            >
              {currentDay}
            </Text>
          </DateItem>,
        );
      } else {
        // Display current day of the month
        dayGrid.push(
          <DateItem key={i} onClick={onSelect} date={displayDate.toIsoString()} disabled={outOfLimit} {...visualProps}>
            <Text
              category="interface"
              segment="interactive"
              type="medium"
              colorScheme={isWeekend ? "negative" : undefined}
            >
              {currentDay}
            </Text>
          </DateItem>,
        );
      }

      displayDate.shiftDay(1);
    }
    return dayGrid;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { DayGrid };
export default DayGrid;
