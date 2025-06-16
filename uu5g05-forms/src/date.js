//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import DateInput from "./inputs/date-input.js";
//@@viewOff:imports

const Date = withFormInput(DateInput);
Date.Input = DateInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Date };
export default Date;
