// FIXME delete nefunguje, pokud to udělám nad slotem, když není zadaná hodnota celý, tzn. 12/MM/YYYY na 12 nefunguje,
//  ale když pak udělám increase na MM, tak se ten delete projeví zpětně na tom DD.
class FormatValue {
  static parseValue(string, format) {
    console.error("TODO: implement parseValue");
  }

  #format;
  #selectionFormat;
  #inputRef;
  #browserName;
  #activeSlot;
  #tempValue = "";
  #min;
  #max;
  #step;
  #lang;
  #slotList;
  #slotMap = {};
  #slotFormatMap = {};

  constructor(format, slotList, inputRef, { min, max, step, lang }, browserName = undefined, { selectionFormat } = {}) {
    this.#format = format;
    this.#selectionFormat = selectionFormat;
    this.#inputRef = inputRef;
    this.#browserName = browserName;

    this.#min = min;
    this.#max = max;
    this.#step = step;
    this.#lang = lang;

    this.#slotList = slotList;

    slotList.forEach((slot) => {
      this.#slotMap[slot.key] = slot;
      this.#slotFormatMap[slot.format] = slot;
    });
  }

  isCompleted() {
    return !this.#slotList.find((slot) => !slot.isReadOnly() && slot.getValue() == null);
  }

  isEmpty() {
    return !this.#slotList.find((slot) => !slot.isReadOnly() && slot.getValue() != null);
  }

  validate() {
    console.error("TODO: implement validate");
  }

  checkSeparator(key) {
    console.error("TODO: implement checkSeparator", key);
  }

  format() {
    console.error("TODO: implement format");
  }

  getValue() {
    return Object.fromEntries(this.#slotList.map((slot) => [slot.key, slot.getValue()]));
  }

  setValue(value) {
    this.#slotList.forEach((slot) => slot.setValue(value[slot.key]));
    if (this.isEmpty()) {
      // clear activeSlot => automatically set first slot as active
      this.#activeSlot = this.#slotList[0];
      this.#tempValue = "";
      this.#activeSlot?.clear();
    }
    return this;
  }

  write(value) {
    console.error("TODO: implement write");
  }

  increase() {
    console.error("TODO: implement increase");
  }

  decrease() {
    console.error("TODO: implement decrease");
  }

  clear() {
    if (this.#isSelectAll()) {
      this.#slotList.forEach((slot) => slot.clear());
      this.#setActiveSlot(0);
    } else {
      this.#activeSlot.clear();
    }
    return this.getValue();
  }

  toIsoString() {
    console.error("TODO: implement toIsoString");
  }

  focus() {
    //if (!this.#isSelectAll()) { // comment because after tab, all is selected, but for increase, first slot should be active
    let slot;
    if (this.#activeSlot || !this.isEmpty()) {
      slot = this.#slotFormatMap[this.#getSlotFormatFromSelection()];
      if (slot?.isReadOnly()) slot = null;
    }
    slot ||= this.#slotList.find((slot) => !slot.isReadOnly());

    this.#setActiveSlot(slot);
    //}
    return this;
  }

  blur() {
    this.#clearSelection();
    this.#activeSlot = null;
    return this;
  }

  select() {
    if (!this.#activeSlot) this.focus();
    else this.#activeSlot.select();
    return this;
  }

  selectPrevious() {
    let actualIndex = this._actualSlotIndex;
    let newSlotIndex;
    for (let i = actualIndex - 1; i >= 0; i--) {
      if (!this.#slotList[i].isReadOnly()) {
        newSlotIndex = i;
        break;
      }
    }
    if (newSlotIndex != null) this.#setActiveSlot(newSlotIndex);
    return this;
  }

  selectNext() {
    let actualIndex = this._actualSlotIndex;
    let newSlotIndex;
    for (let i = actualIndex + 1; i < this.#slotList.length; i++) {
      if (!this.#slotList[i].isReadOnly()) {
        newSlotIndex = i;
        break;
      }
    }
    if (newSlotIndex != null) this.#setActiveSlot(newSlotIndex);
    return this;
  }

  setMin(min) {
    this.#min = min;
    this.#slotList.forEach((slot) => slot.setMin(min));
    return this;
  }

  setMax(max) {
    this.#max = max;
    this.#slotList.forEach((slot) => slot.setMax(max));
    return this;
  }

  setStep(step) {
    this.#step = step;
    this.#slotList.forEach((slot) => slot.setStep(step));
    return this;
  }

  setLang(lang) {
    this.#lang = lang;
    this.#slotList.forEach((slot) => slot.setLang(lang));
    return this;
  }

  setSelectionFormat(format) {
    this.#selectionFormat = format;
    return;
  }

  setActiveSlot(slot) {
    this.#setActiveSlot(slot);
    return this;
  }

  get _actualSlotIndex() {
    return this.#slotList.indexOf(this.#activeSlot);
  }

  get _format() {
    return this.#format;
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

  get _activeSlot() {
    return this.#activeSlot;
  }

  get _slotMap() {
    return this.#slotMap;
  }

  get _tempValue() {
    return this.#tempValue;
  }

  get _slotList() {
    return this.#slotList;
  }

  set _tempValue(value) {
    this.#tempValue = value;
  }

  _getLang() {
    return this.#lang;
  }

  _updateIndexes() {
    let inc = 0;
    this.#slotList.forEach((slot) => {
      inc ? slot.updateIndex(inc) : slot.setInitialIndex();
      if (slot.getValue() != null) inc += slot.getFormattedValue().length - slot.format.length;
    });
  }

  #setActiveSlot(slot) {
    if (typeof slot === "number") slot = this.#slotList[slot];
    this.#activeSlot = slot;
    this.#tempValue = "";
    this.#activeSlot?.select();
  }

