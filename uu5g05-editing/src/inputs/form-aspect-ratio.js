//@@viewOn:imports
import Uu5Forms from "uu5g05-forms";
import withAvailableValues from "../_internal/with-available-values.js";
//@@viewOff:imports

const FormAspectRatio = Uu5Forms.withFormItem(
  withAvailableValues(
    Uu5Forms.Select,
    "AspectRatioInput",
    ["FormAspectRatio", "label"],
    [
      undefined,
      "1x2",
      "9x16",
      "2x3",
      "3x4",
      "4x5",
      "1x1",
      "5x4",
      "4x3",
      "3x2",
      "16x10",
      "16x9",
      "2x1",
      "3x1",
      "4x1",
      "45x10",
      "1x10",
      "10x1",
    ],
  ),
);

//@@viewOn:exports
export { FormAspectRatio };
export default FormAspectRatio;
//@@viewOff:exports
