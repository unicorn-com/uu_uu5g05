//@@viewOn:imports
import withExtensionInput from "./with-extension-input.js";
import withFormInput from "./with-form-input.js";
import NumberInput from "./inputs/number-input.js";
//@@viewOff:imports

const Number = withFormInput(withExtensionInput(NumberInput));
Number.Input = NumberInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Number };
export default Number;
