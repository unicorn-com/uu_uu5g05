//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withAvailableValues from "../_internal/with-available-values.js";
//@@viewOff:imports

const FormSize = Uu5Forms.withFormItem(
  withAvailableValues(Uu5Forms.SwitchSelect, "SizeInput", ["FormSize", "label"], ["xxs", "xs", "s", "m", "l", "xl"]),
);
FormSize.defaultProps.initialValue = "m";

//@@viewOn:exports
export { FormSize };
export default FormSize;
//@@viewOff:exports
