//@@viewOn:imports
import { Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Unit from "./unit.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const Height = (props) => {
  const label = props.label ?? <Lsi import={importLsi} path={["FormHeight", "label"]} />;
  return <Unit {...props} label={label} />;
};

const FormHeight = Uu5Forms.withFormItem(Height);

//@@viewOn:exports
export { FormHeight };
export default FormHeight;
//@@viewOff:exports
