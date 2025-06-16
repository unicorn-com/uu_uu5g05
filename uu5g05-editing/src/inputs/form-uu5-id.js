//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withDefaultProps from "../_internal/with-default-props.js";
//@@viewOff:imports

const FormUu5Id = Uu5Forms.withFormItem(
  withDefaultProps(Uu5Forms.Text, "Uu5IdInput", ["FormUu5Id", "label"], undefined, ["FormUu5Id", "message"]),
);

//@@viewOn:exports
export { FormUu5Id };
export default FormUu5Id;
//@@viewOff:exports
