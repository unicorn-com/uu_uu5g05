//@@viewOn:imports
import { createComponent, Utils, useRef } from "uu5g05";
import Config from "../config/config.js";
import { required, pattern } from "../config/validations.js";
import useValidatorMap from "../use-validator-map.js";
import withValidationMap from "../with-validation-map.js";
import InputString from "../_internal/input-string";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

const { type, ...propTypes } = InputString.propTypes;
const { type: _, _formattedValue, ...defaultProps } = InputString.defaultProps;

const _LinkInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Link.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    autoComplete: "url", // override InputText
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { elementRef, ...otherProps } = props;

    const ref = useRef();

    const onValidate = useValidatorMap(props, {
      badValue: (value) => !ref.current.validity.typeMismatch && value !== null,
    });
    //@@viewOff:private

    return (
      <InputString
        {...otherProps}
        type="url"
        onValidate={onValidate}
        elementRef={Utils.Component.combineRefs(elementRef, ref)}
      />
    );
    //@@viewOff:render
  },
});

const LinkInput = withValidationMap(_LinkInput, {
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueLink"] },
    feedback: "error",
  },
  required: required(),
  pattern: pattern(),
});

//@@viewOn:helpers
//@@viewOff:helpers

export { LinkInput };
export default LinkInput;
