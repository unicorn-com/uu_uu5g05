import { UuDate } from "uu_i18ng01";
import FormatValue from "../abstract/format-value";
import YearSlot from "../date/year-slot";
import MonthSlot from "../date/month-slot";

const MONTH_FORMAT_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

class DateValue extends FormatValue {
  static VALID_CHARS = "MY";

  static parseValue(valueStr, format) {
    if (MONTH_FORMAT_REGEX.test(valueStr)) return valueStr;

    console.warn(`Invalid month "${valueStr}" to paste.`);
    return null;
  }

  static #splitValueToList(value) {
    return [...value.match(/(\d{4}|Y{4})|(\d{1,2}|M{1,4})/g)];
  }

  static #parseDateToObject(isoValue) {
    let month, year, uuDate;

    if (isoValue) {
      isoValue = isoValue.padStart(7, "0"); //fixme: find better solution
      uuDate = new UuDate(isoValue);
      month = uuDate.getMonth();
      year = uuDate.getYear();
    }

    return { month, year, uuDate };
  }

  constructor(value, format, inputRef, { min: minValue, max: maxValue, step, lang } = {}, browserName) {
    const min = minValue ? DateValue.#parseDateToObject(minValue) : null;
    const max = maxValue ? DateValue.#parseDateToObject(maxValue) : null;

    const date = DateValue.#parseDateToObject(value);

    const slotList = DateValue.#splitValueToList(format).map((v) => {
      const Class = v.startsWith("M") ? MonthSlot : YearSlot;
      return new Class(v, format.indexOf(v), date[Class.KEY], inputRef, { min, max, step, lang });
    });

    super(format, slotList, inputRef, { min, max, step, lang }, browserName);
  }

  checkSeparator(key) {
    const seps = this.#formatValueByFormat(null, this._format);
    const chars = [...new Set(seps.split(""))];
    if (chars.includes(key)) this.selectNext();
  }

  increase() {
    this._activeSlot.increase({ year: this._slotMap.year.getValue(), month: this._slotMap.month.getValue() });
    return this.getValue();
  }

  decrease() {
    this._activeSlot.decrease({ year: this._slotMap.year.getValue(), month: this._slotMap.month.getValue() });
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
    if (prevValue !== this._activeSlot.getValue()) {
      if (this._activeSlot.isMaxChars({ year: this._slotMap.year.getValue(), month: this._slotMap.month.getValue() }))
        this.selectNext();
      return this.getValue();
    }
  }

  setValue(value) {
    return super.setValue(DateValue.#parseDateToObject(value));
  }

  toIsoString() {
    if (this.isCompleted()) {
      return new UuDate(this.getValue()).format(undefined, { format: "YYYY-MM" });
    } else {
      return undefined;
    }
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

  #isValidStep(valueUuDate) {
    const step = this._step || 1;
    const minUuDate = this._min?.uuDate || new UuDate("1970-01-01");
    const diff =
      (valueUuDate.getYear() * 12 + valueUuDate.getMonth() - (minUuDate.getYear() * 12 + minUuDate.getMonth())) % step;
    return diff === 0;
  }

  #getMark(dn, name, length) {
    return dn.of(name)[0].toUpperCase().repeat(length);
  }

  #formatValueByFormat(value, format = "YYYY-MM") {
    const dn = new Intl.DisplayNames(this._getLang(), { type: "dateTimeField" });
    let formattedValue = format;
    for (let key of ["year", "month"]) {
      formattedValue = formattedValue.replace(new RegExp(`[${key[0].toUpperCase()}]+`), (v) =>
        value === null
          ? ""
          : value[key] == null
            ? this.#getMark(dn, key, v.length)
            : this._slotMap[key].getFormattedValue(),
      );
    }
    return formattedValue;
  }
}

export default DateValue;
