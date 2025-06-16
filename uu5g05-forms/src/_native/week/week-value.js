import { UuDate } from "uu_i18ng01";
import FormatValue from "../abstract/format-value";
import YearSlot from "../date/year-slot";
import WeekSlot from "./week-slot.js";

const MAX_WEEK_OF_YEAR = 52;
const MIN_DATE = "1970-01-01";
const YEAR_DN = "year";
const WEEK_DN = "weekOfYear";
const START_WITH_NUMBER_REGEX = /^(cs|sk|uk)/;

class DateValue extends FormatValue {
  static VALID_CHARS = "wWY";

  static parseValue(valueStr) {
    let isoValue = null;

    try {
      const uuDate = new UuDate(valueStr);
      isoValue = uuDate.toIsoWeekString(true);
    } catch {
      // invalid uuDate
    }

    // Valid uuDate
    if (isoValue) return isoValue;

    const matcher = valueStr.match(/(^([0-9]|[1-4][0-9]|5[0-2])\b)|(\b\d{1,4}\b)/g);
    let week = matcher[0];
    let year = matcher[1];

    isoValue = DateValue.#getIsoValue(year, week);

    if (!isoValue) {
      console.warn(`Invalid week "${valueStr}" to paste.`);
      return isoValue;
    }

    return isoValue;
  }

