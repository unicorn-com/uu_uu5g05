//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withAvailableValues from "../_internal/with-available-values.js";
//@@viewOff:imports

const FormFullTextSearchPriority = Uu5Forms.withFormItem(
  withAvailableValues(
    Uu5Forms.SwitchSelect,
    "FullTextSearchPriorityIpnut",
    ["FormFullTextSearchPriority", "label"],
    [undefined, 0, 1, 2, 3, 4, 5],
    ["FormFullTextSearchPriority", "message"],
  ),
);

//@@viewOn:exports
export { FormFullTextSearchPriority };
export default FormFullTextSearchPriority;
//@@viewOff:exports
