//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import SpacesInput from "./_spaces-input/spaces-input.js";
//@@viewOff:imports

const FormSpaces = Uu5Forms.withFormItem(SpacesInput);
FormSpaces.editModal = { propMap: { padding: "padding", margin: "margin" } };

//@@viewOn:exports
export { FormSpaces };
export default FormSpaces;
//@@viewOff:exports
