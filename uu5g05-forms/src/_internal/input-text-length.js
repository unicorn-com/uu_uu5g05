//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";
import { InputString } from "./input-string.js";
import Config from "../config/config.js";
import useValidatorMap from "../use-validator-map.js";
//@@viewOff:imports

const InputTextLength = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputTextLength",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputString.propTypes,
    minLength: PropTypes.number,
    maxLength: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputString.defaultProps,
    minLength: undefined,
    maxLength: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { maxLength, minLength, elementAttrs, children: Input, ...otherProps } = props;

    const onValidate = useValidatorMap(props, {
      minLength: (value) => minLength == null || !value || value.length >= minLength,
      // NOTE We cannot do trim() here because there are cases where user wants spaces at the start/end of the value.
      maxLength: (value) => maxLength == null || !value || value.length <= maxLength,
    });
    //@@viewOff:private

    const InputComponent = Input || InputString;

    return (
      <InputComponent
        {...otherProps}
        onValidate={onValidate}
        elementAttrs={{
          ...elementAttrs,
          minLength,
          // NOTE Intentionally not passing maxLength - browser would automatically truncate pasted text and
          // user might not notice that.
        }}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { InputTextLength };
export default InputTextLength;
