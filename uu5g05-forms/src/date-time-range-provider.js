//@@viewOn:imports
import { createComponent, PropTypes, useState } from "uu5g05";
import Config from "./config/config.js";
import DateTimeRangeContext from "./_internal/date-time-range-context.js";
import { getValidDateTime } from "./_internal/tools.js";
//@@viewOff:imports

//@@viewOn:constants
const DATE_FORMAT = "YYYY-MM-DD";
//@@viewOff:constants

//@@viewOn:helpers
function getRange(start, end) {
  if (!start) return;

  const startDate = getValidDateTime(start);

  if (!startDate) return;

  const range = {};
  startDate.startOf("day");
  range[getRangeKey(startDate)] = {
    colorScheme: undefined,
    significance: "highlighted",
  };

  if (end) {
    const endDate = getValidDateTime(end);

    if (!endDate) return range;

    endDate.startOf("day");
    startDate.shift("day", 1);

    while (startDate < endDate) {
      range[getRangeKey(startDate)] = {
        colorScheme: undefined,
      };
      startDate.shift("day", 1);
    }
  }

  return range;
}

function getRangeKey(dateTime) {
  return dateTime.format(undefined, { format: DATE_FORMAT }).replace(/^([^-]+)/, (match) => match.padStart(4, "0"));
}
//@@viewOff:helpers

const DateTimeRangeProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DateTimeRangeProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    min: PropTypes.string,
    max: PropTypes.string,
    timeOffset: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    min: undefined,
    max: undefined,
    timeOffset: null,
  },
  //@@viewOff:defaultProps

  render({ children, min, max, timeOffset }) {
    //@@viewOn:private
    const [startDateTime, setStartDateTime] = useState();
    const [endDateTime, setEndDateTime] = useState();
    const [startPicker, setStartPicker] = useState(false);
    const [endPicker, setEndPicker] = useState(false);

    const contextValue = {
      min,
      max,
      timeOffset,
      start: {
        dateTime: startDateTime,
        onDateTimeChange: (e) => setStartDateTime(e.data.dateTime),
        displayPicker: startPicker,
        onDisplayPickerChange: (e) => setStartPicker(e.data.dateDisplayPicker),
      },
      end: {
        dateTime: endDateTime,
        onDateTimeChange: (e) => setEndDateTime(e.data.dateTime),
        displayPicker: endPicker,
        onDisplayPickerChange: (e) => setEndPicker(e.data.dateDisplayPicker),
        range: endPicker ? getRange(startDateTime, endDateTime) : undefined,
      },
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <DateTimeRangeContext.Provider value={contextValue}>
        {typeof children === "function" ? children(contextValue) : children}
      </DateTimeRangeContext.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { DateTimeRangeProvider };
export default DateTimeRangeProvider;
//@@viewOff:exports
