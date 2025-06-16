//@@viewOn:imports
import { createVisualComponent, PropTypes, useState, useEffect, useMemo } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import Config from "../../config/config.js";
import DateTime from "../../date-time";
import UuGds from "../gds.js";
import VirtualizedListPicker from "../../virtualized-list-picker";
import Text from "../../text.js";
//@@viewOff:imports

// Limit of displayed months
const MONTHS_AMOUNT = 2500; // (pcs)

const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const MAX_YEAR_DIFF = 50;

const CalendarNavigation = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "CalendarNavigation",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    calendarId: PropTypes.string.isRequired,
    displayDate: PropTypes.string.isRequired,
    navigationDate: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    height: PropTypes.unit,
    colorScheme: VirtualizedListPicker.propTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const [selectedDate, setSelectedDate] = useState(props.navigationDate);
    const [displayedDate, setDisplayedDate] = useState(new UuDate(props.displayDate));

    const onSelect = (e) => {
      if (typeof props.onSelect === "function") {
        props.onSelect(e);
      }
      setSelectedDate(e.data.value);
    };

    const dataCount = useMemo(() => {
      let monthCounter = MONTHS_AMOUNT;
      let dateFrom = props.dateFrom && new UuDate(props.dateFrom).startOfMonth();
      let dateTo = props.dateTo && new UuDate(props.dateTo);

      let yearTitleCounter = Math.round(MONTHS_AMOUNT / 12);
      // Calculate amount of rendered months
      if ((!dateFrom && dateTo) || (dateFrom && !dateTo)) {
        monthCounter /= 2;
        yearTitleCounter /= 2;
      } else if (dateFrom && dateTo) {
        monthCounter = 0;
        yearTitleCounter = 0;
        // Count amount of months and allocate limited dataset when limits are defined
        while (UuDate.compare(dateFrom, dateTo) < 0) {
          if (dateFrom.getMonth() === 1) {
            yearTitleCounter++;
          }
          dateFrom.shiftMonth(1);
          monthCounter++;
        }
      }

      return { monthCounter, yearTitleCounter, sum: monthCounter + yearTitleCounter };
    }, [props.dateFrom, props.dateTo]);

    const data = useMemo(
      () =>
        initializeData(props.dateFrom, props.dateTo, displayedDate, dataCount.monthCounter, dataCount.yearTitleCounter),
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
      [props.dateFrom, props.dateTo],
    );

    // When new navigation date comes, set new selected date
    useEffect(() => {
      setSelectedDate(props.navigationDate);
    }, [props.navigationDate]);

    // When dateFrom and dateTo limitation changes, check if displayedDate is not outside of limit
    useEffect(() => {
      // DisplayDate shouldn't be outside of the limit
      let currDate = new UuDate(props.displayDate);
      let dateFrom = props.dateFrom && new UuDate(props.dateFrom).startOfMonth();
      let dateTo = props.dateTo && new UuDate(props.dateTo);
      setDisplayedDate(() =>
        (dateFrom && UuDate.compare(currDate, dateFrom) < 0) || (dateTo && UuDate.compare(currDate, dateTo) > 0)
          ? dateFrom || dateTo
          : currDate,
      );
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [props.dateFrom, props.dateTo]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <VirtualizedListPicker
        onSelect={onSelect}
        itemList={data}
        height={props.height}
        value={selectedDate || displayedDate.startOfMonth().toIsoString()}
        className={Config.Css.css({
          marginLeft: UuGds.SpacingPalette.getValue(["fixed"]).e,
        })}
        valueAutoScroll
        testId="navigation"
        colorScheme={props.colorScheme}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const initializeData = (propsDateFrom, propsDateTo, displayDate, monthCounter, yearTitleCounter) => {
  const itemsLength = monthCounter + yearTitleCounter;
  let newData = new Array(itemsLength);

  const date = getInitialDate(propsDateFrom, propsDateTo, displayDate, monthCounter);

  const dateYear = date.getYear();
  if (dateYear < MIN_YEAR) date.setYear(MIN_YEAR).startOfYear();
  if (dateYear > MAX_YEAR) date.setYear(MAX_YEAR);

  for (let i = 0; i < itemsLength; i++) {
    if (date.getYear() > MAX_YEAR) {
      newData.splice(i, itemsLength - i);
      break;
    }
    // Year title text
    if (date.getMonth() === 1) {
      newData[i] = {
        children: (
          <Text category="interface" segment="interactive" type="medium">
            <DateTime format="YYYY" value={date.toIsoString()} />
          </Text>
        ),
        heading: false,
      };
      i++;
    }

    // Normal month button
    newData[i] = {
      value: date.toIsoString(),
      children: (
        <Text category="interface" segment="content" type="small" colorScheme="building" significance="subdued">
          <DateTime format="MMM" value={date.toIsoString()} />
        </Text>
      ),
    };
    date.shiftMonth(1);
  }

  return newData;
};

function getInitialDate(dateFrom, dateTo, displayDate, monthCounter) {
  if (dateFrom && dateTo) return new UuDate(dateFrom).startOfMonth();

  let date = new UuDate(displayDate).shiftMonth(-Math.ceil(monthCounter / 2) + 2).startOfMonth();

  if (dateFrom) {
    const dateByDateFrom = new UuDate(dateFrom).startOfMonth();

    if (date.getYear() - dateByDateFrom.getYear() <= MAX_YEAR_DIFF) return dateByDateFrom;

    return date;
  }

  if (dateTo) {
    const dateByDateTo = new UuDate(dateTo).shiftMonth(-monthCounter + 2).startOfMonth();

    if (dateByDateTo.getYear() - date.getYear() <= MAX_YEAR_DIFF) return dateByDateTo;
  }

  return date;
}
//@@viewOff:helpers

export { CalendarNavigation, getInitialDate };
export default CalendarNavigation;
