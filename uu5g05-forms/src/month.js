//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import MonthInput from "./inputs/month-input.js";
//@@viewOff:imports

const Month = withFormInput(MonthInput);
Month.Input = MonthInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Month };
export default Month;
