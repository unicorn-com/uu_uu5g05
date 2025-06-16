//@@viewOn:imports
import {
  createVisualComponent,
  Lsi,
  PropTypes,
  useMemo,
  useRef,
  useUserPreferences,
  Utils,
  useDevice,
  BackgroundProvider,
  useBackground,
  useElementSize,
} from "uu5g05";
import Uu5Elements, { Line, Text, UuGds, _VirtualizedListPicker, MenuItem } from "uu5g05-elements";
import { UuDateTime } from "uu_i18ng01";
import SwitchSelectInput from "../inputs/switch-select-input";
import Config from "../config/config";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

//@@viewOn:constants
// Amount of "Hours" items for VirtualizedListPicker
const HOUR_LIMIT = 1032;
// Amount of 'Minutes' items for VirtualizedListPicker
const MINUTE_SECOND_LIMIT = 1020;
// Amount of 'Fixed time' items for VirtualizedListPicker
const FIXED_TIME_LIMIT = 1500;
// Maximum displayed value of seconds in its specific column picker
const SECOND_LIMIT = 59;
// Amount of hours in 12 hour format
const US_HOURS = 12;
// Colon character
const COLON = ":";
// Minimum date length limit
const MIN_LIMIT_DATE_LENGTH = 3;
// Hour in ms
const ONE_HOUR_MS = 60 * 60 * 1000;
// Max min
const MIN_LIMIT = 59;
// Default item size
const ITEM_SIZE = "m";
// Default summer/winter settings
const TimeTransition = {
  summer: {
    icon: "sun",
    colorScheme: "orange",
    lsiKey: "summerTime",
  },
  winter: {
    icon: "snowflake",
    colorScheme: "blue",
    lsiKey: "winterTime",
  },
};
const CONTAINER_SIZE_MAP_MOBILE = {
  xxs: "xs",
  xs: "s",
  s: "m",
  m: "l",
  l: "l",
  xl: "xl",
};
//@@viewOff:constants

