import { UuDateTime } from "uu_i18ng01";
import Slot from "../abstract/slot";

export const HOUR_MS = 60 * 60 * 1000;

class HourSlot extends Slot {
  static KEY = "hour";

  #date;
  #timeZone;
  #hideSummerPrefix;
  #hideWinterPrefix;

  constructor(
    format,
    index,
    value,
    inputRef,
    { step: stepS, date, timeZone, hideSummerPrefix, hideWinterPrefix, ...opts },
  ) {
    const step = stepS % 3600 === 0 ? stepS / 3600 : 1;

    let valueMs;
    if (date && value != null) valueMs = new UuDateTime(date, timeZone).setHour(value).getTime();

    super(format, index, valueMs ?? value, inputRef, { step, ...opts });

    this.#date = date;
    this.#timeZone = timeZone;
    this.#hideSummerPrefix = hideSummerPrefix;
    this.#hideWinterPrefix = hideWinterPrefix;
  }

  increase() {
    return this._updateValue(this.#getStep(), this.#getMin(), this.#getMax());
  }

  decrease() {
    return this._updateValue(-this.#getStep(), this.#getMin(), this.#getMax());
  }

  isMaxChars() {
    return super.isMaxChars(this._max?.hour ?? 23);
  }

  isReadOnly() {
    return this._min && this._max && this._min.hour === this._max.hour;
  }

  getValue() {
    let value;
    if (this.isReadOnly()) {
      value = this._min.hour;
    } else {
      value = super.getValue();
      if (this.#date && value != null) {
        value = new UuDateTime(value, this.#timeZone).getHour();
      }
    }
    return value;
  }

  getFormattedValue() {
    let localHour = this.getValue();
    if (localHour == null) {
      return this._getMark();
    } else {
      let prefix = "";
      if (this.#date) {
        const hourMs = this.getTime();
        localHour = new UuDateTime(hourMs, this.#timeZone).getHour();

        if (!this.#hideWinterPrefix && new UuDateTime(hourMs - HOUR_MS, this.#timeZone).getHour() === localHour) {
          prefix = "❅";
        } else if (
          !this.#hideSummerPrefix &&
          new UuDateTime(hourMs + HOUR_MS, this.#timeZone).getHour() === localHour
        ) {
          prefix = "☼";
        }
      }
      const value = this.format.includes("h") ? prefix + (localHour % 12 || 12) : prefix + localHour;
      return String(value).padStart(this.format.length, "0");
    }
  }

  getTime() {
    if (this.#date) {
      let read = this.isReadOnly();
      let value = read ? this._min.uuDateTime.clone().setMinute(0, 0, 0).getTime() : super.getValue();
      return value;
    }
  }

  checkRange(value) {
    if (value === 1 || value === 2) {
      const min = this._min?.hour;
      const max = this._max?.hour;
      const low = value * 10;
      const height = low + 10;
      return (min >= low && min < height) || (min <= low && max >= low);
    } else {
      return false;
    }
  }

  setValue(origValue) {
    let value = origValue;
    if (this.#date && value != null) value = new UuDateTime(this.#date, this.#timeZone).setHour(value).getTime();
    if (this._isValidValue(value, this.#getMin(), this.#getMax(), this.#getStep()) || this.checkRange(origValue))
      return super.setValue(value);
  }

  setTime(value) {
    if (value % HOUR_MS) value = Math.floor(value / HOUR_MS) * HOUR_MS; // timeMs must be just with hours without minutes
    if (this._isValidValue(value, this.#getMin(), this.#getMax(), this.#getStep())) return super.setValue(value);
  }

  setStep(stepS) {
    return super.setStep(stepS % 3600 === 0 ? stepS / 3600 : 1);
  }

  setDate(date) {
    this.#date = date;
    this.setValue(this.getValue());
    return this;
  }

  setTimeZone(timeZone) {
    this.#timeZone = timeZone;
    this.setValue(this.getValue());
    return this;
  }

  #getMax() {
    let max;
    if (this.#date) {
      if (this._max) {
        max = this._max.uuDateTime.clone().setMinute(0, 0, 0).getTime();
      } else {
        max = new UuDateTime(this.#date, this.#timeZone).endOf("day").setMinute(0, 0, 0).getTime();
      }
    } else {
      max = this._max?.hour ?? 23;
    }
    return max;
  }

  #getMin() {
    let min;
    if (this.#date) {
      if (this._min) {
        min = this._min.uuDateTime.clone().setMinute(0, 0, 0).getTime();
      } else {
        min = new UuDateTime(this.#date, this.#timeZone).getTime();
      }
    } else {
      min = this._min?.hour ?? 0;
    }
    return min;
  }

  #getStep() {
    return this.#date ? this._step * HOUR_MS : this._step;
  }
}

export default HourSlot;
