//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withAvailableValues from "../_internal/with-available-values.js";
//@@viewOff:imports

const FormSignificance = Uu5Forms.withFormItem(
  withAvailableValues(
    Uu5Forms.SwitchSelect,
    "SignificanceInput",
    ["FormSignificance", "label"],
    [undefined, "common", "highlighted", "distinct", "subdued"],
    undefined,
    true,
  ),
);
FormSignificance.defaultProps.initialValue = "common";

//@@viewOn:exports
export { FormSignificance };
export default FormSignificance;
//@@viewOff:exports
