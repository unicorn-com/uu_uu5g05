//@@viewOn:imports
import {
  createVisualComponent,
  PropTypes,
  useCallback,
  useEffect,
  useElementSize,
  useEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useScreenSize,
  useState,
  useUpdateEffect,
  Utils,
} from "uu5g05";
import { UuDate } from "uu_i18ng01";
import Config from "../../config/config.js";
import CalendarPresets from "./calendar-presets.js";
import CalendarHeader from "./calendar-header";
import CalendarGrid from "./calendar-grid";
import DayLabels from "./day-labels";
import UuGds from "../gds.js";
import { CalendarNavigation, getInitialDate } from "./calendar-navigation";
import WeekNumbers from "../week-numbers";
import VirtualList from "../_virtual-list/virtual-list.js";
import ScrollableBox from "../../scrollable-box.js";
//@@viewOff:imports

// Limit of displayed months
const MONTHS_AMOUNT = 2500; // (pcs)
// Estimated item height
const ESTIMATED_ITEM_HEIGHT = 276; // (px)
// Gap between month calendars
const GAP = UuGds.SpacingPalette.getValue(["fixed"]).e;
// Bottom limit date
const BOTTOM_LIMIT_DATE = "0001-01-01";
const MIN_YEAR = 1;
const MAX_YEAR = 9999;

