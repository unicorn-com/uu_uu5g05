//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import QuarterInput from "./inputs/quarter-input.js";
//@@viewOff:imports

const Quarter = withFormInput(QuarterInput);
Quarter.Input = QuarterInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Quarter };
export default Quarter;
