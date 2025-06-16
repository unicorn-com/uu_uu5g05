//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withDefaultProps from "../_internal/with-default-props.js";
//@@viewOff:imports

const FormBid = Uu5Forms.withFormItem(
  withDefaultProps(Uu5Forms.Text, "BidInput", ["FormBid", "label"], undefined, ["FormBid", "message"]),
);

//@@viewOn:exports
export { FormBid };
export default FormBid;
//@@viewOff:exports
