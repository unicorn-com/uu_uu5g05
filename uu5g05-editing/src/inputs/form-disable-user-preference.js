//@@viewOn:imports
import { Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import withDefaultProps from "../_internal/with-default-props.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const FormDisableUserPreference = Uu5Forms.withFormItem(
  withDefaultProps(Uu5Forms.SwitchSelect, "DisableUserPreferenceInput", ["FormDisableUserPreference", "label"], {
    itemList: [
      { value: false, children: <Lsi import={importLsi} path={["FormDisableUserPreference", "userPreference"]} /> },
      { value: true, children: <Lsi import={importLsi} path={["FormDisableUserPreference", "component"]} /> },
    ],
    value: false,
    disableUserItemList: true,
  }),
);

// because of the warning in the console
FormDisableUserPreference.defaultProps.itemList = [];

//@@viewOn:exports
export { FormDisableUserPreference };
export default FormDisableUserPreference;
//@@viewOff:exports
