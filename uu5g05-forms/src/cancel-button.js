//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { useFormFormContext } from "./_internal/form-form-context.js";
import useForm from "./use-form.js";
import importLsi from "./lsi/import-lsi.js";
//@@viewOff:imports

const { type, ...buttonPropTypes } = Uu5Elements.Button.propTypes;

const DEFAULT_LSI = {
  cancel: { import: importLsi, path: ["cancel"] },
};

const CancelButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "CancelButton",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...buttonPropTypes,
    lsi: PropTypes.object,
    name: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    lsi: DEFAULT_LSI,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { className, name, ...propsToPass } = props;
    const { isSubmitting, disabled: formDisabled, ...formProps } = useForm();
    const { cancel } = useFormFormContext();
    const disabled = props.disabled || formDisabled || isSubmitting;
    const borderRadius = props.borderRadius || formProps.borderRadius;
    const size = props.size || formProps.size;
    const fullLsi = { ...DEFAULT_LSI, ...props.lsi };
    const onClick = cancel
      ? (e) => {
          e.persist();
          cancel(typeof props.onClick === "function" ? () => props.onClick(e) : undefined);
        }
      : props.onClick;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Elements.Button
        {...propsToPass}
        className={name ? Utils.Css.joinClassName(className, Config.Css.css({ gridArea: name })) : className}
        disabled={disabled}
        size={size}
        borderRadius={borderRadius}
        onClick={onClick}
      >
        {props.children !== undefined || props.icon || props.iconRight ? props.children : <Lsi lsi={fullLsi.cancel} />}
      </Uu5Elements.Button>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { CancelButton };
export default CancelButton;
