//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import TextSelectInput from "./inputs/text-select-input.js";
import TextSelectField from "./text-select-field.js";
import TextSelectOptions from "./text-select-options.js";
import TextSelectSelectedOptions from "./text-select-selected-options.js";
//@@viewOff:imports

const TextSelect = withFormInput(TextSelectInput);
TextSelect.Input = TextSelectInput;
TextSelect.Field = TextSelectField;
TextSelect.Options = TextSelectOptions;
TextSelect.SelectedOptions = TextSelectSelectedOptions;

export { TextSelect };
export default TextSelect;
