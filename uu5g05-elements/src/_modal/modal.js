//@@viewOn:imports
import {
  createComponent,
  PropTypes,
  usePreviousValue,
  useState,
  Lsi,
  useLayoutEffect,
  _ModalBusContext,
  useDevice,
} from "uu5g05";
import Config from "../config/config.js";
import ModalStandard from "./modal-standard.js";
import ModalBusItem from "./modal-bus-item.js";
import useModalRegistration from "./use-modal-registration.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const DEFAULT_LSI = {
  expand: { import: importLsi, path: ["expand"] },
  collapse: { import: importLsi, path: ["collapse"] },
};

const Modal = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Modal",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...ModalStandard.propTypes,
    closeOnButtonClick: PropTypes.bool,
    collapsible: PropTypes.bool,
    skipModalBus: PropTypes.bool,
    width: PropTypes.oneOfType([PropTypes.unit, PropTypes.oneOf(["full"])]),
    actionLeft: PropTypes.object,
    // TODO This is not used from anywhere (and is intentionally not documented). It does not work properly
    // for Modal-s with long content (such Modal should enlarge page and scrolling the page should scroll the Modal content
    // instead of page). It was originally added during workshop for new DW activities prototype.
    scrollable: PropTypes.bool,
    lsi: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...ModalStandard.defaultProps,
    actionList: [],
    actionLeft: undefined,
    closeOnButtonClick: true,
    collapsible: true,
    headerSeparator: true,
    footerSeparator: true,
    skipModalBus: false,
    width: 640,
    scrollable: true,
    lsi: DEFAULT_LSI,
    open: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { onClose, actionList, closeOnButtonClick, skipModalBus, open, fullscreen, actionLeft, lsi, collapsible } =
      props;

    const { isMobileOrTablet } = useDevice();
    const ctx = _ModalBusContext.useModalBusContext();
    let isUsingModalBus = ctx && !skipModalBus && !fullscreen;

    let [collapsed, setCollapsed] = useState(false);
    let prevOpen = usePreviousValue(open, open);
    if (open !== prevOpen && open && !isUsingModalBus) {
      if (collapsed) setCollapsed(false); // reset "collapsed" if we just opened modal (and are not in modal bus)
    }

    if (isUsingModalBus) {
      collapsed = ctx.collapsed;
      setCollapsed = ctx.setCollapsed;
    }
    const fullLsi = { ...DEFAULT_LSI, ...lsi };

    if (collapsible) {
      const collapsibleLsiPath = [collapsed ? "expand" : "collapse"];
      actionList = [
        ...actionList,
        {
          icon: collapsed ? "uugds-unfold-vertical-more" : "uugds-unfold-vertical-less",
          collapsedChildren: <Lsi lsi={fullLsi[collapsibleLsiPath]} />,
          tooltip: fullLsi[collapsibleLsiPath],
          onClick: () => setCollapsed(!collapsed),
          elementAttrs: { "data-uu5-modal-header-cb": true }, // for animations (getting metrics)
          collapsed: false,
          _collapsedBtn: true,
          order: 1,
        },
      ];
    }

    if (closeOnButtonClick && typeof onClose === "function") {
      actionList = [
        ...actionList,
        {
          icon: "uugds-close",
          onClick: onClose,
          collapsed: false,
          order: 1,
          _closedBtn: true,
          elementAttrs: { "aria-label": "close" },
        },
      ];
    }

    // block main page scrolling for:
    // a) mobile devices with bottom sheet (unless collapsed) - because the behaviour was flaky
    // b) fullscreen modal - so that there aren't 2 scrollbars next to each other (BODY's + Modal's content)
    let blockMainPageScrolling = (isMobileOrTablet && open && !collapsed) || (open && fullscreen);
    useLayoutEffect(() => {
      if (blockMainPageScrolling) {
        // NOTE We might have used `scrollbar-gutter: stable` to reserve space for the scrollbar so that main page
        // content does not jump (widen itself) but for fullscreen Modal-s that would look weird (because Modal
        // does not have right border so it would seem like header separator / close button is displaced) and
        // on mobile devices the scrollbars are not shown so there's no jumping/widening.
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = "";
        };
      }
    }, [blockMainPageScrolling]);

    useModalRegistration(open);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    // const Comp = isUsingModalBus ? ModalBusItem : ModalStandard;
    //
    // return (
    //   <Comp {...props} actionLeft={actionLeft} actionList={actionList} collapsed={collapsed} fullscreen={fullscreen} />
    // );

    const propsToPass = { ...props, actionLeft, actionList, collapsed, fullscreen };
    let result;

    if (isUsingModalBus) {
      result = <ModalBusItem {...propsToPass} />;
    } else {
      result = <ModalStandard {...propsToPass} />;
    }

    return result;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Modal };
export default Modal;
