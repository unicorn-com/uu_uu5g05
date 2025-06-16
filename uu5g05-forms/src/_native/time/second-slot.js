import Slot from "../abstract/slot";

class SecondSlot extends Slot {
  static KEY = "second";

  constructor(format, index, value, inputRef, { step, ...opts }) {
    step = step <= 60 ? step : 1;
    super(format, index, value, inputRef, { ...opts, step });
  }

  increase({ hour, minute } = {}) {
    const step = this._step;
    const min = this.#getMin(hour, minute);
    const max = this.#getMax(hour, minute);

    return super.increase(step, min, max);
  }

  decrease({ hour, minute } = {}) {
    const step = this._step;
    const min = this.#getMin(hour, minute);
    const max = this.#getMax(hour, minute);

    return super.decrease(step, min, max);
  }

  isMaxChars({ hour, minute } = {}) {
    return super.isMaxChars(this.#getMax(hour, minute));
  }

  isReadOnly() {
    return (
      (this._min &&
        this._max &&
        this._min.hour === this._max.hour &&
        this._min.minute === this._max.minute &&
        this._min.second === this._max.second) ||
      this._step >= 60
    );
  }

  getValue() {
    return this.isReadOnly() ? this._min.second : super.getValue();
  }

  setValue(value, { hour, minute } = {}) {
    if (this._isValidValue(value, this.#getMin(hour, minute), this.#getMax(hour, minute))) return super.setValue(value);
  }

  #getMax(hour, minute) {
    return this._max && this._max.hour === hour && this._max.minute === minute ? this._max.second : 59;
  }

  #getMin(hour, minute) {
    return this._min && this._min.hour === hour && this._max.minute === minute ? this._min.second : 0;
  }
}

export default SecondSlot;
