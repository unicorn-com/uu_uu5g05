//@@viewOn:imports
import { Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import withDefaultProps from "../_internal/with-default-props.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const FormIdentificationType = Uu5Forms.withFormItem(
  withDefaultProps(Uu5Forms.SwitchSelect, "IdentificationTypeInput", ["FormIdentificationType", "label"], {
    itemList: [
      { value: "basic", children: <Lsi import={importLsi} path={["FormIdentificationType", "show"]} /> },
      { value: "none", children: <Lsi import={importLsi} path={["FormIdentificationType", "hide"]} /> },
    ],
    value: "basic",
    disableUserItemList: true,
    info: <Lsi import={importLsi} path={["FormIdentificationType", "info"]} />,
  }),
);

// because of the warning in the console
FormIdentificationType.defaultProps.itemList = [];

//@@viewOn:exports
export { FormIdentificationType };
export default FormIdentificationType;
//@@viewOff:exports
