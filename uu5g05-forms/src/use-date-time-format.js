//@@viewOn:imports
import { useLanguage, useLsi, useTimeZone, useUserPreferences } from "uu5g05";
import { DateTime } from "uu5g05-elements";
import { UuDate, UuDateTime } from "uu_i18ng01";
import useBrowserHourFormat from "./_internal/use-browser-hour-format.js";
import { validateMonthInputValue, validateQuarterInputValue, validateYearInputValue } from "./_internal/tools.js";
import importLsi from "./lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const REGEXP_DDMMYYY = /(([dD]+[.]*(\s*))([mM]+[.]*(\s*))([yY]+[.]*)(?!(.)+))/;
const DATE_FORMAT = "YYYY-MM-DD";
const TIME_FORMAT = "HH:mm:ss";

const TIME_REGEXP = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/; // HH:MM or HH:MM:SS
const MONTH_REGEXP = /^\d{4}-\d{2}$/; // YYYY-MM
const WEEK_REGEXP = /^\d{4}-W\d{2}$/; // YYYY-WXX
const QUARTER_REGEXP = /^\d{4}-Q\d{1}$/; // YYYY-QX
const DATE_REGEXP = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const DATE_TIME_REGEXP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/; // YYYY-MM-DDThh:mmZ or YYYY-MM-DDThh:mm±hh:mm
//@@viewOff:constants

//@@viewOn:helpers
function getInputType(value) {
  let result;
  let complement = Array.isArray(value) && value.length > 0 ? "-range" : "";
  let testedValue =
    typeof value === "string" || typeof value === "number"
      ? value
      : Array.isArray(value) && value.length > 0
        ? value[0]
        : undefined;

  if (testedValue) {
    if (typeof testedValue === "number") {
      result = "year";
    } else {
      let valueParts = testedValue.split("-");
      if (valueParts.length === 1) {
        if (TIME_REGEXP.test(testedValue)) result = "time";
      } else if (valueParts.length === 2) {
        if (MONTH_REGEXP.test(testedValue)) result = "month";
        if (QUARTER_REGEXP.test(testedValue)) result = "quarter";
        if (WEEK_REGEXP.test(testedValue)) result = "week";
      } else if (valueParts.length === 3) {
        if (DATE_REGEXP.test(testedValue)) result = "date";
        if (DATE_TIME_REGEXP.test(testedValue)) result = "date-time";
      }
    }
  }
  return result + complement;
}

function getValidDateFormat(date) {
  return date.replace(/^([^-]+)/, (match) => match.padStart(4, "0"));
}

function getTimeValue(value, inputProps, browserHourFormat, lang) {
  const { step, pickerType, displaySeconds } = inputProps;

  let showSeconds = pickerType === "native" ? step && step % 60 !== 0 : displaySeconds || step % 60 > 0;
  let time = new UuDateTime("1970-01-01T" + value).format(lang, {
    hourCycle: browserHourFormat === 12 ? "h12" : "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
  });
  return time;
}

function getDateValue(value, shortDateFormat, lang) {
  let formattedValue;
  try {
    // TODO Year > 9999 now throws - we should handle it as invalid value (and thus be consistent with DateTime.Input).
    formattedValue = new UuDate(value).format(lang, { format: shortDateFormat });
  } catch (e) {
    // ignore
  }
  return formattedValue;
}

function getDateRangeValue(value, shortDateFormat, lang) {
  const dateFormat = shortDateFormat.toUpperCase();
  const regexpMatch = REGEXP_DDMMYYY.exec(dateFormat);
  const shortDateAvailable = Array.isArray(regexpMatch);
  const dayFormat = shortDateAvailable && regexpMatch[2];
  const dayWhitespace = (shortDateAvailable && regexpMatch[3]) || "";
  const monthFormat = shortDateAvailable && regexpMatch[4];
  const dateFrom = new UuDate(value[0]);
  const dateTo = new UuDate(value[1]);

  let formattedValue;
  if (dateFrom.isSameDate(dateTo)) {
    // DateFrom and dateTo has the same value
    formattedValue = dateTo.format(lang, { format: dateFormat });
  } else if (dateFrom.isSameMonthYear(dateTo)) {
    // Dates have the same month, year but different day
    formattedValue = `${
      shortDateAvailable ? dateFrom.format(lang, { format: dayFormat }) : dateFrom.format(lang, { format: dateFormat })
    } - ${dateTo.format(lang, { format: dateFormat })}`;
  } else if (dateFrom.isSameYear(dateTo)) {
    // Dates have the same year but different month and day
    formattedValue = `${
      shortDateAvailable
        ? dateFrom.format(lang, { format: dayFormat + dayWhitespace + monthFormat })
        : dateFrom.format(lang, { format: dateFormat })
    } - ${dateTo.format(lang, { format: dateFormat })}`;
  } else {
    // Dates are from a different years
    formattedValue = `${dateFrom.format(lang, { format: dateFormat })} - ${dateTo.format(lang, {
      format: dateFormat,
    })}`;
  }
  return formattedValue;
}

