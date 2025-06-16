import Slot from "../abstract/slot";

class MinuteSlot extends Slot {
  static KEY = "minute";

  constructor(format, index, value, inputRef, { step: stepS, ...opts }) {
    const step = stepS <= 3600 && stepS % 60 === 0 ? stepS / 60 : 1;
    super(format, index, value, inputRef, { ...opts, step });
  }

  increase({ hour } = {}) {
    const step = this._step;
    const min = this.#getMin(hour);
    const max = this.#getMax(hour);

    return super.increase(step, min, max);
  }

  decrease({ hour } = {}) {
    const step = this._step;
    const min = this.#getMin(hour);
    const max = this.#getMax(hour);

    return super.decrease(step, min, max);
  }

  isMaxChars({ hour } = {}) {
    return super.isMaxChars(this.#getMax(hour));
  }

  isReadOnly() {
    return (
      (this._min && this._max && this._min.hour === this._max.hour && this._min.minute === this._max.minute) ||
      this._step >= 60
    );
  }

  getValue({ hour } = {}) {
    return this.isReadOnly() ? this.#getMin(hour) : super.getValue();
  }

  getFormattedValue({ hour } = {}) {
    const value = this.getValue({ hour });
    return value == null ? this._getMark() : String(value).padStart(this.format.length, "0");
  }

  setValue(value, { hour } = {}) {
    if (this._isValidValue(value, this.#getMin(hour), this.#getMax(hour))) return super.setValue(value);
  }

  #getMax(hour) {
    return this._max && this._max.hour === hour ? this._max.minute : 59;
  }

  #getMin(hour) {
    return this._min && this._min.hour === hour ? this._min.minute : 0;
  }
}

export default MinuteSlot;
