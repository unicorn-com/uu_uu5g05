//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useMemo } from "uu5g05";
import { DateTime, Text, _VirtualizedListPicker } from "uu5g05-elements";
import Config from "../config/config.js";
import { parseQuarterToObject } from "./tools.js";
import DateCss from "./date-css.js";
//@@viewOff:imports

//@@viewOn:constants
// Range of displayed quarters
const START_YEAR = 1900;
const END_YEAR = 2100;
const START_STEP_YEAR = 1970;
const START_STEP_QUARTER = 1;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: DateCss.basicDatePicker,
  quarterListSpacing: () =>
    Config.Css.css({
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
    }),
};
//@@viewOff:css

const QuarterPicker = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "QuarterPicker",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onSelect: PropTypes.func,
    value: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    min: PropTypes.string,
    max: PropTypes.string,
    step: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { value, min, max, step, className, ...otherProps } = props;

    if (!value) {
      let today = new Date();
      let quarter = Math.floor(today.getMonth() / 3) + 1;
      value = `${today.getFullYear()}-Q${quarter}`;
    }

    let itemList = useMemo(() => {
      let minYear = START_YEAR;
      let maxYear = END_YEAR;
      let startQuarter = 1;
      let endQuarter = 4;
      let startStepYear = START_STEP_YEAR;
      let startStepQuarter = START_STEP_QUARTER;

      let min;
      let max;
      if (props.min) {
        min = parseQuarterToObject(props.min);
        minYear = min.year;
        startQuarter = min.quarter;
        startStepYear = minYear;
        startStepQuarter = startQuarter;
      }
      if (props.max) {
        max = parseQuarterToObject(props.max);
        maxYear = max.year;
      }

      let itemCount = (maxYear - minYear + 1) * (4 + 1); // for each year 4 quarters + label
      // do not count quarters before min and after max
      if (min) itemCount -= min.quarter - 1;
      if (max) itemCount -= 4 - max.quarter;
      let itemList = new Array(itemCount);
      let quarterOffset = min ? min.quarter - 1 : 0;
      let yearOffset = 0;

      for (let i = minYear; i < maxYear + 1; i++) {
        let yearStartIndex = (i - minYear) * 5 - yearOffset;
        itemList[yearStartIndex] = { children: i };

        if (max && i === maxYear) endQuarter = max.quarter;

        for (let quarterIndex = startQuarter; quarterIndex <= endQuarter; quarterIndex++) {
          let isDisabled = step ? ((i - startStepYear) * 4 + quarterIndex - startStepQuarter) % step !== 0 : false;
          itemList[yearStartIndex + quarterIndex - quarterOffset] = {
            value: `${i}-Q${quarterIndex}`,
            disabled: isDisabled,
            children: (
              <div className={Css.quarterListSpacing()}>
                <span>Q{quarterIndex}</span>
                <Text colorScheme="building" significance="subdued">
                  <DateTime
                    format="MMM"
                    value={`2000-${String((quarterIndex - 1) * 3 + 1).padStart(2, 0)}-01`}
                    colorScheme="building"
                    significance="subdued"
                  />
                  {", "}
                  <DateTime
                    format="MMM"
                    value={`2000-${String((quarterIndex - 1) * 3 + 2).padStart(2, 0)}-01`}
                    colorScheme="building"
                    significance="subdued"
                  />
                  {", "}
                  <DateTime
                    format="MMM"
                    value={`2000-${String((quarterIndex - 1) * 3 + 3).padStart(2, 0)}-01`}
                    colorScheme="building"
                    significance="subdued"
                  />
                </Text>
              </div>
            ),
          };
        }

        // after the first cycle we want to count from 1st quarter
        if (i === minYear) yearOffset = quarterOffset;
        startQuarter = 1;
        quarterOffset = 0;
      }

      return itemList;
    }, [props.max, props.min, step]);

    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <_VirtualizedListPicker
        {...otherProps}
        itemList={itemList}
        value={value}
        className={Utils.Css.joinClassName(className, Css.main())}
      />
    );
    //@@viewOff:render
  },
});

export { QuarterPicker };
export default QuarterPicker;
