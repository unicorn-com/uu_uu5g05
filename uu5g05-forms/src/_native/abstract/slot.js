class Slot {
  static #clampValue(value, diff, min, max) {
    let newV = value + diff;
    if (min > newV) newV = min === value ? max : min;
    else if (max < newV) newV = max === value ? min : max;
    return newV;
  }

  #format;
  #index;
  #initialIndex;
  #value;
  #inputRef;
  #min;
  #max;
  #step;
  #lang;

  constructor(format, index, value, inputRef, { min, max, step = 1, lang }) {
    this.#format = format;
    this.#initialIndex = this.#index = index;
    this.#value = value;
    this.#inputRef = inputRef;
    this.#min = min;
    this.#max = max;
    this.#step = step;
    this.#lang = lang;
  }

  get key() {
    return this.constructor.KEY;
  }

  get format() {
    return this.#format;
  }

  getValue() {
    return this.#value;
  }

  getFormattedValue() {
    return this.getValue() == null ? this._getMark() : String(this.getValue()).padStart(this.format.length, "0");
  }

  setValue(value) {
    return (this.#value = value);
  }

  increase(step, min, max) {
    if (step > 1) {
      const value = this.getValue();

      const getMin = () => {
        const diff = min % step;
        return diff === 0 ? min : min + step - diff;
      };

      let newValue;
      if (value == null) {
        newValue = min;
      } else {
        newValue = value + step;
        if (newValue > max) {
          if (max !== value && max % step === 0) {
            newValue = max;
          } else {
            newValue = getMin();
          }
        } else {
          const diff = newValue % step;
          if (diff > 0) newValue -= diff;
        }
      }
      return this.setValue(newValue);
    } else {
      return this._updateValue(step, min, max);
    }
  }

  decrease(step, min, max) {
    if (step > 1) {
      const value = this.getValue();

      const getMax = () => {
        const diff = max % step;
        return diff === 0 ? max : max - diff;
      };

      let newValue;
      if (value == null) {
        newValue = max;
      } else {
        newValue = value - step;
        if (newValue < min) {
          if (min !== value && min % step === 0) {
            newValue = min;
          } else {
            newValue = getMax();
          }
        } else {
          const diff = newValue % step;
          if (diff > 0) newValue += step - diff;
        }
      }
      return this.setValue(newValue);
    } else {
      return this._updateValue(-step, min, max);
    }
  }

  clear() {
    this.setValue(undefined);
    return this;
  }

  select() {
    this.#inputRef.current.setSelectionRange(this.#index, this.#index + this.getFormattedValue().length);
    return this;
  }

  isReadOnly() {
    console.error("TODO: implement isReadOnly");
  }

  isMaxChars(max) {
    const value = this.getValue();
    return value != null && ((value + "").length === (max + "").length || +(value + "0") > max);
  }

  updateIndex(diff) {
    this.#index = this.#initialIndex + diff;
    return this;
  }

  setInitialIndex() {
    this.#index = this.#initialIndex;
    return this;
  }

  updateInitialIndex(initialIndex) {
    this.#initialIndex = initialIndex;
    return this;
  }

  setMin(min) {
    this.#min = min;
    return this;
  }

  setMax(max) {
    this.#max = max;
    return this;
  }

  setStep(step = 1) {
    this.#step = step;
    return this;
  }

  setLang(lang) {
    this.#lang = lang;
  }

  get _min() {
    return this.#min;
  }

  get _max() {
    return this.#max;
  }

  get _step() {
    return this.#step;
  }

  get _lang() {
    return this.#lang;
  }

  _updateValue(diff, min, max) {
    return (this.#value = this.#value != null ? Slot.#clampValue(this.#value, diff, min, max) : diff > 0 ? min : max);
  }

  _isValidValue(value, min, max, step = 1) {
    let isValid = false;
    if (value) {
      const valueStr = value + "";
      for (let i = min; i <= max; i += step) {
        if (String(i).startsWith(valueStr)) {
          isValid = true;
          break;
        }
      }
    } else {
      isValid = true;
    }

    return isValid;
  }

  _getMark() {
    const dn = new Intl.DisplayNames(this.#lang, { type: "dateTimeField" });
    return dn.of(this.key)[0].toUpperCase().repeat(this.format.length);
  }
}

export default Slot;
