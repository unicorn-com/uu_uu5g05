//@@viewOn:imports
import { Utils, Lsi } from "uu5g05";
//@@viewOff:imports

const Tools = {
  getLabel: (label) => {
    return typeof label === "object" && !Utils.Element.isValid(label) ? <Lsi lsi={label} /> : label;
  },
};

//@@viewOn:exports
export default Tools;
//@@viewOff:exports
