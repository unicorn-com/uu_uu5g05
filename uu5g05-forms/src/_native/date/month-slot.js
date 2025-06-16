import Slot from "../abstract/slot";
class MonthSlot extends Slot {
  static KEY = "month";

  increase({ year } = {}) {
    const step = this._step;
    const min = this.#getMin(year);
    const max = this.#getMax(year);

    return super.increase(step, min, max);
  }

  decrease({ year } = {}) {
    const step = this._step;
    const min = this.#getMin(year);
    const max = this.#getMax(year);

    return super.decrease(step, min, max);
  }

  isMaxChars({ year } = {}) {
    return super.isMaxChars(this.#getMax(year));
  }

  isReadOnly() {
    return this._min && this._max && this._min.year === this._max.year && this._min.month === this._max.month;
  }

  getValue() {
    return this.isReadOnly() ? this._min.month : super.getValue();
  }

  getFormattedValue() {
    if (this.format === "MMMM") {
      return this.getValue() == null
        ? this._getMark()
        : new Date(new Date().getFullYear(), this.getValue() - 1).toLocaleString(this._lang, { month: "long" });
    } else {
      return super.getFormattedValue();
    }
  }

  setValue(value, { year } = {}) {
    if (this._isValidValue(value, this.#getMin(year), this.#getMax(year))) return super.setValue(value);
  }

  #getMax(year) {
    return this._max && this._max.year === year ? this._max.month : 12;
  }

  #getMin(year) {
    return this._min && this._min.year === year ? this._min.month : 1;
  }
}

export default MonthSlot;
