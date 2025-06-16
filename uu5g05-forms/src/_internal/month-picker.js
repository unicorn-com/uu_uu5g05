//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import DateCss from "./date-css.js";
//@@viewOff:imports

//@@viewOn:constants
// Range of displayed months
const START_YEAR = 1900;
const END_YEAR = 2100;
const START_STEP_YEAR = 1970;
const START_STEP_MONTH = 1;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: DateCss.basicDatePicker,
};
//@@viewOff:css

//@@viewOn:helpers
const parseMonthToObject = (month) => {
  let parts = month.split("-").map((item) => Number(item));
  return {
    year: parts[0],
    month: parts[1],
  };
};
//@@viewOff:helpers

const MonthPicker = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MonthPicker",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onSelect: PropTypes.func,
    value: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    selectionMode: PropTypes.oneOf(["single", "multi", "range"]),
    min: PropTypes.string,
    max: PropTypes.string,
    step: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    selectionMode: "single",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { value, min, max, step, className, ...otherProps } = props;

    if (!value) {
      let today = new Date();
      value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    }

    const itemList = useMemo(() => {
      let minYear = START_YEAR;
      let maxYear = END_YEAR;
      let startMonth = 1;
      let endMonth = 12;
      let startStepYear = START_STEP_YEAR;
      let startStepMonth = START_STEP_MONTH;

      let min;
      let max;
      if (props.min) {
        min = parseMonthToObject(props.min);
        minYear = min.year;
        startMonth = min.month;
        startStepYear = minYear;
        startStepMonth = startMonth;
      }
      if (props.max) {
        max = parseMonthToObject(props.max);
        maxYear = max.year;
      }

      let itemCount = (maxYear - minYear + 1) * (12 + 1); // for each year 12 months + label
      // do not count months before min and after max
      if (min) itemCount -= min.month - 1;
      if (max) itemCount -= 12 - max.month;
      let itemList = new Array(itemCount);
      let monthOffset = min ? min.month - 1 : 0;
      let yearOffset = 0;

      for (let i = minYear; i < maxYear + 1; i++) {
        let yearStartIndex = (i - minYear) * 13 - yearOffset;
        itemList[yearStartIndex] = { children: <Uu5Elements.DateTime value={`${i}-01-01`} format="YYYY" /> };

        if (max && i === maxYear) endMonth = max.month;
        for (let monthIndex = startMonth; monthIndex <= endMonth; monthIndex++) {
          let isDisabled = step ? ((i - startStepYear) * 12 + monthIndex - startStepMonth) % step !== 0 : false;
          let monthISOString = String(monthIndex).padStart(2, "0");
          itemList[yearStartIndex + monthIndex - monthOffset] = {
            value: `${i}-${monthISOString}`,
            disabled: isDisabled,
            children: <Uu5Elements.DateTime value={`${i}-${monthISOString}-01`} format="MMMM" />,
          };
        }

        // after the first cycle we want to count the months from January
        if (i === minYear) yearOffset = monthOffset;
        startMonth = 1;
        monthOffset = 0;
      }

      return itemList;
    }, [props.max, props.min, step]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Elements._VirtualizedListPicker
        {...otherProps}
        itemList={itemList}
        value={value}
        className={Utils.Css.joinClassName(className, Css.main())}
      />
    );
    //@@viewOff:render
  },
});

export { MonthPicker };
export default MonthPicker;
