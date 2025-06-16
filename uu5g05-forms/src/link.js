//@@viewOn:imports
import withExtensionInput from "./with-extension-input.js";
import withFormInput from "./with-form-input.js";
import LinkInput from "./inputs/link-input.js";
//@@viewOff:imports

const Link = withFormInput(withExtensionInput(LinkInput));
Link.Input = LinkInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Link };
export default Link;
