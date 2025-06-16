//@@viewOn:imports
import { createComponent, Utils, useRef } from "uu5g05";
import Config from "../config/config.js";
import { required, pattern } from "../config/validations.js";
import useValidatorMap from "../use-validator-map.js";
import withValidationMap from "../with-validation-map.js";
import InputString from "../_internal/input-string.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

const { type, ...propTypes } = InputString.propTypes;
const { type: _, _formattedValue, ...defaultProps } = InputString.defaultProps;

// This email regex is based on RFC 5322 standard according to https://emailregex.com/
const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const _EmailInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Email.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    autoComplete: "email", // override InputText
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { elementRef, ...otherProps } = props;

    const ref = useRef();

    const onValidate = useValidatorMap(props, {
      badValue: (value) => !ref.current.validity.typeMismatch && value !== null && value && !!value.match(EMAIL_REGEX),
    });
    //@@viewOff:private

    return (
      <InputString
        {...otherProps}
        type="email"
        onValidate={onValidate}
        elementRef={Utils.Component.combineRefs(elementRef, ref)}
      />
    );
    //@@viewOff:render
  },
});

const EmailInput = withValidationMap(_EmailInput, {
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueEmail"] },
    feedback: "error",
  },
  required: required(),
  pattern: pattern(),
});

//@@viewOn:helpers
//@@viewOff:helpers

export { EmailInput };
export default EmailInput;