function getMonthRangeValue(value) {
  let firstValue = value[0].split("-");
  let secondValue = value[1].split("-");

  let formattedValue;
  if (firstValue[0] === secondValue[0]) {
    // Dates have the same years
    if (firstValue[1] === secondValue[1]) {
      // Dates have the same years and months
      formattedValue = <DateTime value={`${value[0]}-01`} format="MMMM Y" />;
    } else {
      // Dates have the same years, but different months
      formattedValue = (
        <>
          <DateTime value={`${value[0]}-01`} format="MMMM" />
          {" - "}
          <DateTime value={`${value[1]}-01`} format="MMMM Y" />
        </>
      );
    }
  } else {
    // Dates have different years
    formattedValue = (
      <>
        <DateTime value={`${value[0]}-01`} format="MMMM Y" />
        {" - "}
        <DateTime value={`${value[1]}-01`} format="MMMM Y" />
      </>
    );
  }
  return formattedValue;
}

function getWeekRangeValue(value, lsiWeek, lang) {
  let [startYear, startWeek] = value[0].split("-W");
  let [endYear, endWeek] = value[1].split("-W");

  let formattedValue;
  if (startYear === endYear) {
    // Dates have the same years
    if (startWeek === endWeek) {
      // Dates have the same years and weeks
      if (lang === "uk") {
        formattedValue = `${startWeek}-й ${lsiWeek}, ${startYear}`;
      } else if (lang === "en") {
        formattedValue = `${lsiWeek.replace(lsiWeek[0], lsiWeek[0].toUpperCase())} ${startWeek}, ${startYear}`;
      } else {
        // cs, sk ..
        formattedValue = `${startWeek}. ${lsiWeek}, ${startYear}`;
      }
    } else {
      // Dates have the same years, but different weeks
      if (lang === "uk") {
        formattedValue = `${startWeek}-й - ${endWeek}-й ${lsiWeek}, ${startYear}`;
      } else if (lang === "en") {
        formattedValue = `${lsiWeek.replace(lsiWeek[0], lsiWeek[0].toUpperCase())} ${startWeek} - ${endWeek}, ${startYear}`;
      } else {
        // cs, sk ..
        formattedValue = `${startWeek}. - ${endWeek}. ${lsiWeek}, ${startYear}`;
      }
    }
  } else {
    // Dates have different years
    if (lang === "uk") {
      formattedValue = `${startWeek}-й ${lsiWeek}, ${startYear} - ${endWeek}-й ${lsiWeek}, ${endYear}`;
    } else if (lang === "en") {
      formattedValue = `${lsiWeek.replace(lsiWeek[0], lsiWeek[0].toUpperCase())} ${startWeek}, ${startYear} - ${lsiWeek.replace(lsiWeek[0], lsiWeek[0].toUpperCase())} ${endWeek}, ${endYear}`;
    } else {
      // cs, sk ..
      formattedValue = `${startWeek}. ${lsiWeek}, ${startYear} - ${endWeek}. ${lsiWeek}, ${endYear}`;
    }
  }
  return formattedValue;
}

function getQuarterRangeValue(value) {
  let firstValue = value[0].split("-");
  let secondValue = value[1].split("-");

  let formattedValue;
  if (firstValue[0] === secondValue[0]) {
    // Dates have the same years
    if (firstValue[1] === secondValue[1]) {
      // Dates have the same years and quarters
      formattedValue = `Q${firstValue[1].slice(1)} ${firstValue[0]}`;
    } else {
      // Dates have the same years, but different quarters
      formattedValue = `Q${firstValue[1].slice(1)} - Q${secondValue[1].slice(1)} ${firstValue[0]}`;
    }
  } else {
    // Dates have different years
    formattedValue = `Q${firstValue[1].slice(1)} ${firstValue[0]} - Q${secondValue[1].slice(1)} ${secondValue[0]}`;
  }
  return formattedValue;
}

