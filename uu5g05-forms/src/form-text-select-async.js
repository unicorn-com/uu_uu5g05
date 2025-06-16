//@@viewOn:imports
import { Utils } from "uu5g05";
import withFormItem from "./with-form-item.js";
import TextSelectAsync from "./text-select-async.js";
//@@viewOff:imports

const FormTextSelectAsync = withFormItem(Utils.Component.memo(TextSelectAsync));

//@@viewOn:helpers
//@@viewOff:helpers

export { FormTextSelectAsync };
export default FormTextSelectAsync;
