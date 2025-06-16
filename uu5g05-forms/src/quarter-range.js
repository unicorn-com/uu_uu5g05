//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import QuarterRangeInput from "./inputs/quarter-range-input.js";
//@@viewOff:imports

const QuarterRange = withFormInput(QuarterRangeInput);
QuarterRange.Input = QuarterRangeInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { QuarterRange };
export default QuarterRange;
