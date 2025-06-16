//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import ColorInput from "./inputs/color-input.js";
import ColorPicker from "./_internal/color/color-picker.js";
//@@viewOff:imports

const Color = withFormInput(ColorInput);
Color.Input = ColorInput;
Color.Picker = ColorPicker;

//@@viewOn:helpers
//@@viewOff:helpers

export { Color };
export default Color;
