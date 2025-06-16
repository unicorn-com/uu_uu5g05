import Slot from "../abstract/slot";

class YearSlot extends Slot {
  static KEY = "year";

  increase() {
    return super.getValue()
      ? this._updateValue(1, this.#getMin(), this.#getMax())
      : this.setValue(this.#getInitialValue());
  }

  decrease() {
    return super.getValue()
      ? this._updateValue(-1, this.#getMin(), this.#getMax())
      : this.setValue(this.#getInitialValue());
  }

  isReadOnly() {
    return this._min && this._max && this._min.year === this._max.year;
  }

  getValue() {
    return this.isReadOnly() ? this._min.year : super.getValue();
  }

  setValue(value) {
    if (this._isValidValue(value, this.#getMin(), this.#getMax())) return super.setValue(value);
  }

  #getMax() {
    return this._max?.year ?? 9999;
  }

  #getMin() {
    return this._min?.year ?? 1;
  }

  #getInitialValue() {
    let value = new Date().getFullYear();
    if (this._min) value = Math.max(this._min.year, value);
    if (this._max) value = Math.min(this._max.year, value);
    return value;
  }
}

export default YearSlot;
