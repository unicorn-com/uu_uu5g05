//@@viewOn:imports
import { createComponent } from "uu5g05";
import InputText from "./input-text.js";
import Config from "../config/config.js";
import useValueTransformation from "./use-value-transformation.js";
//@@viewOff:imports

const InputNumberNative = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputNumberNative",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    // perform value transformation because native <input type="text" /> gives value as a string and we need Number
    // NOTE This hook also solves issue where if user wants to type "0.05" and he already typed "0.0", the produced
    // Number for onChange would be 0, which would then come via props.value and we would reset the native input
    // value to "0".
    const { valueType, ...restProps } = props;
    const { formattedValue, onBlur, onChange, onValidate } = useValueTransformation(props, {
      parse: (formattedNumber) => {
        // parse number from textual value from *focused* <input /> (and keep null/undefined untouched)
        const result =
          formattedNumber == null
            ? formattedNumber
            : formattedNumber === ""
              ? undefined
              : valueType === "string"
                ? formattedNumber
                : Number(formattedNumber);
        return result;
      },
      format: (number) => {
        // format to value usable by *focused* <input />
        const text = number != null ? number.toString() : "";
        return text;
      },
    });
    //@@viewOff:private

    //@@viewOn:render
    return (
      <InputText {...restProps} value={formattedValue} onValidate={onValidate} onChange={onChange} onBlur={onBlur} />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { InputNumberNative };
export default InputNumberNative;
