import Slot from "../abstract/slot.js";

class QuarterSlot extends Slot {
  static KEY = "quarter";

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
    return this._min && this._max && this._min.year === this._max.year && this._min.quarter === this._max.quarter;
  }

  getValue() {
    return this.isReadOnly() ? this._min.quarter : super.getValue();
  }

  setValue(value, { year } = {}) {
    if (this._isValidValue(value, this.#getMin(year), this.#getMax(year))) return super.setValue(value);
  }

  #getMax(year) {
    return this._max && this._max.year === year ? this._max.quarter : 4;
  }

  #getMin(year) {
    return this._min && this._min.year === year ? this._min.quarter : 1;
  }
}

export default QuarterSlot;