  #getNormalizedFormat() {
    let format = this.#selectionFormat || this.#format;

    this.#slotList.forEach((it) => {
      const slotValue = it.getValue();
      if (slotValue == null) return;
      const strSlotValue = slotValue.toString();
      const slotFormat = it.format;
      format = format.replace(new RegExp(`${slotFormat}+`), (v) => {
        if (strSlotValue.length === v.length) return v;
        return v.padStart(strSlotValue.length, v);
      });
    });

    return format;
  }

  #getSlotFormatFromSelection() {
    let index = this.isEmpty() ? 0 : this.#inputRef.current.selectionStart;

    // Normalized format is important for shorter format e.g. D instead of DD but value can also have two chars.
    const normalizedFormat = this.#getNormalizedFormat();

    if (normalizedFormat.length === index) index = 0;
    let char;
    // find first valid char from format (D | M | Y)
    for (let i = 0; i < normalizedFormat.length; i++) {
      let newIndex = index;
      if (i % 2 === 0) newIndex -= i;
      else newIndex += i;
      char = normalizedFormat[newIndex];
      if (new RegExp(`^[${this.constructor.VALID_CHARS}]$`).test(char)) break;
      else {
        // click to the number -> cursor is set to end of the number, but it should be still click to the number event if index is for separator
        char = normalizedFormat[newIndex - 1];
        if (new RegExp(`^[${this.constructor.VALID_CHARS}]$`).test(char)) break;
      }
    }

    const format = this.#selectionFormat || this.#format;
    return format.match(new RegExp(char + "+"))?.[0];
  }

  #isSelectAll() {
    return this.#inputRef.current.selectionStart === 0 && this.#inputRef.current.selectionEnd >= this._format.length;
  }

  #clearSelection() {
    if (this.#browserName === "safari") {
      // Safari has problem with calling setSelectionRange in running blur effect
      // Issue: https://bugs.webkit.org/show_bug.cgi?id=224425
      // Workaround is to temporally remove value
      const tempValue = this.#inputRef.current.value;
      this.#inputRef.current.value = "";
      this.#inputRef.current.value = tempValue;
    } else {
      this.#inputRef.current.setSelectionRange(0, 0);
    }
  }
}

export default FormatValue;
