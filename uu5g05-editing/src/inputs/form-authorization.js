//@@viewOn:imports
import { Utils, withLazy } from "uu5g05";
import config from "../config/config.js";
//@@viewOff:imports

const FormAuthorization = withLazy(
  async () => {
    await Utils.Uu5Loader.import("uu_plus4u5g02", import.meta.url);
    return import("./_authorization/form-authorization.js");
  },
  undefined,
  { uu5Tag: config.TAG + "FormAuthorization" },
);

//@@viewOn:exports
export { FormAuthorization };
export default FormAuthorization;
//@@viewOff:exports
