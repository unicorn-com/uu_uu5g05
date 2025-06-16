//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withDefaultProps from "../_internal/with-default-props.js";
//@@viewOff:imports

const FormBaseUri = Uu5Forms.withFormItem(
  withDefaultProps(
    Uu5Forms.Text,
    "BaseUriInput",
    ["FormBaseUri", "label"],
    {
      pattern: "^(ht|f)tp(s?)://[0-9a-zA-Z]([-.w]*[0-9a-zA-Z])*(:(0-9)*)*(/?)([a-zA-Z0-9-.?,'/\\+&amp;%$#_]*)?$",
    },
    ["FormBaseUri", "message"],
  ),
);

//@@viewOn:exports
export { FormBaseUri };
export default FormBaseUri;
//@@viewOff:exports
