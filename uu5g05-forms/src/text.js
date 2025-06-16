//@@viewOn:imports
import withExtensionInput from "./with-extension-input.js";
import withFormInput from "./with-form-input.js";
import TextInput from "./inputs/text-input.js";
//@@viewOff:imports

const Text = withFormInput(withExtensionInput(TextInput));
Text.Input = TextInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Text };
export default Text;
