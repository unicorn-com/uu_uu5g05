//@@viewOn:imports
import { createVisualComponent, Utils, useState, PropTypes, useContentSize, useEffect, usePreviousValue } from "uu5g05";
import Config from "./config/config.js";
import { useSideDetailLayoutContext } from "./_internal/side-detail-layout-context";
//@@viewOff:imports

const SideDetailLayoutDetail = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SideDetailLayout.Detail",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    data: PropTypes.object,
    onClose: PropTypes.func.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { data, onClose, children } = props;
    const prevData = usePreviousValue(data, data);
    const open = !!data;

    const { register, unregister, sideRef } = useSideDetailLayoutContext();

    const [id] = useState(() => Utils.String.generateId());
    const [display, setDisplay] = useState();

    const contentSize = useContentSize();
    const displayAsModal = ["xs", "s"].includes(contentSize) || !register; // if no register, there is not SideDetailLayout.Provider

    useEffect(() => {
      if (open) {
        // cannot register for modal, because Drawer should be closed
        if (!displayAsModal) register(id, onClose);
        // timeout because of waiting for unmounting previous side panel's content
        const timeout = setTimeout(() => setDisplay(true), 0);
        return () => clearTimeout(timeout);
      } else {
        const wait = unregister?.(id);
        // for modal, it is not necessary to wait for Drawer animation
        if (wait) {
          const timeout = setTimeout(() => setDisplay(false), 300); // Config.COLLAPSIBLE_BOX_TRANSITION_DURATION
          return () => clearTimeout(timeout);
        } else {
          setDisplay(false);
        }
      }
    }, [open]);

    //@@viewOn:render
    let result = null;
    if (display) {
      let childrenToRender = children;
      // open is only for modal
      const propsToPass = { displayAsModal, data: data ?? prevData, onClose, open };
      if (typeof children === "function") {
        childrenToRender = children(propsToPass);
      } else if (Utils.Element.isValid(children)) {
        childrenToRender = Utils.Element.clone(children, propsToPass);
      }
      if (displayAsModal) {
        result = childrenToRender;
      } else {
        result = Utils.Dom.createPortal(childrenToRender, sideRef.current);
      }
    }

    return result;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SideDetailLayoutDetail };
export default SideDetailLayoutDetail;
//@@viewOff:exports
