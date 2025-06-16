//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import SelectInput from "./inputs/select-input.js";
import SelectField from "./select-field.js";
import SelectOptions from "./select-options.js";
import SelectSelectedOptions from "./select-selected-options.js";
//@@viewOff:imports

const Select = withFormInput(SelectInput);
Select.Input = SelectInput;
Select.Field = SelectField;
Select.Options = SelectOptions;
Select.SelectedOptions = SelectSelectedOptions;

//@@viewOn:helpers
//@@viewOff:helpers

export { Select };
export default Select;
