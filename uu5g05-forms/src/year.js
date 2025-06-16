//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import YearInput from "./inputs/year-input.js";
//@@viewOff:imports

const Year = withFormInput(YearInput);
Year.Input = YearInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Year };
export default Year;
