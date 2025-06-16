//@@viewOn:imports
import { createComponent, PropTypes, Utils, useEffect, useRef, useState } from "uu5g05";
import { UuDateTime } from "uu_i18ng01";
import Config from "../config/config.js";
import { useDateTimeRangeContext } from "./date-time-range-context.js";
//@@viewOff:imports

//@@viewOn:constants
const RANGE_POSITION = {
  start: "start",
  end: "end",
};
//@@viewOff:constants

//@@viewOn:helpers
function getMin({ min, rangePosition, startDateTime }) {
  if (rangePosition === RANGE_POSITION.start) return min;

  if (!startDateTime) return min;

  if (!min || min < startDateTime) return startDateTime;

  return min;
}

function useDateTimeUpdateEffect({ value, onChange, dateTime, onDateTimeChange, lastChangedValue }) {
  const dateTimeRef = useRef();
  dateTimeRef.current = dateTime;

  const onChangeRef = useRef();
  onChangeRef.current = onChange;

  const onDateTimeChangeRef = useRef();
  onDateTimeChangeRef.current = onDateTimeChange;

  const lastChangedValueRef = useRef();
  lastChangedValueRef.current = lastChangedValue;

  const changedRef = useRef(false);
  changedRef.current = false;

  useEffect(() => {
    if (!changedRef.current && value !== dateTimeRef.current) {
      changedRef.current = true;
      if (typeof onDateTimeChangeRef.current === "function") {
        onDateTimeChangeRef.current(new Utils.Event({ dateTime: value }));
      }
    }
  }, [value]);

  useEffect(() => {
    if (!changedRef.current && lastChangedValueRef.current !== dateTime) {
      changedRef.current = true;
      if (typeof onChangeRef.current === "function") {
        onChangeRef.current(new Utils.Event({ value: dateTime }));
      }
    }
  }, [dateTime]);
}
//@@viewOff:helpers

function withDateTimeRange(Input) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withDateTimeRange(${Input.uu5Tag || Input.displayName})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Input.propTypes,
      rangePosition: PropTypes.oneOf([RANGE_POSITION.start, RANGE_POSITION.end]),
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Input.defaultProps,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { onChange, min, max, rangePosition, elementRef, onBlur, ...otherProps } = props;
      const { value } = otherProps;

      const [timeDisplayPicker, setTimeDisplayPicker] = useState(false);

      const inputRef = useRef();

      const dateTimeRangeCtx = useDateTimeRangeContext();
      const { dateTime, onDateTimeChange, displayPicker, onDisplayPickerChange, range } =
        dateTimeRangeCtx[rangePosition] || {};

      const lastChangedValue = useRef(value);

      useDateTimeUpdateEffect({
        value,
        onChange,
        dateTime,
        onDateTimeChange,
        lastChangedValue: lastChangedValue.current,
      });

      function handleChange(e) {
        if (typeof onDateTimeChange === "function") onDateTimeChange(new Utils.Event({ dateTime: e.data.value }));

        if (typeof onChange === "function") onChange(e);

        lastChangedValue.current = e.data.value;
      }

      function handleTimeDisplayPicker(e) {
        if (rangePosition === RANGE_POSITION.start && !e.data.timeDisplayPicker) {
          const endRange = dateTimeRangeCtx.end;
          if (!endRange.dateTime) {
            endRange.onDisplayPickerChange(new Utils.Event({ dateDisplayPicker: true }));
          }
        }

        setTimeDisplayPicker(e.data.timeDisplayPicker);
      }

      function handleBlur(e) {
        if (dateTimeRangeCtx.timeOffset) {
          if (rangePosition === RANGE_POSITION.start && dateTimeRangeCtx.end.dateTime === undefined && value) {
            const newEndDateTime = new UuDateTime(value);
            newEndDateTime.shiftTime(dateTimeRangeCtx.timeOffset * 1000);
            dateTimeRangeCtx.end.onDateTimeChange(new Utils.Event({ dateTime: newEndDateTime.toIsoString() }));
          }
        }

        if (typeof onBlur === "function") onBlur(e);
      }
      //@@viewOff:private

      //@@viewOn:render
      return (
        <Input
          {...otherProps}
          dateDisplayPicker={displayPicker}
          onDateDisplayPickerChange={onDisplayPickerChange}
          timeDisplayPicker={timeDisplayPicker}
          onTimeDisplayPickerChange={handleTimeDisplayPicker}
          elementRef={Utils.Component.combineRefs(elementRef, inputRef)}
          min={getMin({
            min: min || dateTimeRangeCtx.min,
            rangePosition,
            startDateTime: dateTimeRangeCtx.start?.dateTime,
          })}
          max={max || dateTimeRangeCtx.max}
          dateMap={range}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      );
      //@@viewOff:render
    },
  });
}

//@@viewOn:exports
export { withDateTimeRange };
export default withDateTimeRange;
//@@viewOff:exports
