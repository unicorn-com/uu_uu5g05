//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withDefaultProps from "../_internal/with-default-props.js";
//@@viewOff:imports

const FormOid = Uu5Forms.withFormItem(
  withDefaultProps(Uu5Forms.Text, "OidInput", ["FormOid", "label"], undefined, ["FormOid", "message"]),
);

//@@viewOn:exports
export { FormOid };
export default FormOid;
//@@viewOff:exports