//@@viewOn:css
const CLASS_NAMES = {
  virtualizedList: () => Config.Css.css({ width: "100%" }),
  centeredSelectionBox: ({ selectedBoxHeight, colorScheme, background }) => {
    const paddingVertical = UuGds.SpacingPalette.getValue(["fixed", "c"]);
    return Config.Css.css({
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      backgroundColor: UuGds.Shape.getValue([
        "ground",
        background,
        colorScheme,
        "highlighted",
        "default",
        "colors",
        "background",
      ]),
      width: `calc(100% - ${2 * paddingVertical}px)`,
      margin: "0 auto",
      height: selectedBoxHeight,
      borderRadius: "5px",
    });
  },
  fixedDatePicker: ({ minWidth }) => Config.Css.css({ position: "relative", minWidth }),
  timeColumnsBox: () =>
    Config.Css.css({
      display: "flex",
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    }),
  leftColon: () =>
    Config.Css.css({
      position: "absolute",
      top: "50%",
      left: "33.33%",
      transform: "translate(-50%,-50%)",
    }),
  rightColon: () =>
    Config.Css.css({
      position: "absolute",
      top: "50%",
      left: "66.66%",
      transform: "translate(-50%,-50%)",
    }),
  centerColon: () =>
    Config.Css.css({
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
    }),
  menuItem: () =>
    Config.Css.css({
      width: "100%",
      userSelect: "none",
      textAlign: "center",
    }),
  stretchedScrollableBox: () => Config.Css.css({ width: "100%" }),
  title: () =>
    Config.Css.css({
      display: "flex",
      flex: 1,
      justifyContent: "center",
      paddingLeft: "4px",
      paddingRight: "4px",
    }),
  titleBox: () => {
    const paddingHorizontal = UuGds.SpacingPalette.getValue(["fixed", "b"]);
    const paddingVertical = UuGds.SpacingPalette.getValue(["fixed", "c"]);
    return Config.Css.css({
      display: "flex",
      justifyContent: "space-evenly",
      paddingTop: paddingHorizontal,
      paddingRight: paddingVertical,
      paddingLeft: paddingVertical,
      paddingBottom: paddingHorizontal,
    });
  },
  selected: () =>
    Config.Css.css({
      color: UuGds.ColorPalette.getValue(["building", "light"]).main,
    }),
  item: ({ containerSize }) => {
    const { height } = UuGds.getSizes("spot", "basic", containerSize, "moderate");
    return Config.Css.css({ height });
  },
  suffix: () =>
    Config.Css.css({
      display: "flex",
      gap: UuGds.SpacingPalette.getValue(["fixed", "a"]),
      justifyContent: "center",
      alignItems: "center",
      wordBreak: "normal",
    }),
  suffixContent: () =>
    Config.Css.css({
      minWidth: "fit-content",
    }),
  selectedBoxPlaceholder: ({ height }) =>
    Config.Css.css({
      display: "flex",
      height,
      alignItems: "center",
    }),
  selectedBoxPlaceholderItem: ({ length }) =>
    Config.Css.css({
      textTransform: "capitalize",
      justifyContent: "center",
      width: length > 2 ? "33%" : "50%",
      color: UuGds.ColorPalette.getValue(["building", "light"]).main,
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function getMinuteBaseIndex(minuteId, minute, second, step) {
  if (step && step % 1 > 0 && minute > -1 && second > -1) {
    return `m-${minuteId}-${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  }
  if (!step || (step && minute % step === 0)) {
    return `m-${minuteId}-${minute ? String(minute).padStart(2, "0") : "00"}`;
  }
}

function recalculateMinuteBase(minuteBase, minuteValue, minute, step = 1) {
  const minuteLimit = 60 - step;

  const splitMinuteValue = minuteValue.split("-");
  const [minutes] = splitMinuteValue[2].split(":");
  const minutesInt = parseInt(minutes, 10);

  if (minutesInt === minuteLimit && minute === 0) return minuteBase + 1;
  if (minutesInt === 0 && minute === minuteLimit) return minuteBase - 1;

  return minuteBase;
}

function getMinuteBaseLength(step = 1) {
  const result = MINUTE_SECOND_LIMIT / (60 / step);
  return result > MIN_LIMIT_DATE_LENGTH ? result : MIN_LIMIT_DATE_LENGTH;
}

function getItem({ value, type, index, text = value, itemContentSize }) {
  return {
    value: `${type}-${index}-${value}`,
    colorScheme: "neutral",
    className: CLASS_NAMES.item({ containerSize: itemContentSize }),
    children: ({ isValueSelected }) => {
      let result = (
        <Text
          className={CLASS_NAMES.menuItem()}
          id={`${index}-${type}-${value}`}
          colorScheme="building"
          significance={isValueSelected ? undefined : "subdued"}
        >
          {text}
        </Text>
      );

      if (isValueSelected) {
        result = <BackgroundProvider background="full">{result}</BackgroundProvider>;
      }

      return result;
    },
  };
}

function renderWithTemplate(text, suffix, template, type = "summer") {
  if (suffix) {
    return (
      <div className={CLASS_NAMES.suffix()}>
        {text}
        <div className={CLASS_NAMES.suffixContent()}>{suffix}</div>
      </div>
    );
  }
  if (typeof template === "function") {
    return template(text);
  }
  return (
    <>
      <Icon {...TimeTransition[type]} />
      {text}
    </>
  );
}

function buildHourList({
  date,
  timeFormat,
  min,
  max,
  step,
  summerTimeTemplate,
  winterTimeTemplate,
  summerTimeSuffix,
  winterTimeSuffix,
}) {
  const list = [];

  const startDt = date.startOf("day");
  const timeZone = date.getTimeZone();
  let currMs = startDt.getTime();

  const minTime = min ? min.clone().setMinute(0, 0, 0).getTime() : undefined;
  const maxTime = max ? max.getTime() : undefined;

  const itemsPerHour = step != null ? 60 / step : 1;

  let prevHour = undefined;
  let hourSuffix = "";
  while (new UuDateTime(currMs, timeZone).getDay() === startDt.getDay()) {
    for (let i = 0; i < itemsPerHour; i++) {
      let newTime = currMs;
      const dt = new UuDateTime(newTime, timeZone);
      const hour = dt.getHour();

      if ((!minTime || minTime <= dt.getTime()) && (!maxTime || maxTime >= dt.getTime())) {
        let value = (hour + "").padStart(2, "0");
        let text = ((hour % timeFormat) + "").padStart(2, "0");

        if (prevHour === hour) {
          if (dt.getMinute() === 0) {
            for (let j = 0; j < itemsPerHour; j++) {
              const lastItem = list[list.length - 1 - j];
              const lastValue = lastItem ? lastItem.value.split(":")[0] : null;
              if (lastValue === value) {
                if (step) {
                  const valueSplit = lastItem.value.split(":");
                  valueSplit[0] += "A";
                  lastItem.value = valueSplit.join(":");
                } else {
                  lastItem.value += "A";
                }

                lastItem.text = renderWithTemplate(lastItem.text, summerTimeSuffix, summerTimeTemplate);
              }
            }
            hourSuffix = "B";
          }
        } else {
          hourSuffix = "";
        }

        value += hourSuffix;

        if (step) {
          const minSuffix = ":" + (dt.getMinute() + "").padStart(2, "0");
          value += minSuffix;
          text += minSuffix;
        }

        if (hourSuffix) {
          text = renderWithTemplate(text, winterTimeSuffix, winterTimeTemplate, "winter");
        }

        list.push({ value, text });
      }

      if (dt.getMinute() === 0) prevHour = hour;
      currMs = newTime + (step ?? 60) * 60 * 1000;
    }
  }

  // clear list if there is only one value with 0 hour
  if (list.length === 1 && list[0].value === "00") list.pop();

  return list;
}

function initializeData({
  type,
  timeFormat,
  step,
  min = {},
  max = {},
  valueDt,
  summerTimeTemplateRef,
  winterTimeTemplateRef,
  itemContentSize,
  summerTimeSuffixRef,
  winterTimeSuffixRef,
}) {
  switch (type) {
    case "fixed": {
      if (!step) return [];
      const itemsPerHour = 60 / step;
      const itemsPerDay = itemsPerHour * timeFormat;
      const amountOfDays = Math.ceil(FIXED_TIME_LIMIT / itemsPerDay);
      const itemList = [];

      const hourList = buildHourList({
        date: valueDt,
        timeFormat,
        min,
        max,
        step,
        summerTimeTemplate: summerTimeTemplateRef.current,
        winterTimeTemplate: winterTimeTemplateRef.current,
        summerTimeSuffix: summerTimeSuffixRef.current,
        winterTimeSuffix: winterTimeSuffixRef.current,
      });

      for (let i = 1; i <= amountOfDays; i++) {
        for (let { value, text } of hourList) {
          itemList.push(getItem({ index: i, value, type: "f", text, itemContentSize }));
        }
      }

      return itemList;
    }
    case "hour": {
      const amountOfDays = Math.floor(HOUR_LIMIT / timeFormat);
      const itemList = [];

      const hourList = buildHourList({
        date: valueDt,
        timeFormat,
        min,
        max,
        summerTimeTemplate: summerTimeTemplateRef.current,
        winterTimeTemplate: winterTimeTemplateRef.current,
        summerTimeSuffix: summerTimeSuffixRef.current,
        winterTimeSuffix: winterTimeSuffixRef.current,
      });

      if (hourList.length > 1) {
        for (let i = 1; i <= amountOfDays; i++) {
          for (let { value, text } of hourList) {
            itemList.push(getItem({ index: i, value, type: "h", text, itemContentSize }));
          }
        }
      }

      return itemList;
    }
    case "minute": {
      const itemList = [];
      const stepProp = step || 1;
      const isStepBySeconds = stepProp % 1 > 0;
      const length = getMinuteBaseLength(stepProp);
      const minMin = typeof min === "number" ? min : undefined;
      const maxMin = typeof max === "number" ? max : undefined;

      if (minMin === MIN_LIMIT) return [];
      if (maxMin === 0) return [];

      if ((minMin != null || maxMin != null) && minMin === maxMin) return [];

      for (let i = 1; i <= length; i++) {
        for (let j = 0; j < 60 / stepProp; j++) {
          const itemNumber = j * stepProp;
          // Check min a max
          if (minMin != null && minMin > itemNumber) continue;
          if (maxMin != null && maxMin < itemNumber) continue;

          const minutes = Math.floor(itemNumber);
          const seconds = itemNumber % 1 > 0 ? Math.round((itemNumber % 1) * 60) : undefined;

          const result = seconds
            ? `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
            : isStepBySeconds
              ? `${String(minutes).padStart(2, "0")}:00`
              : String(minutes).padStart(2, "0");

          itemList.push(getItem({ index: i, value: result, type: "m", itemContentSize }));
        }
      }

      return itemList;
    }
    case "second": {
      const itemList = [];
      for (let i = 1; i <= MINUTE_SECOND_LIMIT / 60; i++) {
        for (let j = 0; j < 60; j++) {
          const result = String(j).padStart(2, "0");

          itemList.push(getItem({ index: i, value: result, type: "s", itemContentSize }));
        }
      }
      return itemList;
    }
    default: {
      break;
    }
  }
}

