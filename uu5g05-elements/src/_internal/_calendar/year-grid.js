//@@viewOn:imports
import { createVisualComponent, PropTypes, useLanguage } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import Config from "../../config/config.js";
import UuGds from "../gds";
import DateItem from "./date-item.js";
//@@viewOff:imports

const DECADE = 10;
const MONTHS_IN_YEAR = 12;
const MAX_YEAR = 9999;

const YearGrid = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "YearGrid",
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
    const dateFrom = props.dateFrom ? new UuDate(props.dateFrom).startOfYear() : null; // Max calendar limitation
    const dateTo = props.dateTo ? new UuDate(props.dateTo).startOfYear() : null; // Min calendar limitation
    const displayDate = new UuDate(props.displayDate)
      .setYear(Math.floor(new UuDate(props.displayDate).getYear() / DECADE) * DECADE)
      .startOfYear();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const yearGrid = [];
    for (let i = 0; i < MONTHS_IN_YEAR; i++) {
      if (displayDate.getYear() > MAX_YEAR) break;
      let outOfLimit = !!(
        (dateFrom && UuDate.compare(displayDate, dateFrom) < 0) ||
        (dateTo && UuDate.compare(displayDate, dateTo) > 0)
      );
      if (currentDate && currentDate.isSameYear(displayDate)) {
        // Display current year
        yearGrid.push(
          <DateItem
            key={i}
            className={CLASS_NAMES.yearItem()}
            type={"current"}
            date={displayDate.toIsoString()}
            onClick={props.onSelect}
            width={tileSize}
            disabled={outOfLimit}
            colorScheme={props.colorScheme}
          >
            {displayDate.format(language, { format: "YYYY" })}
          </DateItem>,
        );
      } else {
        // Display the rest - default
        yearGrid.push(
          <DateItem
            key={i}
            className={CLASS_NAMES.yearItem()}
            date={displayDate.toIsoString()}
            onClick={props.onSelect}
            width={tileSize}
            disabled={outOfLimit}
            colorScheme={props.colorScheme}
          >
            {displayDate.format(language, { format: "YYYY" })}
          </DateItem>,
        );
      }

      displayDate.shiftYear(1);
    }
    return yearGrid;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const CLASS_NAMES = {
  yearItem: () =>
    Config.Css.css({
      textTransform: "capitalize",
      aspectRatio: "1/1",
      height: `auto !important`,
    }),
};
//@@viewOff:helpers

export { YearGrid };
export default YearGrid;
