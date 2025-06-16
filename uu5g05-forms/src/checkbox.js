//@@viewOn:imports
import { required } from "./config/validations.js";
import withValidationInput from "./with-validation-input.js";
import InputCheckbox from "./_internal/input-checkbox.js";
import CheckboxInput from "./inputs/checkbox-input.js";
import RadioInput from "./inputs/radio-input.js";
import withValidationMap from "./with-validation-map.js";
//@@viewOff:imports

function isValidValue(value) {
  return value != null && value !== "" && value !== false;
}

const Checkbox = withValidationMap(withValidationInput(InputCheckbox, isValidValue), { required: required() });

// delete props which are not on API
["_formattedValue"].forEach((prop) => {
  delete Checkbox.propTypes[prop];
  delete Checkbox.defaultProps[prop];
});

Checkbox.Input = CheckboxInput;
Checkbox.RadioInput = RadioInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Checkbox };
export default Checkbox;
