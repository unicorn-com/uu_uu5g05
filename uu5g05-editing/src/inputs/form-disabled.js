//@@viewOn:imports
import { Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import withDefaultProps from "../_internal/with-default-props.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const FormDisabled = Uu5Forms.withFormItem(
  withDefaultProps(Uu5Forms.SwitchSelect, "DisabledInput", ["FormDisabled", "label"], {
    itemList: [
      { value: false, children: <Lsi import={importLsi} path={["FormDisabled", "allow"]} /> },
      { value: true, children: <Lsi import={importLsi} path={["FormDisabled", "disable"]} /> },
    ],
    value: false,
    disableUserItemList: true,
  }),
);

// because of the warning in the console
FormDisabled.defaultProps.itemList = [];

//@@viewOn:exports
export { FormDisabled };
export default FormDisabled;
//@@viewOff:exports
