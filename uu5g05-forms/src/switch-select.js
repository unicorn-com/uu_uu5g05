//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import SwitchSelectInput from "./inputs/switch-select-input.js";
import withExtensionInput from "./with-extension-input.js";
//@@viewOff:imports

const SwitchSelect = withFormInput(withExtensionInput(SwitchSelectInput));
SwitchSelect.Input = SwitchSelectInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { SwitchSelect };
export default SwitchSelect;
