//@@viewOn:imports
import { createVisualComponent, PropTypes, useLanguage } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import Config from "../../config/config.js";
import UuGds from "../gds";
import DateItem from "./date-item.js";
//@@viewOff:imports

const MonthGrid = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MonthGrid",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onSelect: PropTypes.func.isRequired,
    currentDate: PropTypes.string,
    displayDate: PropTypes.object.isRequired,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    colorScheme: DateItem.propTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const [language] = useLanguage();
    const { h: tileSize } = UuGds.getValue(["SizingPalette", "spot", "major", "m"]);

    const currentDate = props.currentDate ? new UuDate(props.currentDate) : null;
    const dateFrom = props.dateFrom ? new UuDate(props.dateFrom).startOfMonth() : null; // Max calendar limitation
    const dateTo = props.dateTo ? new UuDate(props.dateTo).startOfMonth().shiftDay(1) : null; // Min calendar limitation
    const displayDate = new UuDate(props.displayDate).startOfYear();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const monthGrid = [];
    for (let i = 0; i < 12; i++) {
      let monthTitle = displayDate.format(language, { format: "MMM" });
      let outOfLimit = !!(
        (dateFrom && UuDate.compare(displayDate, dateFrom) < 0) ||
        (dateTo && UuDate.compare(displayDate, dateTo) > 0)
      );
      if (currentDate && currentDate.isSameMonthYear(displayDate)) {
        // Display current month
        monthGrid.push(
          <DateItem
            key={i}
            className={CLASS_NAMES.monthItem()}
            type={"current"}
            date={displayDate.toIsoString()}
            onClick={props.onSelect}
            width={tileSize}
            disabled={outOfLimit}
            colorScheme={props.colorScheme}
          >
            {monthTitle}
          </DateItem>,
        );
      } else {
        // Display the rest - default
        monthGrid.push(
          <DateItem
            key={i}
            className={CLASS_NAMES.monthItem()}
            width={tileSize}
            onClick={props.onSelect}
            date={displayDate.toIsoString()}
            disabled={outOfLimit}
            colorScheme={props.colorScheme}
          >
            {monthTitle}
          </DateItem>,
        );
      }

      displayDate.shiftMonth(1);
    }
    return monthGrid;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const CLASS_NAMES = {
  monthItem: () =>
    Config.Css.css({
      textTransform: "capitalize",
      aspectRatio: "1/1",
      height: `auto !important`,
    }),
};
//@@viewOff:helpers

export { MonthGrid };
export default MonthGrid;
