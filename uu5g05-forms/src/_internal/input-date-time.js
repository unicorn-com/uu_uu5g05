//@@viewOn:imports
import {
  createComponent,
  PropTypes,
  useEffect,
  useState,
  useRef,
  useValueChange,
  Utils,
  usePreviousValue,
  useUpdateEffect,
  _useActive,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UuDate, UuDateTime } from "uu_i18ng01";
import Config from "../config/config.js";
import { InputDateTimeBase, DATE_TIME_PROPTYPES } from "./input-date-time-base.js";
//@@viewOff:imports

//@@viewOn:constants
const DAY_IN_SEC = 86400;
const HOUR_IN_SEC = 3600;
const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";

const TIME_SPECIFIC_PROPS = {
  timeIconLeft: "iconLeft",
  timePlaceholder: "placeholder",
  preselectedTimePickerValue: "preselectedPickerValue",
  summerTimeSuffix: "summerTimeSuffix",
  winterTimeSuffix: "winterTimeSuffix",
  summerTimeTemplate: "summerTimeTemplate",
  winterTimeTemplate: "winterTimeTemplate",
};

const DATE_SPECIFIC_PROPS = new Set([
  "iconLeft",
  "onIconLeftClick",
  "iconRight",
  "onIconRightClick",
  "iconRightList",
  "prefix",
  "suffix",
  "onFeedbackClick",
  "pending",
  "inputRef",
  "inputAttrs",
  "placeholder",
  "autoFocus",
  "dateMap",
  "presetList",
  "displayNavigation",
]);
//@@viewOff:constants

//@@viewOn:helpers
function splitDateTimeProps(props) {
  const restProps = {},
    dateProps = {},
    timeProps = {};

  for (let [key, item] of Object.entries(props)) {
    // Time prop
    if (TIME_SPECIFIC_PROPS[key]) {
      timeProps[TIME_SPECIFIC_PROPS[key]] = item;
      continue;
    }
    // Date prop
    if (DATE_SPECIFIC_PROPS.has(key)) {
      dateProps[key] = item;
      continue;
    }
    // Universal prop
    restProps[key] = item;
  }

  return { restProps, dateProps, timeProps };
}

function isSameDate(dateA, dateB) {
  if (!dateA || !dateB) return false;
  return (
    dateA.getYear() === dateB.getYear() && dateA.getMonth() === dateB.getMonth() && dateA.getDay() === dateB.getDay()
  );
}

function getStepModulo(value, timeZone, min, step, adjust = false) {
  let newValue = new UuDateTime(value, timeZone);
  // TODO This seems wrong - we shouldn't do any adjusting.
  if (adjust) newValue.setSecond(step % 60 ? newValue.getSecond() : 0, 0);
  // if min is not given, use current day's start instead of 1970-01-01 to prevent issues with years
  // such as 0001-01-01 which have different leap seconds as 1970-01-01 (so that we don't get validation error
  // regarding step mismatch even if we're at 00:00:00.000)
  let usedMin = min ? new UuDateTime(min, timeZone) : newValue.clone().setHour(0, 0, 0, 0);
  let millisDiff = newValue.getTime() - usedMin.getTime();

  let diff = Math.round(millisDiff / 1000);
  return diff % (step || 60);
}

function isMaxDtMidnight(maxDt) {
  if (!maxDt) return false;

  const maxDtMidnight = maxDt ? new UuDateTime(maxDt).startOf("day") : undefined;
  return UuDateTime.compare(maxDtMidnight, maxDt) === 0;
}

function getPreselectedValue(dt, preselectedValue, comparator = (a, b) => a > b) {
  const hour = dt.getHour();
  const min = dt.getMinute();
  const sec = dt.getSecond();

  let [h, m, s = "00"] = preselectedValue.split(":");

  h = comparator(h, hour) ? hour.toString() : h;
  m = comparator(m, min) ? min.toString() : m;
  s = comparator(s, sec) ? sec.toString() : s;

  return h.padStart(2, "0") + ":" + m.padStart(2, "0") + ":" + s.padStart(2, "0");
}

