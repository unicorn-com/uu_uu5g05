import FormatValue from "../abstract/format-value";
import YearSlot from "../date/year-slot";
import QuarterSlot from "./quarter-slot.js";

const QUARTER_FORMAT_REGEX = /^\d{4}-Q[1-4]$/;

class DateValue extends FormatValue {
  static VALID_CHARS = "QY";

  static parseValue(valueStr) {
    if (QUARTER_FORMAT_REGEX.test(valueStr)) return valueStr;

    console.warn(`Invalid quarter "${valueStr}" to paste.`);
    return null;
  }

  static #splitValueToList(value) {
    return [...value.match(/(Q[1-4]|Q{1})|(\d{4}|Y{4})/g)];
  }

  static #parseDateToObject(value) {
    let quarter, year;

    if (value) {
      let parts = value.split("-");
      year = parseInt(parts[0]?.padStart(4, "0"));
      quarter = parseInt(parts[1].replace("Q", ""));
    }

    return { quarter, year };
  }

  static #getQuarterSlotIndex(format, slotFormat) {
    return format.indexOf(slotFormat) + 1;
  }

  static #getYearSlotIndex(format, slotFormat) {
    return format.indexOf(slotFormat) + 1;
  }

  constructor(value, format, inputRef, { min: minValue, max: maxValue, step, lang } = {}, browserName) {
    const min = minValue ? DateValue.#parseDateToObject(minValue) : null;
    const max = maxValue ? DateValue.#parseDateToObject(maxValue) : null;

    const date = DateValue.#parseDateToObject(value);

    const slotList = DateValue.#splitValueToList(format).map((v) => {
      let Class, index;

      if (v.startsWith("Q")) {
        Class = QuarterSlot;
        index = DateValue.#getQuarterSlotIndex(format, v);
      } else {
        Class = YearSlot;
        index = DateValue.#getYearSlotIndex(format, v);
      }

      return new Class(v, index, date[Class.KEY], inputRef, { min, max, step });
    });

    super(format, slotList, inputRef, { min, max, step, lang }, browserName);
  }

  checkSeparator(key) {
    const seps = this.#formatValueByFormat(null, this._format);
    const chars = [...new Set(seps.split(""))];
    if (chars.includes(key)) this.selectNext();
  }

  increase() {
    this._activeSlot.increase({ year: this._slotMap.year.getValue(), quarter: this._slotMap.quarter.getValue() });
    return this.getValue();
  }

  decrease() {
    this._activeSlot.decrease({ year: this._slotMap.year.getValue(), quarter: this._slotMap.quarter.getValue() });
    return this.getValue();
  }

  write(value) {
    this._tempValue += value;
    this._tempValue = this._tempValue.slice(-Math.max(this._activeSlot.format.length, 2));

    const prevValue = this._activeSlot.getValue();
    this._activeSlot.setValue(+this._tempValue, {
      year: this._slotMap.year.getValue(),
      quarter: this._slotMap.quarter.getValue(),
    });
    if (prevValue !== this._activeSlot.getValue()) {
      if (
        this._activeSlot.isMaxChars({ year: this._slotMap.year.getValue(), quarter: this._slotMap.quarter.getValue() })
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
      let value = this.getValue();
      return value.year + "-Q" + value.quarter;
    } else {
      return undefined;
    }
  }

  validate() {
    let value;
    if (this.isCompleted()) {
      try {
        value = this.getValue();
      } catch (e) {
        // invalid date
      }
    }
    if (!value) return "badValue";
    else if (this._min && !this.#isValidMin(value)) return "min";
    else if (this._max && !this.#isValidMax(value)) return "max";
    else if (this._step > 0 && !this.#isValidStep(value)) return "step";
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
      super._slotList.forEach((slot) => {
        this.#updateSlotInitialIndex(slot, lang);
      });
    }

    super.setLang(lang);
    return this;
  }

  #updateSlotInitialIndex(slot, lang) {
    let index;
    const slotFormat = slot.format;

    if (slotFormat.startsWith("Q")) {
      index = DateValue.#getQuarterSlotIndex(this._format, slotFormat);
    } else {
      index = DateValue.#getYearSlotIndex(this._format, slotFormat);
    }

    slot.updateInitialIndex(index);
  }

  #isValidMin(value) {
    const minDate = this._min || { year: 1970, quarter: 1 };
    let isValid = true;
    if (value.year < minDate.year) {
      isValid = false;
    } else if (value.year === minDate.year) {
      if (value.quarter < minDate.quarter) isValid = false;
    }
    return isValid;
  }

  #isValidMax(value) {
    const maxDate = this._max || { year: 9999, quarter: 4 };
    let isValid = true;
    if (value.year > maxDate.year) {
      isValid = false;
    } else if (value.year === maxDate.year) {
      if (value.quarter > maxDate.quarter) isValid = false;
    }
    return isValid;
  }

  #isValidStep(value) {
    const step = this._step || 1;
    const minDate = this._min || { year: 1970, quarter: 1 };
    const diff = (value.year * 4 + value.quarter - (minDate.year * 4 + minDate.quarter)) % step;
    return diff === 0;
  }

  #getMark(dn, name, length) {
    return dn.of(name)[0].toUpperCase().repeat(length);
  }

  #formatValueByFormat(value, format = "YYYY-QQ") {
    const dn = new Intl.DisplayNames(this._getLang(), { type: "dateTimeField" });
    let formattedValue = format;
    for (let key of ["year", "quarter"]) {
      formattedValue = formattedValue.replace(new RegExp(`[${key[0].toUpperCase()}]+`), (v) => {
        if (value === null) return "";

        let result;
        if (key === "quarter") {
          result = value[key] == null ? `QQ` : "Q" + this._slotMap[key].getFormattedValue();
        } else {
          result = value[key] == null ? this.#getMark(dn, key, v.length) : this._slotMap[key].getFormattedValue();
        }

        return result;
      });
    }
    return formattedValue;
  }
}

export default DateValue;
