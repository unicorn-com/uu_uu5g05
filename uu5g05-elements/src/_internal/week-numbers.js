//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import UuGds from "./gds";
import Config from "../config/config.js";
import Text from "../text.js";
import Button from "../button";
import Tools from "./tools.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

// Shift date by this value to get full week
const SHIFT_TO_FULL_WEEK = 6;
const DAYS_IN_WEEK = 7;
const ENOUGH_WEEKS = 6;

const WeekNumbers = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "WeekNumbers",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    date: PropTypes.object, // UuDate format
    isInteractive: PropTypes.bool,
    onWeekSelected: PropTypes.func,
    hideWeeksOfDifferentMonth: PropTypes.bool,
    weekStartDay: PropTypes.number.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    hideWeeksOfDifferentMonth: false,
    weekStartDay: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      date: propsValue,
      isInteractive,
      onWeekSelected,
      hideWeeksOfDifferentMonth,
      weekStartDay,
      dateFrom,
      dateTo,
      selectionType,
      step,
      ...otherProps
    } = props;

    const gap = UuGds.SpacingPalette.getValue(["fixed"]).b;

    const { h: width } = UuGds.getValue(["SizingPalette", "spot", "basic", "xs"]);
    const { h: height } = UuGds.getValue(["SizingPalette", "spot", "basic", "s"]);

    const getWeekNumbers = () => {
      const currentMonth = new UuDate({ day: 1, month: propsValue.getMonth(), year: propsValue.getYear() });
      const tempDate = new UuDate({ day: 1, month: propsValue.getMonth(), year: propsValue.getYear() });
      // Correct date with weekStartDay from user preferences
      while (weekStartDay !== tempDate.getWeekDay()) {
        tempDate.shiftDay(-1);
      }

      const weekNumbers = new Array(ENOUGH_WEEKS);
      const startOfMonthWeek = new UuDate(tempDate);
      let adjustedDateFrom;
      let adjustedDateFromForStep;
      let adjustedDateTo;
      for (let i = 0; i < ENOUGH_WEEKS; i++) {
        let isWeekInteractive = isInteractive;
        if (isWeekInteractive) {
          adjustedDateFrom ??=
            dateFrom && selectionType === "week"
              ? new UuDate(dateFrom).startOfWeek(weekStartDay)
              : dateFrom
                ? new UuDate(dateFrom)
                : undefined;
          adjustedDateTo ??=
            dateTo && selectionType === "week"
              ? new UuDate(dateTo).endOfWeek(weekStartDay)
              : dateTo
                ? new UuDate(dateTo)
                : undefined;
          let firstDayOfWeek = tempDate;
          let lastDayOfWeek = new UuDate(tempDate).shiftDay(6);
          isWeekInteractive = !(
            (adjustedDateFrom && UuDate.compare(firstDayOfWeek, adjustedDateFrom) < 0) ||
            (adjustedDateTo && UuDate.compare(lastDayOfWeek, adjustedDateTo) > 0)
          );
          if (isWeekInteractive && step && step !== 1) {
            if (selectionType === "week") {
              // "step" is per week
              adjustedDateFromForStep ??= adjustedDateFrom || new UuDate("1970-01-01").startOfWeek(weekStartDay);
              let weekStart = new UuDate(tempDate).startOfWeek(weekStartDay);
              isWeekInteractive =
                Math.round(Tools.getDaysDiff(adjustedDateFromForStep.toDate(), weekStart.toDate()) / 7) % step === 0;
            } else {
              // "step" is per day
              adjustedDateFromForStep ??= adjustedDateFrom || new UuDate("1970-01-01");
              isWeekInteractive =
                Tools.getDaysDiff(adjustedDateFromForStep.toDate(), firstDayOfWeek.toDate()) % step === 0 &&
                Tools.getDaysDiff(adjustedDateFromForStep.toDate(), lastDayOfWeek.toDate()) % step === 0;
            }
          }
        }

        const renderWeekNumber = (
          <Text
            key={"t-" + i}
            category="interface"
            segment="content"
            type="small"
            className={CLASS_NAMES.weekNumber(width, height)}
            colorScheme="building"
            significance="subdued"
          >
            {tempDate.getWeek(weekStartDay)}.
          </Text>
        );
        if (isWeekInteractive) {
          weekNumbers.push(
            <Button
              key={"b-" + i}
              className={CLASS_NAMES.button(width, height)}
              colorScheme="building"
              significance="subdued"
              borderRadius="moderate"
              tooltip={{ import: importLsi, path: ["Calendar", "selectWeek"] }}
              onClick={(e) => {
                if (typeof onWeekSelected === "function") {
                  const dateFrom = new UuDate(startOfMonthWeek).shiftDay(i * DAYS_IN_WEEK).toIsoString();
                  const dateTo = new UuDate(dateFrom).shiftDay(SHIFT_TO_FULL_WEEK).toIsoString();
                  onWeekSelected(
                    new Utils.Event(
                      {
                        value: [dateFrom, dateTo],
                      },
                      e,
                    ),
                  );
                }
              }}
            >
              {renderWeekNumber}
            </Button>,
          );
        } else {
          weekNumbers.push(renderWeekNumber);
        }
        tempDate.shiftDay(7);
        // Skip last empty row
        if (hideWeeksOfDifferentMonth && UuDate.compare(tempDate, new UuDate(currentMonth).endOfMonth()) > 0) break;
      }
      return weekNumbers;
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(otherProps, CLASS_NAMES.container(gap));
    return <div {...attrs}>{getWeekNumbers()}</div>;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const CLASS_NAMES = {
  container: (gap) =>
    Config.Css.css({
      display: "grid",
      gridGap: gap,
      flexDirection: "column",
      marginRight: gap,
      alignItems: "center",
    }),
  button: (width, height) =>
    Config.Css.css({
      display: "flex",
      justifyContent: "flex-start",
      padding: "0 !important",
      width: `${width}px !important`,
      minWidth: `${width}px !important`,
      height: `${height}px !important`,
    }),
  weekNumber: (width, height) =>
    Config.Css.css({
      width,
      height,
      display: "flex",
      alignItems: "center",
      userSelect: "none",
      justifyContent: "flex-end",
      paddingRight: UuGds.SpacingPalette.getValue(["fixed"]).c,
    }),
};
//@@viewOff:helpers

export { WeekNumbers };
export default WeekNumbers;
