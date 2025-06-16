//@@viewOn:imports
import { Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import withDefaultProps from "../_internal/with-default-props.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const FormNoPrint = Uu5Forms.withFormItem(
  withDefaultProps(Uu5Forms.SwitchSelect, "NoPrintInput", ["FormNoPrint", "label"], {
    itemList: [
      { value: false, children: <Lsi import={importLsi} path={["FormNoPrint", "show"]} /> },
      { value: true, children: <Lsi import={importLsi} path={["FormNoPrint", "hide"]} /> },
    ],
    value: false,
    disableUserItemList: true,
  }),
);

// because of the warning in the console
FormNoPrint.defaultProps.itemList = [];

//@@viewOn:exports
export { FormNoPrint };
export default FormNoPrint;
//@@viewOff:exports
