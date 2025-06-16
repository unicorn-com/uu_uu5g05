import { UuDate } from "uu_i18ng01";

function guessIsoDateFromPaste(text) {
  if (!text) return;
  let isoDate;
  if (text.match(/^\d{4,}-\d{2}-\d{2}$/)) {
    isoDate = text;
  } else {
    let parts = text.split(/\s*\W\s*/);
    if (parts.length === 3 && parts.every((it) => Number(it))) {
      let numbers = parts.map(Number); // "16.10.2021" -> [16, 10, 2021]
      let max = Math.max(...numbers);
      if (max >= 1000) {
        // i. the biggest number is year; can be only at the beginning/end, not in the middle
        // ii. if one of remaining 2 numbers is > 12 then it's day
        // iii. otherwise assume that 1st is day, 2nd is month
        let year, dayMonthPair;
        if (max === numbers[0]) {
          year = numbers[0];
          dayMonthPair = [numbers[2], numbers[1]];
        } else if (max === numbers[2]) {
          year = numbers[2];
          dayMonthPair = [numbers[0], numbers[1]];
        }
        if (dayMonthPair) {
          if (dayMonthPair[1] > 12) isoDate = toIsoDate(dayMonthPair[1], dayMonthPair[0], year);
          else isoDate = toIsoDate(...dayMonthPair, year);
        }
      }
    }
  }
  return isoDate;
}

function guessIsoTimeFromPaste(text, includeSeconds) {
  let isoTime;
  let match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    isoTime = match[1] + ":" + match[2];
    if (includeSeconds) isoTime += ":" + (match[3] || "00");
  }
  return isoTime;
}

function guessIsoDateTimeFromPaste(text, includeSeconds) {
  let isoDateTime;
  let hasTime = text.indexOf(":") !== -1;
  let match = hasTime ? text.match(/^(.*)\s(.*)$/) : ["", text]; // split by last white-space
  if (match) {
    let isoDate = guessIsoDateFromPaste(match[1]);
    let isoTime = hasTime ? guessIsoTimeFromPaste(match[2], includeSeconds) : "00:00" + (includeSeconds ? ":00" : "");
    if (isoDate && isoTime) isoDateTime = isoDate + "T" + isoTime;
  }
  return isoDateTime;
}

function toIsoDate(day, month, year) {
  if (month > 12 || month < 1 || day > 31 || day < 1) return;
  return (year + "").padStart(4, "0") + "-" + (month + "").padStart(2, "0") + "-" + (day + "").padStart(2, "0");
}

function dateToIsoWeek(dateString, weekStartDay = 1) {
  if (!dateString) return undefined;

  let date = new UuDate(dateString);
  let year = date.getYear();
  let week = date.getWeek(weekStartDay);

  // we need to check and fix if it is last week of the last year of first week of the next year
  let weekDay = date.getWeekDay();
  let dayOffset = weekStartDay - weekDay;
  if (dayOffset > 0) dayOffset -= 7; // if dayOffset is positive then we will shift into the future, but we alwys need to shift into the past
  let startWeekYear = date.shiftDay(dayOffset).getYear();
  let endWeekYear = date.shiftDay(6).getYear();
  if (startWeekYear !== endWeekYear) {
    if (startWeekYear === year && week === 1) {
      // it is first week of the next year
      year++;
    } else if (endWeekYear === year && week !== 1) {
      // it is last week of the previous year
      year--;
    }
  }

  return `${(year + "").padStart(4, "0")}-W${String(week).padStart(2, "0")}`;
}

function isoWeekListToDateRange(weekList, weekStartDay) {
  if (!Array.isArray(weekList)) return undefined;

  return [
    weekList[0] ? isoWeekToDateRange(weekList[0], weekStartDay)[0] : weekList[0],
    weekList[1] ? isoWeekToDateRange(weekList[1], weekStartDay)[1] : weekList[1],
  ];
}

function isoWeekToDateRange(weekString, weekStartDay = 1) {
  if (!weekString) return undefined;

  let [year, week] = weekString.split("-W").map((item) => Number(item));
  let date = new UuDate({ year, day: 1, month: 1 });
  let startWeek = date.getWeek(weekStartDay);
  let daysOffset = startWeek === 1 ? 0 : 7; // if start of the year is not first week of the year we need to move to the first week
  daysOffset += weekStartDay - date.getWeekDay();
  daysOffset += (week - 1) * 7;
  date.shiftDay(daysOffset);
  return [date.toIsoString(), date.shiftDay(6).toIsoString()];
}

function toIsoMonthValue(newValue) {
  // if newValue is valid <year>-<month>, ensure that <year> is minimally 4 digits and <month> 2 digits
  if (typeof newValue !== "string") return newValue;
  return newValue.replace(/^(\d+)-(0?[1-9]|10|11|12)$/, (m, year, month) => {
    return year.padStart(4, "0") + "-" + month.padStart(2, "0");
  });
}

function toIsoQuarterValue(newValue) {
  // if newValue is <year>-Q<quarter>, ensure that <year> is minimally 4 digits
  if (typeof newValue !== "string") return newValue;
  return newValue.replace(/^(\d+)-Q(\d)$/, (m, year, quarter) => {
    return year.padStart(4, "0") + "-Q" + quarter;
  });
}

export {
  guessIsoDateFromPaste,
  guessIsoTimeFromPaste,
  guessIsoDateTimeFromPaste,
  dateToIsoWeek,
  isoWeekListToDateRange,
  isoWeekToDateRange,
  toIsoMonthValue,
  toIsoQuarterValue,
};