function getTimePreselectedPickerValue(minDt, maxDt, date, preselectedValue = "10:00:00") {
  if (!date) return preselectedValue;
  if (!(minDt || maxDt)) return preselectedValue;

  if (minDt) {
    // Check min date
    const minDate = new UuDate([minDt.getYear(), minDt.getMonth(), minDt.getDay()]);

    if (maxDt) {
      // There can be also minDt with maxDt
      const maxDate = new UuDate([maxDt.getYear(), maxDt.getMonth(), maxDt.getDay()]);

      if (UuDate.compare(date, maxDate) === 0) {
        // Current date is same as maxDate => compare with maxDate
        return getPreselectedValue(maxDt, preselectedValue);
      }
    }

    if (UuDate.compare(date, minDate) >= 0) return preselectedValue;

    return getPreselectedValue(minDt, preselectedValue, (a, b) => a < b);
  }

  if (maxDt) {
    // Check only max date
    return getPreselectedValue(maxDt, preselectedValue);
  }

  return preselectedValue;
}

function getMinMaxPossibleDt(dt, step, comparator = (a, b) => a > b) {
  if (step !== 60 && step > 1 && step < HOUR_IN_SEC) {
    const count = HOUR_IN_SEC / step;

    let stepDt = dt.clone().setHour(0, 0, 0);

    for (let i = 0; i < count; i++) {
      let tempDt = stepDt.clone().setSecond(step);

      if (comparator(tempDt, dt)) break;
      stepDt = tempDt;
    }

    return stepDt.toIsoString();
  }

  return dt.toIsoString();
}
//@@viewOff:helpers

