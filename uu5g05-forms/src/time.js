//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import TimeInput from "./inputs/time-input.js";
//@@viewOff:imports

const Time = withFormInput(TimeInput);
Time.Input = TimeInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Time };
export default Time;
