import { UuDateTime } from "uu_i18ng01";
import Slot from "../abstract/slot";

export const DAY_MS = 24 * 60 * 60 * 1000;

class DaySlot extends Slot {
  static KEY = "day";

  increase({ year, month } = {}) {
    const step = this._step;
    const min = this.#getMin(year, month);
    const max = this.#getMax(year, month);

    if (step > 1 && year && month) {
      const value = this.getValue();

      const minMs = new UuDateTime(this._min ? this._min : "1970-01-01", "UTC").getTime();
      const stepMs = step * DAY_MS;

      const getMin = () => {
        const curMinMs = new UuDateTime({ year, month, day: min }, "UTC").getTime();
        const diffMs = (curMinMs - minMs) % stepMs;
        return diffMs === 0 ? min : min + (stepMs - diffMs) / DAY_MS;
      };

      let newValue;
      if (value == null) {
        newValue = getMin();
      } else {
        newValue = value + step;
        if (newValue > max) {
          const curMaxMs = new UuDateTime({ year, month, day: max }, "UTC").getTime();
          if (max !== value && (curMaxMs - minMs) % stepMs === 0) {
            newValue = max;
          } else {
            newValue = getMin();
          }
        } else {
          const curValueMs = new UuDateTime({ year, month, day: value }, "UTC").getTime();
          const newValueMs = curValueMs + stepMs;
          const diffMs = (newValueMs - minMs) % stepMs;
          if (diffMs > 0) newValue -= diffMs / DAY_MS;
        }
      }
      return this.setValue(newValue);
    } else {
      return this._updateValue(step, min, max);
    }
  }

  decrease({ year, month } = {}) {
    const step = this._step;
    const min = this.#getMin(year, month);
    const max = this.#getMax(year, month);

    if (step > 1 && year && month) {
      const value = this.getValue();

      const minMs = new UuDateTime(this._min ? this._min : "1970-01-01", "UTC").getTime();
      const stepMs = step * DAY_MS;

      const getMax = () => {
        const curMaxMs = new UuDateTime({ year, month, day: max }, "UTC").getTime();
        const diffMs = (curMaxMs - minMs) % stepMs;
        return diffMs === 0 ? max : max - diffMs / DAY_MS;
      };

      let newValue;
      if (value == null) {
        newValue = getMax();
      } else {
        newValue = value - step;
        if (newValue < min) {
          const curMinMs = new UuDateTime({ year, month, day: min }, "UTC").getTime();
          if (min !== value && (curMinMs - minMs) % stepMs === 0) {
            newValue = min;
          } else {
            newValue = getMax();
          }
        } else {
          const curValueMs = new UuDateTime({ year, month, day: value }, "UTC").getTime();
          const newValueMs = curValueMs - stepMs;
          const diffMs = (newValueMs - minMs) % stepMs;
          if (diffMs > 0) newValue = value - diffMs / DAY_MS;
        }
      }
      return this.setValue(newValue);
    } else {
      return this._updateValue(-step, min, max);
    }
  }

  isMaxChars({ year, month } = {}) {
    return super.isMaxChars(this.#getMax(year, month));
  }

  isReadOnly() {
    //Note: DaySlot should not be set to readOnly even when the min and max values are the same. It must still be possible to focus on the DaySlot.
    return false;
  }

  setValue(value, { year, month } = {}) {
    if (this._isValidValue(value, this.#getMin(year, month), this.#getMax(year, month))) return super.setValue(value);
  }

  #getMax(year, month) {
    let max;

    if (this._max && this._max.year === year && this._max.month === month) max = this._max.day;
    else max = 31;

    return max;
  }

  #getMin(year, month) {
    return this._min && this._min.year === year && this._min.month === month ? this._min.day : 1;
  }
}

export default DaySlot;
