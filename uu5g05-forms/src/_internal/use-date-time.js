//@@viewOn:imports
import { useState, useUpdateEffect, useLanguage, useTimeZone } from "uu5g05";
import { getValidDateTime } from "./tools.js";
//@@viewOff:imports

//@@viewOn:constants
const DATE_FORMAT = "YYYY-MM-DD";
const TIME_FORMAT = "HH:mm";
const TIME_FORMAT_WITH_SECONDS = "HH:mm:ss";
//@@viewOff:constants

//@@viewOn:helpers
function getValidDateFormat(date) {
  if (!date) return;

  return date.replace(/^([^-]+)/, (match) => match.padStart(4, "0"));
}

function getDateTimeByFormat(dateTime, format, lang) {
  if (!dateTime) return;
  return dateTime.format(lang, { format });
}
//@@viewOff:helpers

function useDateTime(value, step) {
  const [lang] = useLanguage();
  const [timeZone] = useTimeZone();

  const dateTime = getValidDateTime(value, timeZone);

  const [date, setDate] = useState(() => getValidDateFormat(getDateTimeByFormat(dateTime, DATE_FORMAT, lang)));
  const [time, setTime] = useState(() =>
    getDateTimeByFormat(dateTime, step % 60 ? TIME_FORMAT_WITH_SECONDS : TIME_FORMAT, lang),
  );

  useUpdateEffect(() => {
    setDate(getValidDateFormat(getDateTimeByFormat(dateTime, DATE_FORMAT, lang)));
    setTime(getDateTimeByFormat(dateTime, step % 60 ? TIME_FORMAT_WITH_SECONDS : TIME_FORMAT, lang));
  }, [value, lang, step, timeZone]);

  return { date, setDate, time, setTime };
}

//@@viewOn:exports
export { useDateTime };
export default useDateTime;
//@@viewOff:exports
