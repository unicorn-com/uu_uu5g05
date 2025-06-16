//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import useForm from "./use-form.js";
import { useFormFormContext } from "./_internal/form-form-context.js";
import importLsi from "./lsi/import-lsi.js";
//@@viewOff:imports

const { type, ...buttonPropTypes } = Uu5Elements.Button.propTypes;

const DEFAULT_LSI = {
  reset: { import: importLsi, path: ["reset"] },
};

const ResetButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ResetButton",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...buttonPropTypes,
    type: PropTypes.oneOf(["reset", "step"]),
    lsi: PropTypes.object,
    name: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    type: undefined,
    lsi: DEFAULT_LSI,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onClick, type, className, name, ...propsToPass } = props;
    const { isSubmitting, disabled: formDisabled, ...formProps } = useForm();
    const { reset, resetStep } = useFormFormContext();

    const disabled = props.disabled || formDisabled || isSubmitting;
    const borderRadius = props.borderRadius || formProps.borderRadius;
    const size = props.size || formProps.size;
    const fullLsi = { ...DEFAULT_LSI, ...props.lsi };

    function handleClick(e) {
      if (typeof onClick === "function") onClick(e);
      if (!e.defaultPrevented) {
        if (type === "step") resetStep?.();
        else reset?.();
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      // NOTE Not using type="reset" because we might be in Form.Provider but outside of Form.View (<form>)
      // so we have to reset it using our form API instead of relying on native "reset" form event.
      <Uu5Elements.Button
        {...propsToPass}
        className={name ? Utils.Css.joinClassName(className, Config.Css.css({ gridArea: name })) : className}
        type="button"
        disabled={disabled}
        size={size}
        borderRadius={borderRadius}
        onClick={handleClick}
      >
        {props.children !== undefined || props.icon || props.iconRight ? props.children : <Lsi lsi={fullLsi.reset} />}
      </Uu5Elements.Button>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { ResetButton };
export default ResetButton;
