//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";

import { InputText } from "./input-text.js";
import Config from "../config/config.js";
import useValidatorMap from "../use-validator-map.js";
//@@viewOff:imports

const InputString = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputString",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputText.propTypes,
    pattern: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputText.defaultProps,
    pattern: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { pattern, children: Input, ...otherProps } = props;

    const onValidate = useValidatorMap(props, {
      pattern: (value) => !pattern || !value || !!value.match(pattern),
    });
    //@@viewOff:private

    const InputComponent = Input || InputText;

    // NOTE: Pattern is not pass to html element, because uu5 has another rule. Standard html input rule is "^(?:" + pattern + ")$"
    return <InputComponent {...otherProps} onValidate={onValidate} />;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { InputString };
export default InputString;
