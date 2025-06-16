//@@viewOn:imports
import { _usePortalElement as usePortalElement } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
const MODAL_MARKER_ATTRIBUTE = "data-uu5modal";
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

function useModalPortalElement() {
  return usePortalElement({
    type: "modal",
    onCreate: (el) => {
      el.classList.add(Config.Css.css({ zIndex: Config.zIndex.modal }));
      el.setAttribute(MODAL_MARKER_ATTRIBUTE, "");
    },
  });
}

export { useModalPortalElement, MODAL_MARKER_ATTRIBUTE };
export default useModalPortalElement;
