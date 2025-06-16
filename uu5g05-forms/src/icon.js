//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import IconInput from "./inputs/icon-input.js";
import IconPicker from "./_internal/icon-picker.js";
//@@viewOff:imports

const Icon = withFormInput(IconInput);
Icon.Input = IconInput;
Icon.Picker = IconPicker;

//@@viewOn:helpers
//@@viewOff:helpers

export { Icon };
export default Icon;
