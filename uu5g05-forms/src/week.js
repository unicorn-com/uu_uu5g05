//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import WeekInput from "./inputs/week-input.js";
//@@viewOff:imports

const Week = withFormInput(WeekInput);
Week.Input = WeekInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Week };
export default Week;
