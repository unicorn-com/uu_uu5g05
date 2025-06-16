// NOTE This is a Config used by demo pages - it is executed after all demo libraries are loaded, i.e. the styles
// will have biggest priority (this is ensured by using "// devkit-pure-exports" in exports.js).
import { Utils } from "uu5g05";

const Config = {
  TAG: "Uu5Demo.",
  Css: Utils.Css.createCssModule("uudemo"),
};

export { Config };
export default Config;
