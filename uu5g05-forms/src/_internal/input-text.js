//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import withValidationInput from "../with-validation-input.js";
//@@viewOff:imports

const ValidationInput = withValidationInput(Uu5Elements.Input);

const InputText = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputText",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...ValidationInput.propTypes,
    autoComplete: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...ValidationInput.defaultProps,
    autoComplete: undefined,
    width: 200,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { autoComplete, elementAttrs, onChange, ...otherProps } = props;

    if (autoComplete && navigator.userAgent.match(/Mozilla/) && typeof onChange === "function") {
      const propsOnChange = onChange;
      onChange = (e) => {
        // Most of the time e.target should be present but new custom date/time inputs send empty event in some cases
        if (e?.target) {
          // because autoComplete does not work in FF https://github.com/facebook/react/issues/18986
          Object.defineProperty(e.target, "defaultValue", {
            configurable: true,
            get() {
              return "";
            },
            set() {},
          });
        }

        propsOnChange(e);
      };
    }

    switch (autoComplete) {
      case true:
        autoComplete = "on";
        break;
      case false:
        autoComplete = "off";
        break;
    }
    //@@viewOff:private

    return (
      <ValidationInput
        {...otherProps}
        onChange={onChange}
        elementAttrs={{
          ...elementAttrs,
          autoComplete,
        }}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { InputText };
export default InputText;