const InputDateTime = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputDateTime",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...DATE_TIME_PROPTYPES.timePropTypes,
    ...DATE_TIME_PROPTYPES.datePropTypes,
    timeIconLeft: Uu5Elements.Icon.propTypes.icon,
    preselectedTimePickerValue: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    timeIconLeft: undefined,
    step: 60, // in seconds
    preselectedTimePickerValue: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      value,
      onChange,
      min,
      max,
      step,
      feedback,
      onValidationEnd,
      dateDisplayPicker,
      onDateDisplayPickerChange: onDateDisplayPickerChangeProp,
      timeDisplayPicker,
      onTimeDisplayPickerChange: onTimeDisplayPickerChangeProp,
      weekStartDay,
      timeZone,
      dateFormat,
      timeFormat,
      onFocus,
      onBlur,
      ...otherProps
    } = props;
    const { readOnly: readOnlyProp, pending } = otherProps;

    const dateRef = useRef();
    const timeRef = useRef();
    const shouldOpenTimePicker = useRef(false);

    const { elementAttrs, active } = _useActive({ skipSelection: true });

    useUpdateEffect(() => {
      if (active && typeof onFocus === "function") onFocus(new Utils.Event());
      else if (!active && typeof onBlur === "function") onBlur(new Utils.Event());
    }, [active]);

    const onDateDisplayPickerChange =
      typeof onDateDisplayPickerChangeProp === "function"
        ? (value) => onDateDisplayPickerChangeProp(new Utils.Event({ dateDisplayPicker: value }))
        : null;

    const onTimeDisplayPickerChange =
      typeof onTimeDisplayPickerChangeProp === "function"
        ? (value) => onTimeDisplayPickerChangeProp(new Utils.Event({ timeDisplayPicker: value }))
        : null;

    const [datePicker, setDatePicker] = useValueChange(dateDisplayPicker, onDateDisplayPickerChange);
    const [timePicker, setTimePicker] = useValueChange(timeDisplayPicker, onTimeDisplayPickerChange);

    useEffect(() => {
      if (dateDisplayPicker) dateRef.current?.focus();
    }, [dateDisplayPicker]);

    const dateTime = value ? new UuDateTime(value, timeZone) : null;
    const dateValue = dateTime
      ? new UuDate([dateTime.getYear(), dateTime.getMonth(), dateTime.getDay()]).toIsoString()
      : value;
    let [date, setDate] = useState(dateValue);
    if (value !== null && date !== dateValue) {
      date = dateValue;
      setDate(date);
    }
    const previousDate = usePreviousValue(date);

    let [time, setTime] = useState(value);
    if (
      value !== null &&
      ((time && value && new UuDateTime(time).toIsoString() !== new UuDateTime(value).toIsoString()) ||
        ((!time || !value) && time !== value))
    ) {
      time = value;
      setTime(time);
    }

    const minDt = min ? new UuDateTime(min, timeZone) : null;
    const maxDt = max ? new UuDateTime(max, timeZone) : null;

    const timeReadOnly = readOnlyProp || !(step % DAY_IN_SEC);

    const maxDtMidnight = isMaxDtMidnight(maxDt);

    function handleDateChange(e) {
      // Replace year zero
      const newValue = e.data.value ? e.data.value.replace("0000", "0001") : e.data.value;

      let propagatedValue;
      if (newValue === null) {
        propagatedValue = newValue;
      } else if (newValue === undefined) {
        propagatedValue = newValue; // propagate undefined (this will clear time too)
      } else if (time !== null) {
        if (dateTime) {
          propagatedValue = dateTime
            .clone()
            .setYear(...newValue.split("-").map((it) => Number(it)))
            .toIsoString();
        } else if (!time) {
          //todo: Following code allows to prefill time when date is filled, for now we dont want this feature
          // use newValue and adjust the time to the next hour (if it's today and having small step)
          // or to the nearest next valid step after 10:00:00
          // let now = new UuDateTime(undefined, timeZone);
          // let newValueDateTime = new UuDateTime(newValue, timeZone);
          // let newDateTime;
          // if (isSameDate(now, newValueDateTime)) {
          //   newDateTime = now.clone();
          //   if (step <= 60) {
          //     newDateTime.setHour(newDateTime.getHour() + 1, 0, 0, 0);
          //     if (!isSameDate(newValueDateTime, newDateTime)) {
          //       newDateTime = now.clone().setMinute(0, 0, 0);
          //     }
          //   }
          // } else {
          //   newDateTime = newValueDateTime.clone().setHour(10, 0, 0, 0);
          // }
          // let stepModulo = getStepModulo(newDateTime, timeZone, min, step);
          // if (stepModulo > 0) newDateTime.setTime(newDateTime.getTime() + 1000 * (step - stepModulo));
          // if (!isSameDate(newValueDateTime, newDateTime)) {
          //   newDateTime.setTime(newDateTime.getTime() - 1000 * step);
          // }
          // propagatedValue = newDateTime.toIsoString();
          propagatedValue = null;
        } else {
          propagatedValue = new UuDateTime(time).setYear(...newValue.split("-").map((it) => Number(it))).toIsoString();
        }
      } else {
        propagatedValue = null;
      }

      if (newValue && step === DAY_IN_SEC) propagatedValue = new UuDateTime(newValue).startOf("day").toIsoString();

      setDate(newValue);
      let skipTime = false;
      if (propagatedValue !== value) {
        if (propagatedValue === e.data.value) {
          onChange(e);
        } else {
          const newDateValue = processNewDateValue(e.data.value, newValue);

          if (newDateValue) skipTime = true;

          onChange(new Utils.Event({ value: newDateValue || propagatedValue }, e));
        }
      }

      if (!skipTime) {
        if (newValue === undefined) {
          // datetime was cleared -> open datePicker again
          setDatePicker(true);
        } else {
          // Set if time picker should open.
          // Time picker should be open when this ref is set true and when onDisplayPickerChange for date is set to false.
          shouldOpenTimePicker.current = !dateTime && !timeReadOnly && !!newValue;

          if (newValue) {
            const newYearNumber = Number(newValue.split("-")[0]);
            const dateYear = date && Number(date.split("-")[0]);

            if (
              e.key !== "ArrowUp" &&
              e.key !== "ArrowDown" &&
              dateYear &&
              newYearNumber !== dateYear &&
              newYearNumber >= 1000
            ) {
              timeRef.current?.focus();
            }
          }
        }
      }
    }

    function processNewDateValue(originValue, newValue) {
      // Check if current value is midnight and midnight is also max date
      if (maxDtMidnight) {
        const maxDate = maxDt.format(timeZone, { format: DEFAULT_DATE_FORMAT });
        if (maxDate === originValue) return maxDt.toIsoString();
      }

      // Check if current value is maxDt or minDt and return proper max/min
      if (newValue && time && (maxDt || minDt)) {
        const newDateTime = new UuDateTime(time);
        newDateTime.setYear(...newValue.split("-").map((it) => Number(it)));

        if (newDateTime > maxDt) return getMinMaxPossibleDt(maxDt, step);
        if (newDateTime < minDt) return getMinMaxPossibleDt(minDt, step, (a, b) => a < b);
      }
    }

    function handleTimeChange(e) {
      let newValue = e.data.value;
      // NOTE setTime() must be called whenever we fire onChange({ value: null }).
      let propagatedValue;
      if (newValue === null) {
        propagatedValue = newValue;
      } else if (newValue === undefined) {
        propagatedValue = date === undefined ? undefined : null;
      } else {
        if (date) {
          propagatedValue = newValue;
        } else {
          if (previousDate && date !== null) {
            propagatedValue = undefined;
          } else {
            propagatedValue = null;
          }
        }
      }

      setTime(newValue);
      if (propagatedValue !== value) {
        if (propagatedValue === e.data.value) onChange(e);
        else onChange(new Utils.Event({ value: propagatedValue }, e));
      }
    }

    function handleDateDisplayPickerChange(e) {
      const { displayPicker } = e.data;

      setDatePicker(displayPicker);

      if (!displayPicker) {
        if (props.value) return;
        // if timePicker should open then open it
        if (shouldOpenTimePicker.current) openAndFocusTimePicker();
      }

      // reset shouldOpenTimePicker
      shouldOpenTimePicker.current = false;
    }

    function handleTimeDisplayPickerChange(e) {
      if (e.data.displayPicker && dateTime) {
        if (dateTime > maxDt) {
          handleTimeChange(new Utils.Event({ value: maxDt.toIsoString() }));
        } else if (dateTime < minDt) {
          handleTimeChange(new Utils.Event({ value: minDt.toIsoString() }));
        }
      }
      setTimePicker(e.data.displayPicker);
    }

    function openAndFocusTimePicker() {
      setTimePicker(true);
      timeRef.current?.focus();
    }
    //@@viewOff:private

    //@@viewOn:render
    const { dateProps, timeProps, restProps } = splitDateTimeProps(otherProps);

    return (
      <InputDateTimeBase
        {...restProps}
        elementAttrs={elementAttrs}
        dateProps={{
          ...dateProps,
          min: minDt
            ? new UuDate([minDt.getYear(), minDt.getMonth(), minDt.getDay()], timeZone).toIsoString()
            : undefined,
          max: maxDt
            ? new UuDate([maxDt.getYear(), maxDt.getMonth(), maxDt.getDay()], timeZone).toIsoString()
            : undefined,
          value: date,
          onChange: handleDateChange,
          displayPicker: datePicker,
          onDisplayPickerChange: handleDateDisplayPickerChange,
          elementRef: dateRef,
          feedback: feedback,
          pending,
          weekStartDay,
          timeZone,
          format: dateFormat,
        }}
        timeProps={{
          ...timeProps,
          min:
            min &&
            (value || date) &&
            (isSameDate(minDt, maxDt) || isSameDate(dateTime || new UuDate(date, timeZone), minDt))
              ? minDt.toIsoString()
              : undefined,
          max:
            max &&
            (value || date) &&
            (isSameDate(minDt, maxDt) || isSameDate(dateTime || new UuDate(date, timeZone), maxDt))
              ? maxDt.toIsoString()
              : undefined,
          value: time,
          date: date || new UuDate().toIsoString(),
          onChange: handleTimeChange,
          displayPicker: timePicker,
          onDisplayPickerChange: handleTimeDisplayPickerChange,
          elementRef: timeRef,
          readOnly: timeReadOnly,
          step: step > 1 && step <= HOUR_IN_SEC ? step : undefined,
          displaySeconds: step === 1,
          feedback: feedback,
          format: timeFormat,
          timeZone,
          disabled: (dateTime && maxDtMidnight && dateTime >= maxDt) || step === DAY_IN_SEC,
          preselectedPickerValue: getTimePreselectedPickerValue(
            minDt,
            maxDt,
            date ? new UuDate(date) : undefined,
            timeProps.preselectedPickerValue,
          ),
          ...(pending && {
            elementAttrs: {
              tabIndex: -1,
            },
            className: Config.Css.css({ pointerEvents: "none" }),
          }),
        }}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { InputDateTime, getStepModulo };
export default InputDateTime;
//@@viewOff:exports
