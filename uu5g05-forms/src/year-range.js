//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import YearRangeInput from "./inputs/year-range-input.js";
//@@viewOff:imports

const YearRange = withFormInput(YearRangeInput);
YearRange.Input = YearRangeInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { YearRange };
export default YearRange;
