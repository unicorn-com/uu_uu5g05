//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import DateCss from "./date-css.js";
//@@viewOff:imports

//@@viewOn:constants
// Range of displayed years
const START_YEAR = 0;
const END_YEAR = 2100;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: DateCss.basicDatePicker,
};
//@@viewOff:css

const YearPicker = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "YearPicker",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    colorScheme: Uu5Elements._VirtualizedListPicker.propTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { value, min, max, step, className, ...otherProps } = props;

    const startYear = min ?? START_YEAR;
    const endYear = max ?? END_YEAR;

    value = value ?? new Date().getFullYear();

    const itemList = useMemo(() => {
      const result = new Array(endYear - startYear + 1);
      for (let i = startYear; i <= endYear; i++) {
        let yearStartIndex = i - startYear;
        if (!step) {
          result[yearStartIndex] = { value: i };
        } else {
          if (yearStartIndex % step !== 0) {
            result[yearStartIndex] = { value: i, disabled: true };
          } else {
            result[yearStartIndex] = { value: i };
          }
        }
      }
      return result;
    }, [startYear, endYear, step]);
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

export { YearPicker };
export default YearPicker;