function getStepPropType() {
  const stepInSeconds = [2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60];
  const stepInMinutes = stepInSeconds.map((item) => item * 60);

  return [1, ...stepInSeconds, ...stepInMinutes];
}

export function createUuDateTime(value, timeZone) {
  let dt;

  if (value && value.indexOf("T") > -1) {
    dt = new UuDateTime(value, timeZone);
  } else {
    dt = new UuDateTime(undefined, timeZone);
    const [hour, min = 0, sec = 0] = value ? value.split(":") : [];
    if (hour == null) dt.setMinute(min, sec, 0);
    else dt.setHour(hour, min, sec, 0);
  }

  return dt;
}

function Icon({ icon, colorScheme, lsiKey }) {
  return (
    <Uu5Elements.Icon
      icon={"uugdsstencil-weather-" + icon}
      colorScheme={colorScheme}
      className={Config.Css.css({
        fontSize: "0.9em",
        position: "absolute",
        transform: "translate(calc(-100% - 1px), 15%)",
      })}
      tooltip={{ import: importLsi, path: ["DateTime", lsiKey] }}
    />
  );
}

function adjustDateTimeWidthStep(dt, step, reverse = false) {
  if (!step) return dt.toIsoString();

  if (reverse) {
    let newDt = dt.clone().setMinute(0, 0);
    while (newDt < dt) {
      newDt.setMinute(newDt.getMinute() + step);
    }
    return newDt.toIsoString();
  }

  let newDt = dt.clone().setMinute(0, 0);
  while (newDt < dt) {
    const tempDt = newDt.clone().setMinute(newDt.getMinute() + step);
    if (tempDt > dt) break;
    newDt = tempDt;
  }
  return newDt.toIsoString();
}

