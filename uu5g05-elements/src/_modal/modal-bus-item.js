//@@viewOn:imports
import { createVisualComponent, Utils, Lsi, useRef, useDevice, useState, useLayoutEffect } from "uu5g05";
import Config from "../config/config.js";
import useModalBus from "./use-modal-bus.js";
import ModalContent from "./modal-content.js";
import useModalBusActiveAnimation, {
  TRANSITION_OPACITY_DURATION,
  TRANSITION_SIZING_DURATION,
} from "./use-modal-bus-active-animation.js";
//@@viewOff:imports

const Css = {
  main: ({ indexOffset, collapsed, isMobileOrTablet, isTransiting }) => {
    let styles = { opacity: collapsed && indexOffset ? "0" : isTransiting ? undefined : "1" };

    if (isMobileOrTablet) {
      styles = {
        ...styles,
        flex: "0 0 auto",
        minHeight: 0,
      };
    }

    return Config.Css.css(styles);
  },
};

const ModalBusItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ModalBusItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { actionList, children, open, collapsed, onClose, closeOnEsc, closeOnOverlayClick, info, ...propsToPass } =
      props;
    let { width, id, header, disabled } = props;

    const onCloseRef = useRef();
    useLayoutEffect(() => {
      onCloseRef.current = onClose;
    });
    const onCloseStableInstance = useRef((...args) => onCloseRef.current?.(...args)).current;
    const headerRef = useRef();
    headerRef.current = header;
    const getHeader = useRef((...args) =>
      typeof headerRef.current === "function" ? headerRef.current?.(...args) : headerRef.current,
    ).current;
    // these are required for ModalBus-related stuff (ModalBus Overlay, ModalBus.RestoreButton, ...)
    // NOTE Adding anything here can cause re-rendering loop (CPU utilization) if such prop changes with each render (e.g. arrow function, ...).
    let modalProps = {
      onClose: typeof onClose === "function" ? onCloseStableInstance : undefined,
      closeOnEsc: !!closeOnEsc,
      closeOnOverlayClick: !!closeOnOverlayClick,
      id,
      disabled: !!disabled,
      getHeader,
    };

    let dialogRef = useRef();

    const { isMobileOrTablet } = useDevice();

    const {
      isRegistered,
      container,
      setActive,
      isLast,
      index,
      activeIndex,
      onMoveStart,
      itemList,
      isActive,
      metrics,
      lsi,
    } = useModalBus(open, modalProps, dialogRef);
    let [initialized, setInitialized] = useState(isRegistered && !!metrics);
    if (!initialized && open && isRegistered && !!metrics) {
      initialized = true;
      setInitialized(initialized);
    } else if (initialized && !container) {
      initialized = false;
      setInitialized(initialized);
    }

    let indexOffset = index - activeIndex;
    let activeMetrics = itemList[activeIndex]?.metrics;

    let { dialogStyle, headerStyle, headerTextStyle, buttonStyle, collapseButtonStyle, bodyStyle, isTransiting } =
      useModalBusActiveAnimation(
        initialized,
        index,
        activeIndex,
        itemList.length,
        dialogRef,
        metrics,
        activeMetrics,
        isMobileOrTablet,
      );
    // extra animation for collapsing inactive ModalBusItem-s
    if (initialized && !isTransiting) {
      let extraCollapseDialogTransition = `opacity ${TRANSITION_OPACITY_DURATION}ms ${
        collapsed && indexOffset ? 0 : TRANSITION_SIZING_DURATION + TRANSITION_OPACITY_DURATION
      }ms ease`;
      if (dialogStyle?.transition) {
        dialogStyle.transition += ", " + extraCollapseDialogTransition;
      } else {
        if (!dialogStyle) dialogStyle = {};
        dialogStyle.transition = extraCollapseDialogTransition;
      }
    }

    actionList = actionList.map((it) => ({
      ...it,
      style: { ...it.style, ...(it._collapsedBtn ? collapseButtonStyle : buttonStyle) },
    }));

    if (!isLast) {
      // Make sure that ActionGroup renders to establish height
      actionList = [{}];
    }

    if (itemList.length > 3) {
      let modalListDropdown = {
        icon: "uugdsstencil-uiaction-modalbus",
        collapsedChildren: <Lsi lsi={lsi.modalList} />,
        tooltip: lsi.modalList,
        iconOpen: null,
        iconClosed: null,
        itemList: itemList.map((it, i) => ({
          children: typeof it.props.getHeader === "function" ? it.props.getHeader() : it.props.getHeader,
          significance: activeIndex === i ? "distinct" : undefined,
          colorScheme: activeIndex === i ? "primary" : undefined,
          onClick: () => setActive(it.id),
        })),
        style: buttonStyle,
        _modalList: true,
      };
      let index = actionList.findIndex((it) => it._collapsedBtn || it._closedBtn);
      actionList = [...actionList];
      actionList.splice(index !== -1 ? index : actionList.length, 0, modalListDropdown);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      container &&
      Utils.Dom.createPortal(
        <ModalContent
          {...propsToPass}
          className={Utils.Css.joinClassName(
            Css.main({ indexOffset, collapsed, isMobileOrTablet, isTransiting }),
            props.className,
          )}
          elementRef={Utils.Component.combineRefs(props.elementRef, dialogRef)}
          style={{ ...props.style, ...dialogStyle }}
          disabled={!isLast || props.disabled}
          headerStyle={headerStyle}
          headerButtonStyle={buttonStyle} // needed because ModalContent renders "info" button
          headerTextStyle={headerTextStyle}
          info={isLast ? info : undefined}
          actionList={actionList}
          actionCollapsedMenuProps={{ style: buttonStyle }}
          onMoveStart={onMoveStart}
          onHeaderClick={!isActive ? () => setActive() : undefined}
          bodyStyle={bodyStyle}
          collapsed={collapsed}
          width={width}
          metrics={isActive ? metrics : undefined} // this will effectively turn off collapse animation for inactive items (we pass direct "style" for animating those)
          trapFocus={isActive && isLast && !collapsed ? true : isActive || collapsed ? "header" : false}
          elementAttrs={{ ...propsToPass.elementAttrs, "aria-modal": isActive ? "true" : "false" }}
          restrainedHeader={propsToPass.restrainedHeader && isActive && isLast}
        >
          {children}
        </ModalContent>,
        container,
      )
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { ModalBusItem };
export default ModalBusItem;
