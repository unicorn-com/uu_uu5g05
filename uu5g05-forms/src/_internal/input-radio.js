//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import Config from "../config/config.js";
import { InputCheckboxCoverWithBox, InputCheckboxCoverWithoutBox, withCheckboxInput } from "./input-checkbox-cover.js";
import RadioInput from "../inputs/radio-input.js";
//@@viewOff:imports

//@@viewOn:helpers
const renderRadioInput = (props) => {
  const {
    actualColorScheme,
    box,
    className,
    value,
    significance,
    children,
    focused,
    elementAttrs,
    tabIndex,
    ...otherProps
  } = props;

  return (
    <RadioInput
      {...otherProps}
      value={value}
      box={box}
      focused={box ? undefined : focused}
      className={Utils.Css.joinClassName(className, Config.Css.css({ pointerEvents: "none" }))}
      colorScheme={actualColorScheme}
      elementAttrs={{ ...elementAttrs, tabIndex, "aria-checked": value }}
    />
  );
};
//@@viewOff:helpers

let InputRadio = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputRadio",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputCheckboxCoverWithBox.propTypes,
    value: PropTypes.bool,
    box: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputCheckboxCoverWithBox.defaultProps,
    value: false,
    box: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { colorScheme, significance, children, elementAttrs, ...otherProps } = props;
    const { box, value, feedback, disabled, pending, focused } = otherProps;
    const actualColorScheme = value && colorScheme === "dim" ? "primary" : colorScheme;

    const CoverComponent = box ? InputCheckboxCoverWithBox : InputCheckboxCoverWithoutBox;

    let tabIndex = elementAttrs?.tabIndex == null ? (box ? -1 : 0) : elementAttrs.tabIndex;
    // focused true/false only in checkboxes -> there is selecting by arrow up/down, not by tab
    if (disabled || pending || focused != null) tabIndex = -1;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <CoverComponent
        {...otherProps}
        label={children}
        nextValue={!value}
        colorScheme={feedback === "success" ? "primary" : actualColorScheme}
        significance={box ? (feedback ? "distinct" : value ? "distinct" : significance) : "common"}
        elementAttrs={{ tabIndex: box ? 0 : -1, ...elementAttrs }}
      >
        {(componentProps) => renderRadioInput({ ...componentProps, actualColorScheme, tabIndex })}
      </CoverComponent>
    );
    //@@viewOff:render
  },
});

const Radio = withCheckboxInput(InputRadio, Config.TAG + "Radio");

export { Radio };
export default Radio;