function comparePreselectedTime(preselectedTime, minTime, maxTime, step, timeZone) {
  if (!(minTime || maxTime)) return preselectedTime;

  const preselectedTimeDt = createUuDateTime(preselectedTime, timeZone);

  if (minTime) {
    const minTimeDt = createUuDateTime(minTime, timeZone);
    preselectedTimeDt.setYear(minTimeDt.getYear(), minTimeDt.getMonth(), minTimeDt.getDay());

    if (minTimeDt > preselectedTimeDt) return adjustDateTimeWidthStep(minTimeDt, step, true);
  }

  if (maxTime) {
    const maxTimeDt = createUuDateTime(maxTime, timeZone);
    preselectedTimeDt.setYear(maxTimeDt.getYear(), maxTimeDt.getMonth(), maxTimeDt.getDay());

    if (maxTimeDt < preselectedTimeDt) return adjustDateTimeWidthStep(maxTimeDt, step);
  }

  return adjustDateTimeWidthStep(preselectedTimeDt, step);
}

function buildDateTime(value, date, preselectedTime, timeZone, min, max, step) {
  let valueDt = value ? createUuDateTime(value, timeZone) : undefined;

  preselectedTime = comparePreselectedTime(preselectedTime, min, max, step, timeZone);

  if (date) {
    let dateDt;

    if (preselectedTime) {
      dateDt =
        preselectedTime.indexOf("T") > -1
          ? new UuDateTime(preselectedTime)
          : new UuDateTime([...date.split("-"), ...preselectedTime.split(":")], timeZone);
    } else {
      dateDt = new UuDateTime(undefined, timeZone).setYear(...date.split("-")).setMinute(0, 0, 0);
    }

    if (valueDt) {
      if (
        valueDt.getYear() !== dateDt.getYear() ||
        valueDt.getMonth() !== dateDt.getMonth() ||
        valueDt.getDay() !== dateDt.getDay()
      ) {
        valueDt.setYear(dateDt.getYear(), dateDt.getMonth(), dateDt.getDay());
      }
    } else valueDt = dateDt;
  } else if (!value) {
    valueDt = createUuDateTime(preselectedTime, timeZone);
    if (!preselectedTime) valueDt.setMinute(0, 0, 0);
  }

  return valueDt;
}

