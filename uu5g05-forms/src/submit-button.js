//@@viewOn:imports
import { createVisualComponent, Lsi, useEffect, useRef, Utils, PropTypes } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { useFormFormContext } from "./_internal/form-form-context.js";
import { useFormItemContext } from "./_internal/form-item-context.js";
import useForm from "./use-form.js";
import importLsi from "./lsi/import-lsi";
//@@viewOff:imports

const { type, ...buttonPropTypes } = Uu5Elements.Button.propTypes;

const DEFAULT_LSI = {
  submit: { import: importLsi, path: ["submit"] },
};

const SubmitButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SubmitButton",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...buttonPropTypes,
    type: PropTypes.oneOf(["submit", "step"]),
    lsi: PropTypes.object,
    name: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    colorScheme: "primary",
    significance: "highlighted",
    type: undefined,
    lsi: DEFAULT_LSI,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { isSubmitting, disabled: formDisabled, ...formProps } = useForm();
    const { submit, submitStep, submitButtonComponentElementRef } = useFormFormContext();
    const { itemMap } = useFormItemContext();

    const {
      disabled: propsDisabled,
      borderRadius = formProps.borderRadius,
      size = formProps.size,
      elementRef,
      width: propsWidth,
      onClick,
      type,
      icon,
      lsi,
      className,
      name,
      ...propsToPass
    } = props;

    const hasSyncError = _hasSyncError(itemMap, type === "step");
    const { children, iconRight } = propsToPass;
    const fullLsi = { ...DEFAULT_LSI, ...lsi };

    const disabled = propsDisabled || formDisabled || isSubmitting || hasSyncError;

    function handleClick(e) {
      if (typeof onClick === "function") onClick(e);
      if (!e.defaultPrevented) {
        if (type === "step") submitStep?.(e);
        else submit?.(e);
      }
    }

    const ref = useRef();
    const widthRef = useRef();

    useEffect(() => {
      widthRef.current = ref.current.getBoundingClientRect().width;
    });

    let width = propsWidth;
    let childrenToRender;
    let iconToRender = icon;

    if (isSubmitting) {
      width ||= widthRef.current;
      iconToRender = null;
      childrenToRender = <Uu5Elements.Pending size="xs" colorScheme={null} />;
    } else {
      childrenToRender = children !== undefined ? children : <Lsi lsi={fullLsi.submit} />;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Elements.Button
        {...propsToPass}
        className={name ? Utils.Css.joinClassName(className, Config.Css.css({ gridArea: name })) : className}
        // NOTE Not using type="submit" because SubmitButton might be outside of HTML <form> (e.g. when in Modal footer).
        // Therefore submit is handled by calling submit() on Form.Provider.
        elementRef={Utils.Component.combineRefs(elementRef, ref, submitButtonComponentElementRef)}
        width={width}
        icon={iconToRender}
        disabled={disabled}
        size={size}
        borderRadius={borderRadius}
        onClick={handleClick}
      >
        {childrenToRender}
      </Uu5Elements.Button>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function _hasSyncError(itemMap, singleStepOnly) {
  for (let name in itemMap) {
    if (singleStepOnly && !itemMap[name].mounted) continue;
    let errorList = itemMap[name].errorList || [];
    for (let error of errorList) {
      if (error.feedback === "error") return true;
    }
  }
  return false;
}

//@@viewOff:helpers

export { SubmitButton };
export default SubmitButton;
