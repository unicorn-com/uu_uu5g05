//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import Link from "./_internal/link.js";
//@@viewOff:imports

const FormLink = Uu5Forms.withFormItem(Link);
FormLink.editModal = { propMap: { href: "href", target: "target", label: "label" } };

//@@viewOn:exports
export { FormLink };
export default FormLink;
//@@viewOff:exports