function getSelectedBoxPlaceholder(valueList, selectedBoxHeight, minHour, minMin, timeFormat) {
  const result = [];

  for (let i = 0; i < valueList.length; i++) {
    const it = valueList[i];

    if (it.itemList.length) continue;

    let tempValue;
    if (i === 0) {
      if (minHour != null) {
        tempValue = minHour;
        if (timeFormat === US_HOURS) tempValue = tempValue >= US_HOURS ? tempValue - US_HOURS : tempValue;
      }
    } else if (i === 1) {
      if (minMin != null) tempValue = minMin;
    }

    let children = tempValue ? tempValue.toString().padStart(2, "0") : "00";

    result.push(
      <MenuItem
        key={i}
        size={ITEM_SIZE}
        className={CLASS_NAMES.selectedBoxPlaceholderItem({ length: valueList.length })}
      >
        {children}
      </MenuItem>,
    );
  }

  if (result.length) {
    return <div className={CLASS_NAMES.selectedBoxPlaceholder({ height: selectedBoxHeight })}>{result}</div>;
  }
}
//@@viewOff:helpers

const TimePicker = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TimePicker",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.string,
    onSelect: PropTypes.func,
    displayTitles: PropTypes.bool,
    format: PropTypes.oneOf([12, 24]),
    displaySeconds: PropTypes.bool,
    step: PropTypes.oneOf(getStepPropType()),
    min: PropTypes.string,
    max: PropTypes.string,
    preselectedPickerValue: PropTypes.string,
    date: PropTypes.string,
    colorScheme: PropTypes.colorScheme,
    summerTimeSuffix: PropTypes.node,
    winterTimeSuffix: PropTypes.node,
    summerTimeTemplate: PropTypes.func,
    winterTimeTemplate: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: undefined,
    displayTitles: false,
    displaySeconds: false,
    min: undefined,
    max: undefined,
    preselectedPickerValue: "10:00:00",
    date: undefined,
    colorScheme: "primary",
    summerTimeTemplate: undefined,
    winterTimeTemplate: undefined,
    summerTimeSuffix: undefined,
    winterTimeSuffix: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const [{ hourFormat }] = useUserPreferences();
    const {
      onSelect,
      displayTitles,
      format = hourFormat ?? 24,
      displaySeconds,
      step: stepProp,
      scrollElementRef,
      min,
      max,
      value: valueProp,
      preselectedPickerValue,
      timeZone,
      date,
      summerTimeTemplate,
      winterTimeTemplate,
      summerTimeSuffix,
      winterTimeSuffix,
      colorScheme,
    } = props;

    const { ref, width } = useElementSize();
    const minWidthRef = useRef();
    if (minWidthRef.current == null || width > minWidthRef.current) minWidthRef.current = width;

    const background = useBackground();

    const step = stepProp ? stepProp / 60 : undefined; // convert to minutes
    const valueDt = buildDateTime(valueProp, date, preselectedPickerValue, timeZone, min, max, step);

    let propsHour = valueDt.getHour();
    const propsMinute = valueDt.getMinute();
    const propsSecond = valueDt.getSecond();

    const beforeHour = new UuDateTime(valueDt.getTime() - ONE_HOUR_MS, timeZone).getHour();
    const afterHour = new UuDateTime(valueDt.getTime() + ONE_HOUR_MS, timeZone).getHour();
    const suffix = propsHour === beforeHour ? "B" : propsHour === afterHour ? "A" : "";

    const minDt = min ? createUuDateTime(min, timeZone) : null;
    const maxDt = max ? createUuDateTime(max, timeZone) : null;

    // Center root Index of values in the list
    const itemBaseIndex = useRef({
      hour: Math.round(HOUR_LIMIT / 24 / 2),
      minute: Math.round(getMinuteBaseLength(step) / 2),
      second: displaySeconds && Math.round(MINUTE_SECOND_LIMIT / 60 / 2),
      fixed: step && Math.ceil(Math.ceil(FIXED_TIME_LIMIT / ((60 / step) * 24)) / 2),
    });

    const fixedTime = useRef(`f-${itemBaseIndex.current.fixed}-00:00`);
    fixedTime.current = `f-${itemBaseIndex.current.fixed}-${
      propsHour ? String(propsHour).padStart(2, "0") + suffix : "00"
    }:${propsMinute ? String(propsMinute).padStart(2, "0") : "00"}`;

    const hourValue = useRef(`h-${itemBaseIndex.current.hour}-00`);
    const [, , hourV] = hourValue.current.split("-");

    // const [period, setPeriod] = useState(() => (format === 12 ? (propsHour >= US_HOURS ? "PM" : "AM") : null));
    const period = format === 12 ? (propsHour >= US_HOURS ? "PM" : "AM") : null;

    // Check previous value, if limit exceeded, change base index of the value for selected item in VirtualizedListPicker
    if (parseInt(hourV, 10) === format - 1 && propsHour === 0) {
      itemBaseIndex.current.hour += 1;
    } else if (parseInt(hourV, 10) === 0 && propsHour === format - 1) {
      itemBaseIndex.current.hour -= 1;
    }
    hourValue.current = `h-${itemBaseIndex.current.hour}-${
      propsHour ? String(propsHour).padStart(2, "0") + suffix : "00"
    }`;

    const minuteValue = useRef(`m-${itemBaseIndex.current.minute}-00`);
    minuteValue.current =
      getMinuteBaseIndex(itemBaseIndex.current.minute, propsMinute, propsSecond, step) ?? minuteValue.current;

    itemBaseIndex.current.minute = recalculateMinuteBase(
      itemBaseIndex.current.minute,
      minuteValue.current,
      propsMinute,
      step,
    );

    const secondValue = useRef(`s-${itemBaseIndex.current.second}-00`);
    if (parseInt(secondValue.current.slice(-2), 10) === SECOND_LIMIT && propsSecond === 0) {
      itemBaseIndex.current.second += 1;
    } else if (parseInt(secondValue.current.slice(-2), 10) === 0 && propsSecond === SECOND_LIMIT) {
      itemBaseIndex.current.second -= 1;
    }
    secondValue.current = `s-${itemBaseIndex.current.second}-${
      propsSecond ? String(propsSecond).padStart(2, "0") : "00"
    }`;

    const minHour = minDt ? minDt.getHour() : undefined;
    const maxHour = maxDt ? maxDt.getHour() : undefined;
    const minMin = minDt ? minDt.getMinute() : undefined;
    const maxMin = maxDt ? maxDt.getMinute() : undefined;
    const isSameHour = minHour && maxHour && minHour === maxHour;

    const { isMobileOrTablet } = useDevice();
    const selectedBoxHeight = UuGds.getValue(["SizingPalette", "spot", "basic", "m"]).h;
    const itemContentSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[ITEM_SIZE]) || ITEM_SIZE;

    const summerTimeTemplateRef = useRef();
    summerTimeTemplateRef.current = summerTimeTemplate;
    const winterTimeTemplateRef = useRef();
    winterTimeTemplateRef.current = winterTimeTemplate;
    const summerTimeSuffixRef = useRef();
    summerTimeSuffixRef.current = summerTimeSuffix;
    const winterTimeSuffixRef = useRef();
    winterTimeSuffixRef.current = winterTimeSuffix;

    const fixedTimeData = useMemo(
      () =>
        !step || step < 6
          ? []
          : initializeData({
              type: "fixed",
              timeFormat: format,
              step,
              min: minDt,
              max: maxDt,
              valueDt,
              summerTimeTemplateRef,
              winterTimeTemplateRef,
              itemContentSize,
              summerTimeSuffixRef,
              winterTimeSuffixRef,
            }),
      [format, step, minHour, maxHour, minMin, maxMin, valueDt.getTime(), itemContentSize],
    );
    const hourData = useMemo(
      () =>
        step >= 6
          ? []
          : initializeData({
              type: "hour",
              timeFormat: format,
              step,
              min: minDt,
              max: maxDt,
              valueDt,
              summerTimeTemplateRef,
              winterTimeTemplateRef,
              itemContentSize,
              summerTimeSuffixRef,
              winterTimeSuffixRef,
            }),
      [format, step, minHour, maxHour, valueDt.getTime(), itemContentSize],
    );

    const minuteData = useMemo(
      () =>
        step >= 6
          ? []
          : initializeData({
              type: "minute",
              timeFormat: format,
              step,
              itemContentSize,
              min: isSameHour ? minMin : undefined,
              max: isSameHour ? maxMin : undefined,
            }),
      [format, step, itemContentSize, minMin, maxMin, isSameHour],
    );
    const secondData = useMemo(
      () =>
        step || !displaySeconds ? [] : initializeData({ type: "second", timeFormat: format, step, itemContentSize }),
      [format, step, displaySeconds, itemContentSize],
    );

    const onSelectRef = useRef();
    onSelectRef.current = onSelect;

    function getResultDt(hour, min = 0, sec = 0, period) {
      let newValueDt = valueDt.clone();
      let hourInt = parseInt(hour, 10);
      if (period === "PM" && hourInt < format) hourInt += format;
      else if (period === "AM" && hourInt >= format) hourInt -= format;
      if (/[AB]$/.test(hour)) {
        // calling setHour(hourInt) is ambiguous as we don't know whether we'll end up on earlier/latter
        // time point => call setHour(hourInt+1) and then shift backwards depending on A/B
        newValueDt.setHour(hourInt + 1, parseInt(min, 10), parseInt(sec, 10), 0);
        newValueDt.shiftTime(/[A]$/.test(hour) ? -2 * ONE_HOUR_MS : -ONE_HOUR_MS);
      } else {
        newValueDt.setHour(hourInt, parseInt(min, 10), parseInt(sec, 10), 0);
      }

      return newValueDt;
    }

    const callOnChange = (e, period, data = {}) => {
      if (typeof onSelect === "function") {
        const splitMinute = minuteValue.current.split("-");
        let [minutes, seconds] = splitMinute[2].split(":");
        const [, , hourV] = hourValue.current.split("-");

        if (displaySeconds) {
          seconds = secondValue.current.split("-")[2];
        }

        const changedDt = getResultDt(data.hour ?? hourV, data.minute ?? minutes, seconds, period);

        let resultValue;
        if (date) {
          resultValue = changedDt.toIsoString();
        } else {
          resultValue = changedDt.format(undefined, {
            format: `HH:mm${displaySeconds || stepProp % 60 > 0 ? ":ss" : ""}`,
          });
        }

        onSelect(new Utils.Event({ value: resultValue }, e));
      }
    };

    const onTimeSelected = (e) => {
      const [type, index, value] = e.data.value.split("-");
      switch (type) {
        case "h": {
          if (hourValue.current !== e.data.value || !valueProp) {
            itemBaseIndex.current.hour = parseInt(index, 10);
            hourValue.current = e.data.value;
            callOnChange(e);
          }
          break;
        }
        case "m": {
          if (minuteValue.current !== e.data.value || !valueProp) {
            itemBaseIndex.current.minute = parseInt(index, 10);
            minuteValue.current = e.data.value;
            callOnChange(e);
          }
          break;
        }
        case "s": {
          if (secondValue.current !== e.data.value || !valueProp) {
            itemBaseIndex.current.second = parseInt(index, 10);
            secondValue.current = e.data.value;
            callOnChange(e);
          }
          break;
        }
        case "f": {
          if (fixedTime.current !== e.data.value || !valueProp) {
            itemBaseIndex.current.fixed = parseInt(index, 10);
            fixedTime.current = e.data.value;
            const [hour, minute] = value.split(":");
            callOnChange(e, undefined, { hour, minute });
          }
          break;
        }
      }
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const renderHeader = ({ hideSwitch = false }) => {
      return (
        <>
          {format === 12 && !hideSwitch && (
            <SwitchSelectInput
              size="s"
              width="100%"
              value={period ?? "AM"}
              significance="subdued"
              className={Config.Css.css({
                borderBottomLeftRadius: "0!important",
                borderBottomRightRadius: "0!important",
                "&:hover": {
                  backgroundColor: "transparent!important",
                },
              })}
              itemList={[
                { value: "AM", children: "AM" },
                { value: "PM", children: "PM" },
              ]}
              onChange={(e) => callOnChange(e, e.data.value)}
              colorScheme={colorScheme}
            />
          )}
          {displayTitles && format === 12 && <Line significance="subdued" />}
          {displayTitles && !step && (
            <div className={CLASS_NAMES.titleBox()}>
              <Text className={CLASS_NAMES.title()} category="interface" segment="content" type="xsmall">
                <Lsi import={importLsi} path={["time", "hour"]} />
              </Text>
              <Text className={CLASS_NAMES.title()} category="interface" segment="content" type="xsmall">
                <Lsi import={importLsi} path={["time", "minute"]} />
              </Text>
              {displaySeconds && (
                <Text className={CLASS_NAMES.title()} category="interface" segment="content" type="xsmall">
                  <Lsi import={importLsi} path={["time", "second"]} />
                </Text>
              )}
            </div>
          )}
          {displayTitles && !!step && (
            <div className={CLASS_NAMES.titleBox()}>
              <Text className={CLASS_NAMES.title()} category="interface" segment="content" type="xsmall">
                <Lsi import={importLsi} path={["time", "hour"]} />
              </Text>
              <Text category="interface" segment="content" type="xsmall">
                {COLON}
              </Text>
              <Text className={CLASS_NAMES.title()} category="interface" segment="content" type="xsmall">
                <Lsi import={importLsi} path={["time", "minute"]} />
              </Text>
            </div>
          )}
        </>
      );
    };

    let valueList;
    if (step && step >= 6) {
      valueList = [{ value: fixedTime.current, itemList: fixedTimeData }];
    } else {
      valueList = [
        {
          value: hourValue.current,
          itemList: hourData,
        },
        {
          value: minuteValue.current,
          itemList: minuteData,
        },
      ];
      if (!step && displaySeconds) valueList.push({ value: secondValue.current, itemList: secondData });
    }

    const selectedBoxPlaceholder = getSelectedBoxPlaceholder(valueList, selectedBoxHeight, minHour, minMin, format);

    return (
      <div className={CLASS_NAMES.fixedDatePicker({ minWidth: minWidthRef.current })} ref={ref}>
        {renderHeader({ hideSwitch: !!selectedBoxPlaceholder })}
        <div className={CLASS_NAMES.timeColumnsBox()}>
          <div className={CLASS_NAMES.centeredSelectionBox({ selectedBoxHeight, colorScheme, background })}>
            {valueList.length === 2 && (
              <>
                {selectedBoxPlaceholder}
                <Text className={Utils.Css.joinClassName(CLASS_NAMES.centerColon(), CLASS_NAMES.selected())}>
                  {COLON}
                </Text>
              </>
            )}
            {valueList.length === 3 && (
              <>
                {selectedBoxPlaceholder}
                <Text className={Utils.Css.joinClassName(CLASS_NAMES.leftColon(), CLASS_NAMES.selected())}>
                  {COLON}
                </Text>
                <Text className={Utils.Css.joinClassName(CLASS_NAMES.rightColon(), CLASS_NAMES.selected())}>
                  {COLON}
                </Text>
              </>
            )}
          </div>
          {valueList.map(({ value, itemList, overflow }, index) => (
            <_VirtualizedListPicker
              key={index}
              scrollElementRef={scrollElementRef}
              className={CLASS_NAMES.stretchedScrollableBox({ overflow })}
              elementAttrs={props.scrollElementAttrs}
              value={value}
              onSelect={onTimeSelected}
              itemSize={ITEM_SIZE}
              itemList={itemList}
              height={isMobileOrTablet ? 300 : 268}
              scrollIndicator={{
                top: format === 12 || displayTitles ? "gradient" : "disappear",
                bottom: "disappear",
              }}
              horizontalGap={UuGds.getValue(["SpacingPalette", "fixed", "b"])}
              valueAutoScroll
              autoCentering
              paddingLeft={index === 0}
              paddingRight={index === valueList.length - 1}
              colorScheme={colorScheme}
            />
          ))}
        </div>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TimePicker };
export default TimePicker;

//@@viewOff:exports
