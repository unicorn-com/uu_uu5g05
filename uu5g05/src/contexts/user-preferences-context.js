import Context from "../utils/context.js";
import { defaultLanguage } from "../uu5-environment.js";

function getHourFormat() {
  let resolvedOpts = new Intl.DateTimeFormat(process.env.NODE_ENV === "test" ? defaultLanguage : undefined, {
    hour: "numeric",
    minute: "numeric",
  }).resolvedOptions();
  return resolvedOpts.hour12 ? 12 : 24;
}

function getSeparators(parts) {
  let grouping;
  let decimal;

  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    let type = part.type;
    if (type === "group") {
      grouping = part.value;
    } else if (type === "decimal") {
      decimal = part.value;
    }
    if (grouping && decimal) break;
  }

  return { grouping, decimal };
}

// fallback for IE
function getFallbackNumberParts() {
  let strParts = new Intl.NumberFormat(process.env.NODE_ENV === "test" ? defaultLanguage : undefined)
    .format(12345.5)
    .split(/\d+/)
    .filter(Boolean);
  let decimalStr = strParts.pop();
  let groupStr = strParts.pop();
  return [
    { type: "group", value: groupStr },
    { type: "decimal", value: decimalStr },
  ];
}

const ANY_NUMBER = 1000000.5;
const CURRENCY = "CZK";
const numberSeparators = getSeparators(
  new Intl.NumberFormat(process.env.NODE_ENV === "test" ? defaultLanguage : undefined).formatToParts?.(ANY_NUMBER) ??
    getFallbackNumberParts(),
);
const currencySeparators = getSeparators(
  new Intl.NumberFormat(process.env.NODE_ENV === "test" ? defaultLanguage : undefined, {
    style: "currency",
    currency: CURRENCY,
  }).formatToParts?.(ANY_NUMBER) ?? getFallbackNumberParts(),
);

const TYPE_CFG = {
  day: "D",
  month: "M",
  year: "Y",
  weekday: "d",
};

function parseDateFormat(parts) {
  return parts
    ?.map(({ type, value }) => {
      let result;
      if (type === "literal") {
        result = value;
      } else if (TYPE_CFG[type]) {
        const length = isNaN(value) ? 4 : type === "year" && value.length > 2 ? 1 : value.length;
        result = TYPE_CFG[type].padStart(length, TYPE_CFG[type]);
      }
      return result;
    })
    .filter((v) => v != null)
    .join("");
}

const ANY_DATE = new Date("2021-01-05");

// fallback for IE
function getDateFormat(dateStyle) {
  let parts = new Intl.DateTimeFormat(process.env.NODE_ENV === "test" ? defaultLanguage : undefined, {
    dateStyle,
  }).formatToParts?.(ANY_DATE);
  if (dateStyle === "short" && parts) {
    // because cs with dateStyle short returns year as only two last digits (e.g. 21)
    parts = parts.map((part) => (part.type === "year" ? { ...part, value: ANY_DATE.getFullYear() + "" } : part));
  }
  return parseDateFormat(parts) ?? { short: "Y-MM-DD", medium: "Y-MM-DD", full: "dddd, MMMM D, Y" }[dateStyle];
}

const EMPTY_DATA_OBJECT = { state: "readyNoData", data: null, errorData: null, pendingData: null, handlerMap: {} };

const userPreferencesContextDefaultValues = {
  userPreferences: {
    timeZone: new Intl.DateTimeFormat(process.env.NODE_ENV === "test" ? defaultLanguage : undefined).resolvedOptions()
      .timeZone,
    shortDateFormat: getDateFormat("short"),
    mediumDateFormat: getDateFormat("medium"),
    longDateFormat: getDateFormat("full"),
    weekStartDay: 1,
    hourFormat: getHourFormat(),
    // fallback for IE
    languageList: window.navigator.languages?.map((v) => v.toLowerCase()) ?? [window.navigator.language.toLowerCase()],
    numberGroupingSeparator: numberSeparators.grouping,
    numberDecimalSeparator: numberSeparators.decimal,
    currency: CURRENCY,
    currencyGroupingSeparator: currencySeparators.grouping || numberSeparators.grouping,
    currencyDecimalSeparator: currencySeparators.decimal || numberSeparators.decimal,
  },
  getCustomData: (key) => EMPTY_DATA_OBJECT,
};

const [UserPreferencesContext, useUserPreferencesContext] = Context.create(userPreferencesContextDefaultValues);

export { UserPreferencesContext, useUserPreferencesContext, userPreferencesContextDefaultValues };
export default UserPreferencesContext;
