//@@viewOn:imports
import withExtensionInput from "./with-extension-input.js";
import withFormInput from "./with-form-input.js";
import PasswordInput from "./inputs/password-input.js";
//@@viewOff:imports

const Password = withFormInput(PasswordInput);
Password.Input = PasswordInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Password };
export default Password;