const VerticalCalendar = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "VerticalCalendar",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    currentDate: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    onSelect: PropTypes.func,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    step: PropTypes.number,
    displayWeekNumbers: PropTypes.bool,
    selectionMode: PropTypes.oneOf(["single", "range"]),
    selectionType: PropTypes.oneOf(["day", "week"]),
    displayNavigation: PropTypes.bool,
    displayPresets: PropTypes.bool,
    height: PropTypes.unit,
    dateMap: CalendarGrid.propTypes.dateMap,
    weekStartDay: CalendarGrid.propTypes.weekStartDay,
    colorScheme: PropTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    selectionMode: "single",
    selectionType: "day",
    height: 504,
    colorScheme: "primary",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      currentDate,
      value,
      dateFrom: propsDateFrom,
      dateTo: propsDateTo,
      step,
      displayWeekNumbers,
      selectionMode,
      selectionType,
      displayNavigation,
      displayPresets,
      height,
      dateMap,
      weekStartDay,
      colorScheme,
      _instantSelect,
    } = props;

    const calendarId = useRef(generateId());
    const scrollElementRef = useRef();
    const skipInitialLimitCheck = useRef(true);
    const ignoreScrolling = useRef(false);
    // FIXME - After selecting presets, smooth scroll has to be disabled otherwise nothing happens
    const isSmoothScroll = useRef(true);

    const [navigationDate, setNavigationDate] = useState(null);
    const [displayDate, setDisplayDate] = useState(() => {
      if (value) return new UuDate(getSingleValue(value));

      let dateFrom = new UuDate(propsDateFrom);
      let dateTo = new UuDate(propsDateTo);
      let currDate = new UuDate(currentDate);
      return (dateFrom && UuDate.compare(currDate, dateFrom) < 0) || (dateTo && UuDate.compare(currDate, dateTo) > 0)
        ? dateFrom || dateTo
        : currDate;
    });
    const data = useMemo(
      () => initializeData(propsDateFrom, propsDateTo, displayDate),
      [displayDate, propsDateFrom, propsDateTo],
    );

    const isBottomLimitRef = useRef(false);
    isBottomLimitRef.current = data[0].date === BOTTOM_LIMIT_DATE;

    const [navigationDateIndex, setNavigationDateIndex] = useState({
      index: getInitialNavigationDateIndex(propsDateFrom, getSingleValue(value) || currentDate, data), // object because of forced rerenders when new value is set
    });

    const [screenSize] = useScreenSize();
    const isSmallScreenSize = ["xs"].indexOf(screenSize) > -1 ? true : false;

    const { ref: elementSizeRef, width: calendarWidth, height: calendarHeight } = useElementSize();
    const itemHeight = useMemo(() => {
      let visibleMonths = scrollElementRef.current?.querySelectorAll(`[id^="${calendarId.current}-calendar-"]`);
      if (visibleMonths) {
        // Get maximum height of month calendars
        visibleMonths = Array.from(visibleMonths);
        const maxItemHeight = Math.max(
          ...visibleMonths.map((month) => {
            let height = 0;
            for (let monthItem of month.children) {
              height += monthItem.clientHeight;
            }
            return height;
          }),
        );
        return maxItemHeight < ESTIMATED_ITEM_HEIGHT ? ESTIMATED_ITEM_HEIGHT : maxItemHeight;
      }
      return ESTIMATED_ITEM_HEIGHT;
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [calendarWidth, calendarHeight]);

    // On init, center scrollableBox
    useLayoutEffect(() => {
      scrollElementRef.current.style.scrollBehavior = "auto";
      // Get initial scrollTop value
      scrollElementRef.current.scrollTop = getInitialScrollTop(
        propsDateFrom,
        navigationDateIndex.index,
        itemHeight,
        scrollElementRef.current,
      );
      scrollElementRef.current.style.scrollBehavior = "smooth";
    }, []);

    useEffect(() => {
      const dateIndex = findIndexByDate(data, new UuDate(displayDate).startOfMonth().toIsoString());
      setNavigationDateIndex({ index: dateIndex });
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [displayDate]);

    // On mount, check if selected date has some value - if so, scroll to selected dateFrom value.
    useEffect(() => {
      if (value) {
        let _value = Array.isArray(value) ? value[0] : value;
        const newSelectedDate = new UuDate(_value).startOfMonth().toIsoString();
        const dateIndex = findIndexByDate(data, newSelectedDate);
        setNavigationDate(newSelectedDate);
        setNavigationDateIndex({ index: dateIndex });
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, []);

    // Event Listener on 'scroll' to calculate which month is visible in viewport, so we can select it in calendar navigation
    const previousScrollTop = useRef();
    const debounceScrollFc = useRef(
      Utils.Function.debounce(
        (e, _navigationDate) => {
          let visibleMonths = scrollElementRef.current?.querySelectorAll(`[id^="${calendarId.current}-calendar-"]`);

          if (!previousScrollTop.current) previousScrollTop.current = scrollElementRef.current.scrollTop;
          // 1 = going up; 0 = same; -1 = going down
          let direction =
            e.target.scrollTop > previousScrollTop.current
              ? -1
              : e.target.scrollTop < previousScrollTop.current
                ? 1
                : 0;

          if (visibleMonths && direction !== 0 && !ignoreScrolling.current) {
            previousScrollTop.current = e.target.scrollTop;
            visibleMonths = Array.from(visibleMonths);

            let index = 0;
            // When we are scrolling down, reverse array of visible months
            // so we can pick the first visible month from the bottom
            if (direction === -1) visibleMonths.reverse();
            for (const month of visibleMonths) {
              let isMonthVisible = isCalendarInViewport(month, scrollElementRef.current);
              if (isMonthVisible) {
                break;
              }
              index++;
            }

            // When none of the months are in the vieport, select the middle one
            if (index >= visibleMonths.length) {
              index = Math.floor((visibleMonths.length - 1) / 2);
            }

            const newScrolledDate = new UuDate(visibleMonths[index].id.substr(visibleMonths[index].id.length - 10));
            if (!_navigationDate || UuDate.compare(new UuDate(_navigationDate), newScrolledDate) !== 0) {
              setNavigationDate(newScrolledDate.toIsoString());
            }
          }
        },
        64,
        { maxWait: 64 },
      ),
    );
    useEvent("scroll", (e) => debounceScrollFc.current(e, navigationDate), scrollElementRef.current);

    // When new navigationDateIndex is set
    useLayoutEffect(() => {
      if (navigationDateIndex.index !== null && scrollElementRef.current) {
        const selectedDateEl = scrollElementRef.current.querySelector(
          `[id^="${calendarId.current}-calendar-${navigationDateIndex.index}-"]`,
        );
        if (selectedDateEl && !isBottomLimitRef.current) {
          // Element is in the viewport - smooth scroll to the element
          // FIXME - When clicking on presets, it should smooth scroll to the selected month
          if (!isSmoothScroll.current) scrollElementRef.current.style.scrollBehavior = "auto";
          selectedDateEl?.scrollIntoView({ block: "center" });
          if (!isSmoothScroll.current) {
            scrollElementRef.current.style.scrollBehavior = "smooth";
            isSmoothScroll.current = true;
          }
        } else {
          // Element is not in the viewport
          scrollElementRef.current.style.scrollBehavior = "auto";
          // FIXME - When changing width of the window, only page refresh
          // fixes the offsets when selectiong months from the navigation.
          // Might be wrongly updated values of the Top and Bottom padding in the virtual list
          let newScrollTop = getScrollTopValue(
            navigationDateIndex.index,
            itemHeight,
            scrollElementRef.current.clientHeight,
          );

          scrollElementRef.current.scrollTop = newScrollTop < 0 ? 0 : newScrollTop;
          scrollElementRef.current.style.scrollBehavior = "smooth";
        }
      }
    }, [itemHeight, navigationDateIndex]);

    // When dateFrom and dateTo limitation changes, check if displayDate is not outside of limit
    // otherwise set new displayDate to the dateFrom and also set new dataset
    useEffect(() => {
      if (value) return; // Skip setDisplayDate when value is defined
      // Skip initial limit check when limit is not defined so we can initially scroll to selectedDate value
      if (!skipInitialLimitCheck.current || propsDateFrom || propsDateTo) {
        // DisplayDate shouldn't be outside of the limit
        let currDate = new UuDate(currentDate);
        let dateFrom = propsDateFrom && new UuDate(propsDateFrom).startOfMonth();
        let dateTo = propsDateTo && new UuDate(propsDateTo);
        setDisplayDate(() =>
          (dateFrom && UuDate.compare(currDate, dateFrom) < 0) || (dateTo && UuDate.compare(currDate, dateTo) > 0)
            ? dateFrom || dateTo
            : currDate,
        );
      }
      skipInitialLimitCheck.current = false;
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [propsDateFrom, propsDateTo, value]);

    // This fc doesn't let Event listener on 'scroll', do any state updates for 1000ms period
    const ignoreSmoothScroll = useCallback(() => {
      ignoreScrolling.current = true;
      setTimeout(() => {
        ignoreScrolling.current = false;
      }, 1000);
    }, []);

    // User selects month in CalendarNavigation
    const onMonthSelected = useCallback(
      (e) => {
        ignoreSmoothScroll();
        setNavigationDateIndex({ index: findIndexByDate(data, e.data.value) });
      },
      [data, ignoreSmoothScroll],
    );

    // User picks some preset
    const onPresetSelected = (e) => {
      onSelect(e, true);
      let navigationDate = Array.isArray(e.data.value) ? e.data.value[0] : e.data.value;
      setNavigationDate(navigationDate && new UuDate(navigationDate).startOfMonth().toIsoString());
      ignoreSmoothScroll();
      isSmoothScroll.current = false;
      setNavigationDateIndex({ index: findIndexByDate(data, navigationDate) });
    };

    const firstSelectionInRange = useRef(true);
    const [selectedValue, setSelectedValue] = useState(typeof value === "string" ? [value, value] : value);
    useUpdateEffect(() => setSelectedValue(value), [value]);
    const onSelect = (e, completeRangeSelection) => {
      if (typeof props.onSelect !== "function") return;

      if (
        selectionMode === "single" ||
        completeRangeSelection ||
        !e.data.value ||
        (selectionMode === "range" && selectionType === "day" && Array.isArray(e.data.value))
      ) {
        firstSelectionInRange.current = true;
        props.onSelect(e);
        return;
      }

      // range selection
      let value = e.data.value;
      if (typeof value === "string") value = [value, value];

      // first from range
      if (firstSelectionInRange.current) {
        firstSelectionInRange.current = false;
        setSelectedValue(value);
        // instantSelect (e.g. DateRange), onSelect is called with selected value
        if (_instantSelect) {
          let newValue = [e.data.value];
          if (selectionType === "week" && e.data.value) newValue = [e.data.value[0]];
          props.onSelect(new Utils.Event({ value: newValue }, e));
        }
        return;
      }

      // second from range
      let valueList = [...selectedValue, ...value].filter(Boolean).sort(); // iso strings can be sorted as strings
      e.data.value = [valueList[0], valueList[valueList.length - 1]];
      props.onSelect(e);
      firstSelectionInRange.current = true;
    };

    const currentValuesRef = useRef();
    useEffect(() => {
      currentValuesRef.current = { onSelect };
    });
    const onSelect_stableRef = useRef((...args) => currentValuesRef.current?.onSelect?.(...args));
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const renderItem = useCallback(
      ({ data }) => {
        const date = new UuDate(data.date);
        return (
          <div
            key={`${calendarId.current}-calendar-${data.index}-${date.toIsoString()}`}
            id={`${calendarId.current}-calendar-${data.index}-${date.toIsoString()}`}
            className={CLASS_NAMES.calendarItem(itemHeight)}
            data-item-id={data.index}
          >
            <CalendarHeader
              picker="day"
              displayDate={date}
              interactive={false}
              dateFrom={propsDateFrom}
              dateTo={propsDateTo}
              onSelect={onSelect_stableRef.current}
              selectionMode={selectionMode}
              selectionType={selectionType}
            />
            <DayLabels isWeekNumberDisplayed={displayWeekNumbers} weekStartDay={weekStartDay} />
            <div className={CLASS_NAMES.gridContent()}>
              {displayWeekNumbers && (
                <WeekNumbers
                  date={date}
                  isInteractive={selectionType === "week" || selectionMode === "range"}
                  onWeekSelected={onSelect_stableRef.current}
                  hideWeeksOfDifferentMonth
                  weekStartDay={weekStartDay}
                  selectionType={selectionType}
                  dateFrom={propsDateFrom}
                  dateTo={propsDateTo}
                  step={step}
                />
              )}
              <CalendarGrid
                currentDate={currentDate}
                picker="day"
                displayDate={date}
                selectionType={selectionType}
                selectedDate={selectedValue}
                dateFrom={propsDateFrom}
                dateTo={propsDateTo}
                step={step}
                onSelect={onSelect_stableRef.current}
                hideDaysOfDifferentMonth
                dateMap={dateMap}
                weekStartDay={weekStartDay}
                colorScheme={colorScheme}
              />
            </div>
          </div>
        );
      },
      [
        currentDate,
        dateMap,
        displayWeekNumbers,
        itemHeight,
        propsDateFrom,
        propsDateTo,
        selectedValue,
        selectionMode,
        selectionType,
        step,
        weekStartDay,
      ],
    );

    const calendarNavigation = useMemo(
      () =>
        displayNavigation && (
          <CalendarNavigation
            calendarId={calendarId.current}
            displayDate={displayDate.toIsoString()}
            navigationDate={navigationDate ? navigationDate : undefined}
            onSelect={onMonthSelected}
            height={height}
            dateFrom={propsDateFrom}
            dateTo={propsDateTo}
            colorScheme={colorScheme}
          />
        ),
      [displayDate, displayNavigation, height, navigationDate, onMonthSelected, propsDateFrom, propsDateTo],
    );

    const attrs = Utils.VisualComponent.getAttrs(
      props,
      CLASS_NAMES.container({ isColumn: displayPresets && isSmallScreenSize }),
    );
    return (
      <div {...attrs}>
        {displayPresets && (
          <CalendarPresets
            value={selectedValue}
            onSelect={onPresetSelected}
            height={height}
            selectionMode={props.selectionMode}
            selectionType={props.selectionType}
          />
        )}
        <div className={CLASS_NAMES.containerWithoutPresets()} ref={elementSizeRef}>
          <ScrollableBox
            scrollElementRef={Utils.Component.combineRefs(props.scrollElementRef, scrollElementRef)}
            elementAttrs={props.scrollElementAttrs}
            className={CLASS_NAMES.scrollableBox()}
            height={height}
            scrollIndicator="disappear"
            scrollbarWidth={0}
            testId="scrollable-box"
          >
            <VirtualList
              columnCount={1}
              overscanRowCountTop={1}
              overscanRowCountBottom={1}
              rowHeightEstimated={itemHeight}
              horizontalGap={GAP}
              verticalGap={0}
              data={data}
            >
              {renderItem}
            </VirtualList>
          </ScrollableBox>
          {calendarNavigation}
        </div>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const getSingleValue = (value) => {
  return Array.isArray(value) ? value[0] : value;
};

const getInitialNavigationDateIndex = (dateFrom, currentDate, data) => {
  if (dateFrom) return findIndexByDate(data, new UuDate(currentDate).startOfMonth().toIsoString());
  return Math.ceil(MONTHS_AMOUNT / 2) - 2;
};

const getInitialScrollTop = (dateFrom, navigationDateIndex, itemHeight, { clientHeight, scrollHeight }) => {
  if (dateFrom) {
    return getScrollTopValue(navigationDateIndex, itemHeight, clientHeight);
  }
  return scrollHeight / 2 - clientHeight / 2;
};

const getScrollTopValue = (navigationDateIndex, itemHeight, clientHeight) => {
  return (navigationDateIndex ?? 0) * (itemHeight + GAP) - clientHeight / 4;
};

const isCalendarInViewport = (calendar, viewport) => {
  const calendarSize = calendar.getBoundingClientRect();
  const viewportSize = viewport.getBoundingClientRect();
  return calendarSize.top >= viewportSize.top && calendarSize.bottom <= viewportSize.bottom;
};

const findIndexByDate = (data, date) => {
  const filteredDateIndex = data.findIndex((e) => e.date === date);
  return filteredDateIndex === -1 ? null : filteredDateIndex;
};

const initializeData = (propsDateFrom, propsDateTo, displayDate) => {
  let monthCounter = MONTHS_AMOUNT;
  let dateFrom = propsDateFrom && new UuDate(propsDateFrom).startOfMonth();
  let dateTo = propsDateTo && new UuDate(propsDateTo);

  // Calculate amount of rendered months
  if ((!dateFrom && dateTo) || (dateFrom && !dateTo)) {
    monthCounter /= 2;
  } else if (dateFrom && dateTo) {
    monthCounter = 0;
    // Count amount of months and allocate limited dataset
    monthCounter = (dateTo.getYear() - dateFrom.getYear()) * 12 + (dateTo.getMonth() - dateFrom.getMonth());
  }

  const date = getInitialDate(propsDateFrom, propsDateTo, displayDate, monthCounter);

  const dateYear = date.getYear();
  if (dateYear < MIN_YEAR) date.setYear(MIN_YEAR).startOfYear();
  if (dateYear > MAX_YEAR) date.setYear(MAX_YEAR);

  let month = date.getMonth();
  let year = date.getYear();

  const itemsLength = propsDateFrom && propsDateTo ? monthCounter + 1 : monthCounter;
  let newData = new Array(itemsLength);
  for (let i = 0; i < itemsLength; i++) {
    if (year > MAX_YEAR) {
      newData.splice(i, itemsLength - i);
      break;
    }
    newData[i] = {
      index: i,
      date: `${String(year).padStart(4, 0)}-${String(month).padStart(2, 0)}-01`,
    };
    // shift to the next month
    if (month === 12) {
      month = 1;
      year++;
    } else {
      month++;
    }
  }

  return newData;
};

function generateId() {
  let id = Utils.String.generateId();
  return `a${id}`; // Element ids cannot start with an integer
}

const CLASS_NAMES = {
  container: ({ isColumn }) =>
    Config.Css.css({ display: "flex", flexDirection: isColumn ? "column" : "row", justifyContent: "center" }),
  containerWithoutPresets: () => Config.Css.css({ display: "flex", flexDirection: "row", minWidth: "fit-content" }),
  scrollableBox: () => Config.Css.css({ width: "100%" }),
  gridContent: () => Config.Css.css({ display: "flex" }),
  calendarItem: (height) => {
    return Config.Css.css({
      height,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    });
  },
};
//@@viewOff:helpers

export { VerticalCalendar };
export default VerticalCalendar;
