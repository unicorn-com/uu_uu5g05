import Slot from "../abstract/slot";

class PeriodSlot extends Slot {
  static KEY = "period";

  constructor(format, index, value, ...args) {
    super(format, index, value, ...args);
  }

  increase() {
    return this.setValue(this.getValue() === "AM" ? "PM" : "AM");
  }

  decrease() {
    return this.increase();
  }

  isMaxChars() {
    return false;
  }

  isReadOnly() {
    return false;
  }

  getFormattedValue() {
    return this.getValue();
  }
}

export default PeriodSlot;
