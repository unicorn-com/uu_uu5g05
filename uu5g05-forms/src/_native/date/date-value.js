import { UuDate } from "uu_i18ng01";
import FormatValue from "../abstract/format-value";
import YearSlot from "./year-slot";
import MonthSlot from "./month-slot";
import DaySlot, { DAY_MS } from "./day-slot";

class DateValue extends FormatValue {
  static VALID_CHARS = "DMY";

  static parseValue(valueStr, format) {
    let isoValue = null;
    let uuDate = UuDate.parse(valueStr, undefined, format);
    if (uuDate) {
      isoValue = uuDate.toIsoString();
    } else {
      const jsDate = new Date(valueStr);
      if (!isNaN(jsDate)) {
        isoValue = jsDate.toISOString();
      } else {
        // TODO use logger
        console.warn(`Invalid date "${valueStr}" to paste.`);
      }
    }
    return isoValue;
  }

  static #splitValueToList(value) {
    return [...value.match(/(\d{4}|\d{2}|Y{4}|Y{2})|(\d{1,2}|D{1,2}|M{1,2})/g)];
  }

  static #parseDateToObject(isoValue) {
    let day, month, year, uuDate;

    if (isoValue) {
      uuDate = new UuDate(isoValue);
      day = uuDate.getDay();
      month = uuDate.getMonth();
      year = uuDate.getYear();
    }

    return { day, month, year, uuDate };
  }

  constructor(value, format, inputRef, { min: minValue, max: maxValue, step, lang } = {}, browserName) {
    const min = minValue ? DateValue.#parseDateToObject(minValue) : null;
    const max = maxValue ? DateValue.#parseDateToObject(maxValue) : null;

    const date = DateValue.#parseDateToObject(value);

    const slotList = DateValue.#splitValueToList(format).map((v) => {
      const Class = v.startsWith("D") ? DaySlot : v.startsWith("M") ? MonthSlot : YearSlot;
      return new Class(v, format.indexOf(v), date[Class.KEY], inputRef, { min, max, step });
    });

    super(format, slotList, inputRef, { min, max, step, lang }, browserName);
  }

  checkSeparator(key) {
    const seps = this.#formatValueByFormat(null, this._format).replace(/\s+/, "");
    const chars = [...new Set(seps.split(""))];
    if (chars.includes(key) && this._activeSlot.getValue() != null) this.selectNext();
  }

  increase() {
    this._activeSlot?.increase({ year: this._slotMap.year.getValue(), month: this._slotMap.month.getValue() });
    return this.getValue();
  }

  decrease() {
    this._activeSlot?.decrease({ year: this._slotMap.year.getValue(), month: this._slotMap.month.getValue() });
    return this.getValue();
  }

  write(value) {
    this._tempValue += value;
    this._tempValue = this._tempValue.slice(-Math.max(this._activeSlot.format.length, 2));

    const prevValue = this._activeSlot.getValue();
    this._activeSlot.setValue(+this._tempValue, {
      year: this._slotMap.year.getValue(),
      month: this._slotMap.month.getValue(),
    });

    // only a number ("02" -> 2) is set to active slot, for this reason the value from _tempValue is compared and in case of a match the focus is moved to the next slot
    const dayFormatWithZero = this._tempValue === "01" || this._tempValue === "02" || this._tempValue === "03";
    if (prevValue !== this._activeSlot.getValue() || dayFormatWithZero) {
      if (
        this._activeSlot.isMaxChars({ year: this._slotMap.year.getValue(), month: this._slotMap.month.getValue() }) ||
        dayFormatWithZero
      ) {
        this.selectNext();
      }
      return this.getValue();
    }
  }

  setValue(value) {
    return super.setValue(DateValue.#parseDateToObject(value));
  }

  toIsoString() {
    if (this.isCompleted()) {
      return new UuDate(this.getValue()).toIsoString();
    } else {
      return undefined;
    }
  }

  validate() {
    let uuDate;
    try {
      uuDate = new UuDate(this.#formatValueByFormat(this.getValue(), "YYYY-MM-DD"));
    } catch (e) {
      // invalid date
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

  #isValidStep(valueUuDate) {
    const step = this._step || 1;
    const minUuDate = this._min?.uuDate || new UuDate("1970-01-01");
    return (valueUuDate.toDate() - minUuDate.toDate()) % (step * DAY_MS) === 0;
  }

  #getMark(dn, name, length) {
    return dn.of(name)[0].toUpperCase().repeat(length);
  }

  #formatValueByFormat(value, format = "YYYY-MM-DD") {
    const dn = new Intl.DisplayNames(this._getLang(), { type: "dateTimeField" });
    let formattedValue = format;
    for (let key of ["year", "month", "day"]) {
      formattedValue = formattedValue.replace(new RegExp(`[${key[0].toUpperCase()}]+`), (v) =>
        value === null
          ? ""
          : value[key] == null
            ? this.#getMark(dn, key, v.length)
            : key === "month" && v.length > 2 // for month picker
              ? this._slotMap[key].getFormattedValue()
              : String(value[key]).padStart(v.length, "0"),
      );
    }
    return formattedValue;
  }
}

export default DateValue;
