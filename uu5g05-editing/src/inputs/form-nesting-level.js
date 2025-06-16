//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withAvailableValues from "../_internal/with-available-values.js";
//@@viewOff:imports

const FormNestingLevel = Uu5Forms.withFormItem(
  withAvailableValues(
    Uu5Forms.SwitchSelect,
    "NestingLevelInput",
    ["FormNestingLevel", "label"],
    [undefined, "areaCollection", "area", "boxCollection", "box", "spotCollection", "spot", "inline"],
    undefined,
    true,
  ),
);

//@@viewOn:exports
export { FormNestingLevel };
export default FormNestingLevel;
//@@viewOff:exports
