//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import WeekRangeInput from "./inputs/week-range-input.js";
//@@viewOff:imports

const WeekRange = withFormInput(WeekRangeInput);
WeekRange.Input = WeekRangeInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { WeekRange };
export default WeekRange;
