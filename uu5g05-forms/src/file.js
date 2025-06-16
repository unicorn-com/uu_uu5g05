//@@viewOn:imports
import withFormInput from "./with-form-input.js";
import FileInput from "./inputs/file-input.js";
//@@viewOff:imports

const File = withFormInput(FileInput);
File.Input = FileInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { File };
export default File;
