//@@viewOn:imports
import { Environment, PropTypes, Utils, createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:constants
const STATICS = {
  uu5Tag: Config.TAG + "InlineComponentLink",
  nestingLevel: ["spot"],
};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const InlineComponentLink = createVisualComponent({
  //@@viewOn:statics
  ...STATICS,
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    modalProps: PropTypes.object,
    uveProps: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    modalProps: {},
    uveProps: {},
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, modalProps, uveProps, ...otherProps } = props;
    const [openModal, setOpenModal] = useState(false);

    let url = new URL(Environment.componentUveUri);
    let disableUve = false;
    for (const key in uveProps) {
      let v = uveProps[key];
      if (v != null) {
        if (
          Utils.Element.isValid(v) ||
          (Array.isArray(v) && v.filter((item) => !/^\s*$/.test(item)).find((ch) => Utils.Element.isValid(ch)))
        ) {
          // cannot be displayed in Plus4UGo, because the node should be transpile to uu5String recursively
          disableUve = true;
        } else if (typeof v === "object") {
          try {
            v = JSON.stringify(v);
          } catch (e) {
            disableUve = v;
          }
        }
        url.searchParams.append(key, v);
      }
    }

    function onClick(e) {
      if (e.button === 0 && ((!e.ctrlKey && !e.metaKey) || disableUve)) {
        e.preventDefault();
        setOpenModal(true);

        if (typeof disableUve !== "boolean") {
          InlineComponentLink.logger.warn("Object contains not acceptable values for json.", e);
        }
      }
    }

    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const currentNestingLevel = Utils.NestingLevel.getNestingLevel(otherProps, STATICS);
    const Comp = currentNestingLevel ? Uu5Elements.Button : Uu5Elements.Link;

    let compProps = { ...otherProps };
    if (!currentNestingLevel) {
      const { elementProps } = Utils.VisualComponent.splitProps(otherProps);
      if (!disableUve) {
        compProps = { ...elementProps, href: url.href, target: "_blank" };
      }
    }

    return (
      <>
        <Comp {...compProps} onClick={onClick}>
          {children}
        </Comp>
        <Uu5Elements.Modal open={openModal} onClose={() => setOpenModal(false)} {...modalProps} />
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { InlineComponentLink };
export default InlineComponentLink;
//@@viewOff:exports
