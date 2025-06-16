//@@viewOn:imports
import { Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Unit from "./unit.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const Width = (props) => {
  const label = props.label ?? <Lsi import={importLsi} path={["FormWidth", "label"]} />;
  return <Unit {...props} label={label} />;
};

const FormWidth = Uu5Forms.withFormItem(Width);

//@@viewOn:exports
export { FormWidth };
export default FormWidth;
//@@viewOff:exports
