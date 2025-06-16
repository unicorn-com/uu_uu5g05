//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useEvent, useEffect } from "uu5g05";
import Config from "../config/config.js";
import { MODAL_MARKER_ATTRIBUTE } from "./use-modal-portal-element.js";
//@@viewOff:imports

const Css = {
  main(drawerMode) {
    return Config.Css.css({
      position: drawerMode ? "absolute" : "fixed",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: drawerMode ? "rgba(0, 0, 0, 0.2)" : "transparent",

      [`[${MODAL_MARKER_ATTRIBUTE}] > &:last-of-type`]: {
        backgroundColor: "rgba(0, 0, 0, 0.4)",
      },
    });
  },
};

const EMPTY_FN = () => {};

const Overlay = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Overlay",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onClose: PropTypes.func,
    closeOnEsc: PropTypes.bool,
    closeOnOverlayClick: PropTypes.bool,
    drawerMode: PropTypes.bool,
    // scrollableBackground: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onClose: undefined,
    closeOnEsc: true,
    closeOnOverlayClick: false,
    drawerMode: false,
    // scrollableBackground: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onClose, closeOnEsc, closeOnOverlayClick, drawerMode, children, elementAttrs = {}, ...otherProps } = props;

    // useScrollableBackground(scrollableBackground);
    // NOTE Passing EMPTY_FN so that Modals with closeOnEsc=false stop the event (in case that there's another
    // Modal under the current with closeOnEsc=true).
    useEscEvent(closeOnEsc ? onClose : EMPTY_FN);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(
      { ...otherProps, elementAttrs: { ...elementAttrs } },
      Css.main(drawerMode),
    );

    return (
      <aside
        {...attrs}
        onClick={
          closeOnOverlayClick
            ? (e) => {
                // e.target could be ModalView or overlay
                (e.target === e.currentTarget || e.target?.parentElement === e.currentTarget) &&
                  typeof onClose === "function" &&
                  onClose(e);
              }
            : undefined
        }
      >
        {children}
      </aside>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const escEvents = [];

// close on Esc key
function useEscEvent(handleEvent) {
  useEvent(
    "keydown",
    (e) => {
      if (typeof handleEvent === "function" && e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        if (escEvents[escEvents.length - 1] === handleEvent) handleEvent(e);
      }
    },
    window,
  );

  useEffect(() => {
    handleEvent && escEvents.push(handleEvent);
    return () => {
      if (handleEvent) {
        const index = escEvents.indexOf(handleEvent);
        if (index > -1) {
          escEvents.splice(index, 1);
        }
      }
    };
  }, [handleEvent]);
}

// function useScrollableBackground(scrollableBackground) {
//   const { platform } = useDevice();
//
//   // handle scrollableBackground
//   useLayoutEffect(() => {
//     if (!scrollableBackground) {
//       // disable scrolling
//       let bodyScrollY = window.scrollY || document.body.scrollTop || window.pageYOffset;
//       document.body.style.overflow = "hidden";
//       // this breaks scroll position on MS Edge
//       if (platform === "ios") {
//         document.documentElement.style.overflow = "hidden";
//       }
//       if (document.body.scrollTop !== bodyScrollY) document.body.scrollTop = bodyScrollY;
//       if (Tools.getDocumentHeight() > window.innerHeight) {
//         let paddingRight = Tools.getScrollBarWidth();
//         if (paddingRight) document.body.style.paddingRight = paddingRight + "px";
//       }
//       document.documentElement.classList.add("uu5-common-no-scroll"); // used by uu_plus4u5g01
//
//       return () => {
//         // enable scrolling
//         if (document.body.style.overflow) document.body.style.overflow = "";
//         if (document.documentElement.style.overflow) document.documentElement.style.overflow = "";
//         if (document.body.scrollTop !== bodyScrollY) document.body.scrollTop = bodyScrollY;
//         if (document.documentElement.scrollTop !== bodyScrollY) document.documentElement.scrollTop = bodyScrollY;
//         if (document.body.style.paddingRight) document.body.style.paddingRight = "";
//         document.documentElement.classList.remove("uu5-common-no-scroll"); // used by uu_plus4u5g01
//       };
//     }
//   }, [platform, scrollableBackground]);
// }

//@@viewOff:helpers

export { Overlay };
export default Overlay;