function getYearRangeValue(value) {
  let firstValue = value[0];
  let secondValue = value[1];

  let formattedValue;
  if (firstValue === secondValue) {
    // Dates have the same value
    formattedValue = firstValue;
  } else {
    // Dates have different value
    formattedValue = firstValue + " - " + secondValue;
  }
  return formattedValue;
}
//@@viewOff:helpers

//@@viewOn:hook
function useDateTimeFormat(value, inputProps = {}) {
  const [{ shortDateFormat: userPreferencesFormat }] = useUserPreferences();
  const shortDateFormat = inputProps.format ?? userPreferencesFormat;
  const [ctxTimeZone] = useTimeZone();
  const timeZone = inputProps.timeZone ?? ctxTimeZone;
  const [lang] = useLanguage();
  const browserHourFormat = useBrowserHourFormat();
  const lsi = useLsi({ import: importLsi, path: ["date"] });

  let formattedValue = null;
  if (value) {
    const inputType = getInputType(value);
    if (inputType === "time") {
      // Time.Input
      // FIXME: HTML time input's format is derived from browser language and cant be forced.
      // Right now we leave this be and just display the value formatted based on the browser
      // language (navigator.language).
      formattedValue = getTimeValue(value, inputProps, browserHourFormat, lang);
    } else if (inputType === "date") {
      // Date.Input
      formattedValue = getDateValue(value, shortDateFormat, lang);
    } else if (inputType === "date-range") {
      // DateRange.Input
      formattedValue = getDateRangeValue(value, shortDateFormat, lang);
    } else if (inputType === "date-time") {
      // DateTime.Input (in uu5 - formatting solves Time and Date components)
      // formatting is for components in Uu5Tiles library
      let isoDate = new UuDateTime(getValidDateFormat(value), timeZone).format(lang, { format: DATE_FORMAT });
      let isoTime = new UuDateTime(getValidDateFormat(value), timeZone).format(lang, { format: TIME_FORMAT });
      let date = getDateValue(getValidDateFormat(isoDate), shortDateFormat, lang);
      let time = getTimeValue(isoTime, inputProps, browserHourFormat, lang);

      formattedValue = `${date}, ${time}`;
    } else if (inputType === "month") {
      // Month.Input
      try {
        // TODO Year > 9999 now throws - we should handle it as invalid value (and thus be consistent with DateTime.Input).
        formattedValue = new UuDate(`${value}-01`).format(lang, { format: "MMMM Y" });
      } catch (e) {
        // ignore
      }
    } else if (inputType === "month-range") {
      // MonthRange.Input
      formattedValue =
        validateMonthInputValue(value[0]) && validateMonthInputValue(value[1]) ? getMonthRangeValue(value) : null;
    } else if (inputType === "week") {
      // Week.Input (in uu5 - formatting solves native input)
      // formatting is for components in Uu5Tiles library
      let dateParts = value.split("-W");
      let year = dateParts[0];
      let week = dateParts[1];

      formattedValue = `${week}. ${lsi.week}, ${year}`;
    } else if (inputType === "week-range") {
      // WeekRange.Input
      formattedValue = getWeekRangeValue(value, lsi.week, lang);
    } else if (inputType === "quarter") {
      // Quarter.Input
      let dateParts = value.split("-Q");
      let year = dateParts[0];
      let quarter = dateParts[1];

      formattedValue = `Q${quarter} ${year}`;
    } else if (inputType === "quarter-range") {
      // QuarterRange.Input
      formattedValue =
        validateQuarterInputValue(value[0]) && validateQuarterInputValue(value[1]) ? getQuarterRangeValue(value) : null;
    } else if (inputType === "year") {
      // Year.Input
      formattedValue = value;
    } else if (inputType === "year-range") {
      // YearRange.Input
      formattedValue =
        validateYearInputValue(value[0]) && validateYearInputValue(value[1]) ? getYearRangeValue(value) : null;
    }
  }

  return formattedValue;
}
//@@viewOff:hook

//@@viewOn:exports
export { useDateTimeFormat };
export default useDateTimeFormat;
//@@viewOff:exports
