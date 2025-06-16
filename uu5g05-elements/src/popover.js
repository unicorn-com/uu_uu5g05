//@@viewOn:imports
import {
  createComponent,
  createVisualComponent,
  PropTypes,
  useDevice,
  _usePortalElement as usePortalElement,
  useScreenSize,
  Utils,
} from "uu5g05";
import Config from "./config/config.js";
import PopoverBottomSheet from "./_popover/popover-bottom-sheet.js";
import PopoverStandard from "./_popover/popover-standard.js";
import UuGds from "./_internal/gds.js";
import { ModalRegistrationProvider } from "./_modal/use-modal-registration.js";
//@@viewOff:imports

//@@viewOn:constants
const POPOVER_TYPE = `popover-${Utils.String.generateId(8)}`;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  backdrop: () =>
    Config.Css.css({
      position: "fixed",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: UuGds.ColorPalette.getValue(["building", "dark", "softStrongestTransparent"]),
      animation: Config.Css.keyframes({
        "0%": { opacity: 0 },
        "100%": { opacity: 1 },
      }),
      animationDuration: `${Config.MODAL_TRANSITION_DURATION}ms`,
      animationFillMode: "forwards",
      touchAction: "none",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function usePopoverPortalElement(zIndex) {
  return usePortalElement({
    type: POPOVER_TYPE + (zIndex == null ? "" : "-" + zIndex),
    onCreate: (el) => {
      el.className = Config.Css.css({
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: zIndex ?? Config.zIndex.popover,
        // container must not be clickable - if a Popover is open and user clicks on another Dropdown in page
        // then the click must really go to that Dropdown, not to this container
        pointerEvents: "none",
        "&>*": { pointerEvents: "all" },
      });
    },
  });
}

function WithPortal({ children, zIndex }) {
  const portalElement = usePopoverPortalElement(zIndex);
  return Utils.Dom.createPortal(children, portalElement);
}

function withDisabledOnCloseIfActiveNestedModals(Component) {
  let ResultComponent = createComponent({
    uu5Tag: `withDisabledOnCloseIfActiveNestedModals(${Component.uu5Tag})`,
    render(props) {
      return (
        <ModalRegistrationProvider>
          {({ itemList }) => (
            <Component
              {...props}
              onClose={itemList.length > 0 ? undefined : props.onClose}
              className={Utils.Css.joinClassName(
                props.className,
                itemList.length > 0 ? Config.Css.css({ pointerEvents: "none", visibility: "hidden" }) : undefined,
              )}
              displayArrow={itemList.length > 0 ? false : props.displayArrow}
            />
          )}
        </ModalRegistrationProvider>
      );
    },
  });
  Utils.Component.mergeStatics(ResultComponent, Component);
  return ResultComponent;
}
//@@viewOff:helpers

let Popover = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Popover",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...PopoverStandard.propTypes,
    bottomSheet: PropTypes.bool,
    zIndex: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...PopoverStandard.defaultProps,
    bottomSheet: undefined,
    borderRadius: undefined, // undefined, because bottomSheet has another default value then standard popover
    zIndex: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { bottomSheet, relative, zIndex, ...propsToPass } = props;
    const { isMobileOrTablet } = useDevice();
    const [screenSize] = useScreenSize();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let result;
    if (bottomSheet != null ? bottomSheet : isMobileOrTablet && screenSize === "xs") {
      result = (
        <WithPortal zIndex={zIndex}>
          <div className={Css.backdrop()} />
          <PopoverBottomSheet {...propsToPass} displayArrow={false} />
        </WithPortal>
      );
    } else {
      result = <PopoverStandard {...propsToPass} />;
      if (!relative) result = <WithPortal zIndex={zIndex}>{result}</WithPortal>;
    }

    return result;
    //@@viewOff:render
  },
});

Popover = withDisabledOnCloseIfActiveNestedModals(Popover);

export { Popover, POPOVER_TYPE };
export default Popover;
