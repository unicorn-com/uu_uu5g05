//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import MonthRangeInput from "./inputs/month-range-input.js";
//@@viewOff:imports

const MonthRange = withFormInput(MonthRangeInput);
MonthRange.Input = MonthRangeInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { MonthRange };
export default MonthRange;
