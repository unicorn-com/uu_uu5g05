//@@viewOn:imports
import { createComponent, PropTypes, useLayoutEffect, useRef, useState, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { maxLength, minLength, required } from "../config/validations.js";
import withValidationMap from "../with-validation-map.js";
import withValidationInput from "../with-validation-input.js";
import InputTextLength from "../_internal/input-text-length.js";
//@@viewOff:imports

const { type, _formattedValue, pattern, autoComplete, ...propTypes } = InputTextLength.propTypes;
const {
  type: _,
  _formattedValue: __,
  pattern: ___,
  autoComplete: ____,
  ...defaultProps
} = InputTextLength.defaultProps;

const ValidationInput = withValidationInput(Uu5Elements.Input);

let TextAreaInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TextArea.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    spellCheck: PropTypes.bool,
    rows: PropTypes.number,
    autoResize: PropTypes.bool,
    maxRows: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    spellCheck: undefined,
    rows: undefined,
    autoResize: false,
    maxRows: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { spellCheck, rows, autoResize, maxRows, elementRef, style, elementAttrs, ...otherProps } = props;

    const { value } = otherProps;

    const { style: inputStyle, ref } = useAutoResizeStyle({
      autoResize,
      maxRows,
      rows,
      value,
      style: typeof style === "string" ? Utils.Style.parse(style) : style,
    });

    //@@viewOff:private

    return (
      <InputTextLength
        {...otherProps}
        type="textarea"
        elementRef={Utils.Component.combineRefs(elementRef, ref)}
        style={inputStyle}
        elementAttrs={{
          ...elementAttrs,
          rows,
          spellCheck,
          autoComplete: "off",
        }}
        pattern={undefined} // not supported for TextArea
        autoComplete={false} // not working in TextArea
      >
        {ValidationInput}
      </InputTextLength>
    );
    //@@viewOff:render
  },
});

TextAreaInput = withValidationMap(TextAreaInput, {
  required: required(),
  minLength: minLength(),
  maxLength: maxLength(),
});

//@@viewOn:helpers
function useAutoResizeStyle({ autoResize, maxRows, rows = 2, value, style: propsStyle }) {
  const [style, setStyle] = useState(propsStyle);
  const ref = useRef();

  useLayoutEffect(() => {
    if (autoResize) {
      const textarea = ref.current;
      const textareaStyle = getComputedStyle(textarea);

      const borderHeight = parseFloat(textareaStyle.borderTopWidth) + parseFloat(textareaStyle.borderBottomWidth);

      const origHeight = textarea.style.height;
      textarea.style.height = "0px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = origHeight;

      const height = scrollHeight + borderHeight;

      const contentHeight = parseFloat(textareaStyle.lineHeight);
      const boxHeight = parseFloat(textareaStyle.paddingTop) + parseFloat(textareaStyle.paddingBottom) + borderHeight;

      const minHeight = contentHeight * rows + boxHeight;
      const maxHeight = maxRows ? contentHeight * maxRows + boxHeight : undefined;

      setStyle({ height, minHeight, maxHeight, ...propsStyle });
    }
  }, [autoResize, maxRows, rows, value]);

  return { style, ref };
}

//@@viewOff:helpers

export { TextAreaInput };
export default TextAreaInput;
