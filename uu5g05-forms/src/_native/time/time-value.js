import { UuDateTime } from "uu_i18ng01";
import FormatValue from "../abstract/format-value";
import HourSlot from "./hour-slot";
import MinuteSlot from "./minute-slot";
import SecondSlot from "./second-slot";
import PeriodSlot from "./period-slot";

class TimeValue extends FormatValue {
  static VALID_CHARS = "Hhmsa";

  static parseValue(valueStr, format) {
    return valueStr;
  }

  static #format({ hour, minute, second }, hourMs, timeZone = "UTC") {
    if (hourMs) {
      return new UuDateTime(hourMs, timeZone).setMinute(minute, second ?? 0, 0).toIsoString();
    } else {
      return [hour, minute, second]
        .filter((v) => v != null)
        .map((v) => String(v).padStart(2, "0"))
        .join(":");
    }
  }

  static #splitValueToList(value) {
    return [...value.match(/(\d{1,2}|[Hh]{1,2}|m{1,2}|s{1,2}|a{1,2}|[AP]M)/g)];
  }

  static #parseValueToObject(value, date, timeZone) {
    let hour, minute, second, uuDateTime;

    if (value) {
      if (value.includes("T")) {
        uuDateTime = new UuDateTime(value, timeZone);
        hour = uuDateTime.getHour();
        minute = uuDateTime.getMinute();
        second = uuDateTime.getSecond();
      } else {
        const [h, m, s] = value.split(":");

        hour = parseInt(h, 10);
        minute = parseInt(m, 10);
        second = s ? parseInt(s, 10) : 0;

        uuDateTime = new UuDateTime(date, timeZone).setHour(hour, minute, second, 0);
      }
    }

    return { hour, minute, second, uuDateTime };
  }

  #date;
  #timeZone;

  constructor(
    value,
    format,
    inputRef,
    { min: minValue, max: maxValue, step, lang, date, timeZone, ...otherProps } = {},
    browserName,
  ) {
    timeZone ??= date ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
    const min = minValue ? TimeValue.#parseValueToObject(minValue, date, timeZone) : null;
    const max = maxValue ? TimeValue.#parseValueToObject(maxValue, date, timeZone) : null;

    const valueObject = TimeValue.#parseValueToObject(value, date, timeZone);

    const slotList = TimeValue.#splitValueToList(format).map((v) => {
      const Class =
        v.startsWith("H") || v.startsWith("h")
          ? HourSlot
          : v.startsWith("m")
            ? MinuteSlot
            : v.startsWith("s")
              ? SecondSlot
              : PeriodSlot;
      return new Class(v, format.indexOf(v), valueObject[Class.KEY], inputRef, {
        ...otherProps,
        min,
        max,
        step,
        date,
        timeZone,
      });
    });

    super(format, slotList, inputRef, { min, max, step, lang }, browserName);

    this.#date = date;
    this.#timeZone = timeZone;

    if (value && this._slotMap.period) this._slotMap.period.setValue(this._slotMap.hour.getValue() < 12 ? "AM" : "PM");
  }

  checkSeparator(key) {
    const chars = [":"];
    if (chars.includes(key) && this._activeSlot.getValue() != null) this.selectNext();
  }

  increase() {
    const hour = this._slotMap.hour.getValue();
    this._activeSlot.increase({
      hour,
      minute: this._slotMap.minute.getValue({ hour }),
    });
    this.#updateHourSlot();
    return this.getValue();
  }

  decrease() {
    const hour = this._slotMap.hour.getValue();
    this._activeSlot.decrease({
      hour,
      minute: this._slotMap.minute.getValue({ hour }),
    });
    this.#updateHourSlot();
    return this.getValue();
  }

  write(value) {
    if (this._activeSlot.key !== "period" && value != null) {
      this._tempValue += value;
      this._tempValue = this._tempValue.slice(-2); // hour, minute and second could be max with 2 digits

      const prevValue = this._activeSlot.getValue();
      const newValue = +this._tempValue;

      if (!this._activeSlot.format.includes("h") || (newValue > 0 && newValue <= 12)) {
        this._activeSlot.setValue(newValue, {
          hour: this._slotMap.hour.getValue(),
          minute: this._slotMap.minute.getValue(),
        });

        this.#updateHourSlot();
      }

      if (prevValue !== this._activeSlot.getValue()) {
        if (
          this._activeSlot.isMaxChars({
            hour: this._slotMap.hour.getValue(),
            minute: this._slotMap.minute.getValue(),
          })
        )
          this.selectNext();
        return this.getValue();
      }
    }
  }

  getValue() {
    let hour;
    const valueList = this._slotList.map((slot) => {
      if (slot.key === "hour") hour = slot.getValue();
      if (slot.key === "minute") return [slot.key, slot.getValue({ hour })]; // Pass hour from HourSlot to check minute minimum
      return [slot.key, slot.getValue()];
    });
    return Object.fromEntries(valueList);
  }

  setValue(value) {
    const newValue = TimeValue.#parseValueToObject(value, this.#date, this.#timeZone);
    if (this._slotMap.period) newValue.period = newValue.hour < 12 ? "AM" : "PM";
    const result = super.setValue(newValue);
    if (value != null && value.includes("T")) this._slotMap.hour.setTime(newValue.uuDateTime.getTime());
    return result;
  }

  toIsoString() {
    if (this.isCompleted()) {
      return TimeValue.#format(this.getValue(), this.#date ? this._slotMap.hour.getTime() : undefined, this.#timeZone);
    } else {
      return undefined;
    }
  }

  validate() {
    const { hour, minute, second } = this.getValue();
    const uuDateTime = new UuDateTime(this.#date, this.#timeZone).setHour(hour || 0, minute || 0, second || 0, 0);
    if (hour == null || minute == null || (this.#isDisplaySecond() && second == null)) return "badValue";
    else if (this._min && UuDateTime.compare(uuDateTime, this._min.uuDateTime) < 0) return "min";
    else if (this._max && UuDateTime.compare(uuDateTime, this._max.uuDateTime) > 0) return "max";
    else if (this._step > 0 && !this.#isValidStep(uuDateTime)) return "step";
  }

  setMin(min) {
    return super.setMin(min ? TimeValue.#parseValueToObject(min, this.#date, this.#timeZone) : null);
  }

  setMax(max) {
    return super.setMax(max ? TimeValue.#parseValueToObject(max, this.#date, this.#timeZone) : null);
  }

  setDate(date) {
    this._slotMap.hour.setDate(date);
    this.#date = date;
    return this;
  }

  setTimeZone(timeZone) {
    this._slotMap.hour.setTimeZone(timeZone);
    this.#timeZone = timeZone;
    return this;
  }

  format() {
    const { hour, period } = this.getValue();
    let formattedValue = this._format;

    formattedValue = formattedValue.replace(/[Hh]+/, this._slotMap.hour.getFormattedValue());
    if (hour != null && period != null) {
      formattedValue = formattedValue.replace(/[a]+/, () => (hour >= 12 ? "PM" : "AM"));
    }

    formattedValue = formattedValue.replace(/[m]+/, this._slotMap.minute.getFormattedValue({ hour }));

    if (this._slotMap.second) formattedValue = formattedValue.replace(/[s]+/, this._slotMap.second.getFormattedValue());

    super._updateIndexes();

    return formattedValue;
  }

  #isValidStep(valueUuDateTime) {
    const step = this._step || 1;
    const minUuDate = this._min?.uuDateTime || new UuDateTime(undefined, "UTC").setHour(0, 0, 0, 0);
    return (valueUuDateTime.getTime() - minUuDate.getTime()) % (step * 1000) === 0;
  }

  #isDisplaySecond() {
    return this._format.includes("s");
  }

  #updateHourSlot() {
    if (this._activeSlot.key === "period") {
      const hourValue = this._slotMap.hour.getValue();
      const periodValue = this._slotMap.period.getValue();
      if (hourValue != null) this._slotMap.hour.setValue(periodValue === "AM" ? hourValue % 12 : (hourValue + 12) % 24);
    } else if (this._activeSlot.key === "hour" && this._slotMap.period) {
      const hourValue = this._slotMap.hour.getValue();
      const periodValue = this._slotMap.period.getValue();
      if (periodValue == null) this._slotMap.period.setValue(hourValue < 12 ? "AM" : "PM");
    }
  }
}

export default TimeValue;
