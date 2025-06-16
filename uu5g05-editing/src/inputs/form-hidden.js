//@@viewOn:imports
import { Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import withDefaultProps from "../_internal/with-default-props.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const FormHidden = Uu5Forms.withFormItem(
  withDefaultProps(Uu5Forms.SwitchSelect, "HiddenInput", ["FormHidden", "label"], {
    itemList: [
      { value: false, children: <Lsi import={importLsi} path={["FormHidden", "show"]} /> },
      { value: true, children: <Lsi import={importLsi} path={["FormHidden", "hide"]} /> },
    ],
    value: false,
    disableUserItemList: true,
  }),
);

// because of the warning in the console
FormHidden.defaultProps.itemList = [];

//@@viewOn:exports
export { FormHidden };
export default FormHidden;
//@@viewOff:exports
