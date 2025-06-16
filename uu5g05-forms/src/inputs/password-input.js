//@@viewOn:imports
import { createComponent, useState, PropTypes } from "uu5g05";
import Config from "../config/config.js";
import { maxLength, minLength, pattern, required } from "../config/validations.js";
import withValidationMap from "../with-validation-map.js";
import InputTextLength from "../_internal/input-text-length.js";
import { _withExtensionInput } from "../with-extension-input.js";
//@@viewOff:imports

const REVEALABLE_ICON_KEY = "revealableIcon";

// ToDo: place icons after Input implementation -- mdi-eye, mdi-eye-off

const { type, ...propTypes } = InputTextLength.propTypes;
const { type: _, _formattedValue, ...defaultProps } = InputTextLength.defaultProps;

const InputTextLengthExtension = _withExtensionInput(InputTextLength, undefined, {
  clickableReadOnlyIconKeySet: new Set([REVEALABLE_ICON_KEY]),
});

function useRevealableProps(props) {
  const { revealable, revealableIconOn, revealableIconOff, value, iconRightList, iconRight, onIconRightClick } = props;
  const [show, setShow] = useState(false);

  let inputProps;
  if (revealable && value) {
    const revealableClick = () => setShow((v) => !v);
    inputProps = {
      iconRight: undefined,
      onIconRightClick: undefined,
      iconRightList: [],
    };

    if (show) {
      inputProps.iconRightList.push({ icon: revealableIconOn, onClick: revealableClick, key: REVEALABLE_ICON_KEY });
      inputProps.type = "text";
    } else {
      inputProps.iconRightList.push({ icon: revealableIconOff, onClick: revealableClick, key: REVEALABLE_ICON_KEY });
    }

    if (iconRightList?.length) inputProps.iconRightList.push(...iconRightList);
    else if (iconRight) inputProps.iconRightList.push({ icon: iconRight, onClick: onIconRightClick });
  }

  return inputProps;
}

const _PasswordInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Password.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    revealable: PropTypes.bool,
    revealableIconOn: PropTypes.string,
    revealableIconOff: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    autoComplete: false, // override InputText
    revealable: false,
    revealableIconOn: "uugds-eye-off",
    revealableIconOff: "uugds-eye",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { revealable, revealableIconOn, revealableIconOff, ...propsToPass } = props;
    const inputProps = useRevealableProps(props);
    //@@viewOff:private

    return <InputTextLengthExtension {...propsToPass} type="password" {...inputProps} />;
    //@@viewOff:render
  },
});

const PasswordInput = withValidationMap(_PasswordInput, {
  required: required(),
  pattern: pattern(),
  minLength: minLength(),
  maxLength: maxLength(),
});

//@@viewOn:helpers
//@@viewOff:helpers

export { PasswordInput };
export default PasswordInput;
