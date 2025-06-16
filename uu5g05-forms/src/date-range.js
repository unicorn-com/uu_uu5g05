//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import DateRangeInput from "./inputs/date-range-input.js";
//@@viewOff:imports

const DateRange = withFormInput(DateRangeInput);
DateRange.Input = DateRangeInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { DateRange };
export default DateRange;
