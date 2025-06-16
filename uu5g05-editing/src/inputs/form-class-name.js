//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withDefaultProps from "../_internal/with-default-props.js";
//@@viewOff:imports

const FormClassName = Uu5Forms.withFormItem(
  withDefaultProps(Uu5Forms.Text, "ClassNameInput", ["FormClassName", "label"], undefined, [
    "FormClassName",
    "message",
  ]),
);

//@@viewOn:exports
export { FormClassName };
export default FormClassName;
//@@viewOff:exports
