//@@viewOn:imports
import { required } from "../config/validations.js";
import withValidationMap from "../with-validation-map.js";
import withValidationInput from "../with-validation-input.js";
import InputFile from "../_internal/input-file.js";
//@@viewOff:imports

const FileInput = withValidationMap(withValidationInput(InputFile), { required: required() });

export { FileInput };
export default FileInput;
