//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import DateTimeInput from "./inputs/date-time-input.js";
//@@viewOff:imports

const DateTime = withFormInput(DateTimeInput);
DateTime.Input = DateTimeInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { DateTime };
export default DateTime;