  static #getIsoValue(year, week) {
    if (year && week) {
      week = week.padStart(2, "0");
      year = year.padStart(4, "0");

      return year + "-W" + week;
    }
    return null;
  }

  static #splitValueToList(value) {
    return [...value.match(/(\d{4}|Y{4})|(\d{1,2}|[Ww]{1,2})/g)];
  }

  static #parseDateToObject(isoValue) {
    let weekOfYear, year, uuDate;
    if (isoValue) {
      let parts = isoValue.split("-");
      let yearValue = parts[0]?.padStart(4, "0");
      let weekOfYearValue = parts[1];
      uuDate = new UuDate(yearValue + "-" + weekOfYearValue);
      weekOfYear = uuDate.getWeek();
      year = uuDate.getWeekYear();
    }

    return { weekOfYear, year, uuDate };
  }

  static #getDNWeekOfYearLength(lang) {
    const dn = new Intl.DisplayNames(lang, { type: "dateTimeField" });
    const dnText = dn.of(WEEK_DN);

    return dnText?.length;
  }

  static #getWeekSlotIndex(lang, format, slotFormat, isShort) {
    const sum = format.indexOf(slotFormat);
    if (isShort || START_WITH_NUMBER_REGEX.test(lang)) return sum;

    const dnWeekOfYearLength = DateValue.#getDNWeekOfYearLength(lang);
    const test = sum + dnWeekOfYearLength + 1;
    return test;
  }

  static #getYearSlotIndex(lang, format, slotFormat, isShort) {
    if (isShort) return format.indexOf(slotFormat);

    const sum = format.indexOf(slotFormat) + DateValue.#getDNWeekOfYearLength(lang);

    if (START_WITH_NUMBER_REGEX.test(lang)) {
      if (lang.startsWith("uk")) return sum + 3; // Number 3 is added due the "-й*" pattern
      return sum + 2; // Number 2 is added due the ".*" pattern
    }
    return sum + 1; // Number 1 is added due the "*" pattern
  }

  #shortWeekFormat = false;

  constructor(value, format, inputRef, { min: minValue, max: maxValue, step, lang } = {}, browserName) {
    const min = minValue ? DateValue.#parseDateToObject(minValue) : null;
    const max = maxValue ? DateValue.#parseDateToObject(maxValue) : null;

    const date = DateValue.#parseDateToObject(value);

    const slotValueList = DateValue.#splitValueToList(format);
    const weekIndex = slotValueList.findIndex((it) => it.toUpperCase().startsWith("W"));
    const shortWeekFormat = slotValueList[weekIndex].startsWith("w");

    const slotList = DateValue.#splitValueToList(format).map((v, i) => {
      let Class, index;

      if (v.toUpperCase().startsWith("W")) {
        Class = WeekSlot;
        index = DateValue.#getWeekSlotIndex(lang, format, v, shortWeekFormat);
      } else {
        Class = YearSlot;
        index = DateValue.#getYearSlotIndex(lang, format, v, shortWeekFormat || i === 0);
      }

      return new Class(v, index, date[Class.KEY], inputRef, { min, max, step });
    });

    super(format, slotList, inputRef, { min, max, step, lang }, browserName);

    this.#shortWeekFormat = shortWeekFormat;
    this.#setSelectionFormat(lang);
  }

  increase() {
    this._activeSlot.increase({ year: this._slotMap.year.getValue(), weekOfYear: this._slotMap.weekOfYear.getValue() });
    return this.getValue();
  }

  decrease() {
    this._activeSlot.decrease({ year: this._slotMap.year.getValue(), weekOfYear: this._slotMap.weekOfYear.getValue() });
    return this.getValue();
  }

  write(value) {
    this._tempValue += value;
    this._tempValue = this._tempValue.slice(-Math.max(this._activeSlot.format.length, 2));

    const prevValue = this._activeSlot.getValue();
    this._activeSlot.setValue(+this._tempValue, {
      year: this._slotMap.year.getValue(),
      weekOfYear: this._slotMap.weekOfYear.getValue(),
    });
    if (prevValue !== this._activeSlot.getValue()) {
      if (
        this._activeSlot.isMaxChars({
          year: this._slotMap.year.getValue(),
          weekOfYear: this._slotMap.weekOfYear.getValue(),
        })
      )
        this.selectNext();
      return this.getValue();
    }
  }

  setValue(value) {
    return super.setValue(DateValue.#parseDateToObject(value));
  }

  toIsoString() {
    if (this.isCompleted()) {
      const { year, weekOfYear } = this.getValue();
      return DateValue.#getIsoValue(year?.toString(), weekOfYear?.toString());
    }
    return undefined;
  }

  validate() {
    let uuDate;
    if (this.isCompleted()) {
      try {
        uuDate = new UuDate(this.getValue());
      } catch (e) {
        // invalid date
      }
    }
    if (!uuDate) return "badValue";
    else if (this._min && UuDate.compare(uuDate, this._min.uuDate) < 0) return "min";
    else if (this._max && UuDate.compare(uuDate, this._max.uuDate) > 0) return "max";
    else if (this._step > 0 && !this.#isValidStep(uuDate)) return "step";
  }

  setMin(min) {
    return super.setMin(min ? DateValue.#parseDateToObject(min) : null);
  }

  setMax(max) {
    return super.setMax(max ? DateValue.#parseDateToObject(max) : null);
  }

  format() {
    const formattedValue = this.#formatValueByFormat(this.getValue(), this._format);

    super._updateIndexes();

    return formattedValue;
  }

  setLang(lang) {
    if (this._getLang() !== lang) {
      super._slotList.forEach((slot, i) => {
        let shortWeekFormat = this.#shortWeekFormat;
        if (slot instanceof YearSlot) shortWeekFormat = shortWeekFormat || i === 0;
        this.#updateSlotInitialIndex(slot, lang, shortWeekFormat);
      });
    }

    super.setLang(lang);
    this.#setSelectionFormat(lang);
    return this;
  }

  #setSelectionFormat(lang) {
    const shortWeekFormat = this.#shortWeekFormat;
    function markFn(_, name, length) {
      const dn = { year: "Y", weekOfYear: shortWeekFormat ? "w" : "W" };
      return dn[name].repeat(length);
    }

    let formattedValue = this.#formatValueByFormat({ year: undefined, weekOfYear: undefined }, this._format, markFn);
    const dn = new Intl.DisplayNames(lang, { type: "dateTimeField" });
    let dnText = dn.of(WEEK_DN);
    dnText = dnText.replace(dnText[0], dnText[0].toUpperCase());
    formattedValue = formattedValue.replace(dnText, " ".repeat(dnText.length));
    this.setSelectionFormat(formattedValue);
  }

  #updateSlotInitialIndex(slot, lang, shortWeekFormat) {
    let index;

    const slotFormat = slot.format;

    if (slotFormat.toUpperCase().startsWith("W")) {
      index = DateValue.#getWeekSlotIndex(lang, this._format, slotFormat, shortWeekFormat);
    } else {
      index = DateValue.#getYearSlotIndex(lang, this._format, slotFormat, shortWeekFormat);
    }

    slot.updateInitialIndex(index);
  }

  #isValidStep(valueUuDate) {
    const step = this._step || 1;
    const minUuDate = this._min?.uuDate || new UuDate(MIN_DATE);
    const diff =
      (valueUuDate.getYear() * MAX_WEEK_OF_YEAR +
        valueUuDate.getWeek() -
        (minUuDate.getYear() * MAX_WEEK_OF_YEAR + minUuDate.getWeek())) %
      step;
    return diff === 0;
  }

  #getMark(dn, name, length) {
    return dn.of(name)[0].toUpperCase().repeat(length);
  }

  #formatValueByFormat(value, format = "YYYY-WW", markFn = this.#getMark) {
    const lang = this._getLang();
    const dn = new Intl.DisplayNames(lang, { type: "dateTimeField" });
    const slotMap = this._slotMap;
    let formattedValue = format;
    for (let key of [YEAR_DN, WEEK_DN]) {
      formattedValue = formattedValue.replace(new RegExp(`[${key[0]}${key[0].toUpperCase()}]+`), (v) => {
        if (value === null) return "";

        let result = value[key] == null ? markFn(dn, key, v.length) : this._slotMap[key].getFormattedValue();

        if (key === WEEK_DN) {
          const format = slotMap[WEEK_DN].format;
          if (format.startsWith("W")) {
            if (START_WITH_NUMBER_REGEX.test(lang)) {
              if (lang.startsWith("uk")) {
                result += `-й ${dn.of(key)}`;
              } else {
                result += `. ${dn.of(key)}`;
              }
            } else {
              let word = dn.of(key);
              if (word) word = word.replace(word[0], word[0].toUpperCase());
              result = `${word} ${result}`;
            }
          }
        }

        return result;
      });
    }

    return formattedValue;
  }
}

export default DateValue;
