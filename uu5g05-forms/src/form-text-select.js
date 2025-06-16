//@@viewOn:imports
import { Utils } from "uu5g05";
import withFormItem from "./with-form-item.js";
import TextSelect from "./text-select.js";
//@@viewOff:imports

const FormTextSelect = withFormItem(Utils.Component.memo(TextSelect));

//@@viewOn:helpers
//@@viewOff:helpers

export { FormTextSelect };
export default FormTextSelect;
