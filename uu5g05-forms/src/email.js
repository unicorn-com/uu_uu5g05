//@@viewOn:imports
import withExtensionInput from "./with-extension-input.js";
import withFormInput from "./with-form-input.js";
import EmailInput from "./inputs/email-input.js";
//@@viewOff:imports

const Email = withFormInput(withExtensionInput(EmailInput));
Email.Input = EmailInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Email };
export default Email;
