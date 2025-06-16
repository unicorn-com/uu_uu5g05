//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import TextSelectAsyncInput from "./inputs/text-select-async-input.js";
import TextSelectField from "./text-select-field.js";
import TextSelectOptions from "./text-select-options.js";
import TextSelectSelectedOptions from "./text-select-selected-options.js";
//@@viewOff:imports

TextSelectOptions.defaultProps.height = "auto";

const TextSelectAsync = withFormInput(TextSelectAsyncInput);
TextSelectAsync.Input = TextSelectAsyncInput;
TextSelectAsync.Field = TextSelectField;
TextSelectAsync.Options = TextSelectOptions;
TextSelectAsync.SelectedOptions = TextSelectSelectedOptions;

export { TextSelectAsync };
export default TextSelectAsync;
