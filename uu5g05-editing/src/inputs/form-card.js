//@@viewOn:imports
import { Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import withAvailableValues from "../_internal/with-available-values.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const FormCard = Uu5Forms.withFormItem(
  withAvailableValues(
    Uu5Forms.SwitchSelect,
    "CardInput",
    ["FormCard", "label"],
    [
      { value: "full", children: <Lsi import={importLsi} path={["FormCard", "full"]} /> },
      { value: "content", children: <Lsi import={importLsi} path={["FormCard", "content"]} /> },
      { value: "none", children: <Lsi import={importLsi} path={["FormCard", "none"]} /> },
    ],
    undefined,
    true,
  ),
);
FormCard.defaultProps.initialValue = "none";

//@@viewOn:exports
export { FormCard };
export default FormCard;
//@@viewOff:exports
