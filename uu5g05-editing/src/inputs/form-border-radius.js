//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withAvailableValues from "../_internal/with-available-values.js";
//@@viewOff:imports

const FormBorderRadius = Uu5Forms.withFormItem(
  withAvailableValues(
    Uu5Forms.SwitchSelect,
    "BorderRadiusInput",
    ["FormBorderRadius", "label"],
    ["none", "elementary", "moderate", "expressive", "full"],
    undefined,
    true,
  ),
);
FormBorderRadius.defaultProps.initialValue = "none";

//@@viewOn:exports
export { FormBorderRadius };
export default FormBorderRadius;
//@@viewOff:exports
