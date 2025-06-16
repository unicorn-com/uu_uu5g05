//@@viewOn:imports
import {
  createComponent,
  createVisualComponent,
  Utils,
  PropTypes,
  usePreviousValue,
  useRef,
  useState,
  useEffect,
  useMemo,
  useDevice,
  useScreenSize,
  _ModalBusContext,
} from "uu5g05";
import Config from "../config/config.js";
import ModalContent from "./modal-content.js";
import useModalPortalElement from "./use-modal-portal-element.js";
import Overlay from "./overlay.js";
import useModalTransition from "./use-modal-transition.js";
import ModalView from "./modal-view.js";
import ActionGroup from "../action-group.js";
import { getMetrics } from "./modal-metrics.js";
import ModalBus from "../modal-bus";

//@@viewOff:imports

function withModalBus(Component) {
  return createComponent({
    uu5Tag: `withModalBus(${Component.displayName})`,
    render(props) {
      const ctx = _ModalBusContext.useModalBusContext();
      const hasTopLevelModalBus = !!ctx;

      let content = <Component {...props} />;
      if (hasTopLevelModalBus) {
        content = <ModalBus>{content}</ModalBus>;
      }
      return content;
    },
  });
}

const ModalContentWithModalBus = withModalBus(ModalContent);

const ModalStandard = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ModalStandard",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Overlay.propTypes,

    open: PropTypes.bool,
    actionList: ActionGroup.propTypes.itemList,
    header: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    headerSeparator: PropTypes.bool,
    footer: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    footerSeparator: PropTypes.bool,
    info: PropTypes.oneOfType([PropTypes.node, PropTypes.array]),
    initialDisplayInfo: PropTypes.bool,
    fullscreen: PropTypes.bool,
    borderRadius: PropTypes.oneOf(["none", "elementary", "moderate", "expressive"]),
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
    restrainedHeader: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...Overlay.defaultProps,

    open: false,
    actionList: undefined,
    actionCollapsedMenuProps: undefined,
    header: undefined,
    headerSeparator: undefined,
    footer: undefined,
    footerSeparator: undefined,
    info: undefined,
    initialDisplayInfo: false,
    fullscreen: false,
    borderRadius: "moderate",
    colorScheme: "building",
    significance: "common",
    restrainedHeader: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { open, collapsed, children, onClose, closeOnEsc, closeOnOverlayClick, fullscreen, ...propsToPass } = props;
    const { disabled } = propsToPass;

    const { isMobileOrTablet } = useDevice();
    const [screenSize] = useScreenSize();

    const element = useModalPortalElement();

    const { ref: overlayRef, displayed, overlayClassName, dialogClassName } = useModalTransition(open, true);

    const dialogRef = useRef();
    const prevCollapsed = usePreviousValue(collapsed, collapsed);
    let [metrics, setMetrics] = useState();
    if (!displayed && metrics) setMetrics((metrics = undefined));
    let metricsUpdatedRef = useRef();
    if (displayed && collapsed && !prevCollapsed && !metricsUpdatedRef.current) {
      metricsUpdatedRef.current = true;
      if (dialogRef.current) setMetrics((metrics = getMetrics(dialogRef.current)));
    }
    useEffect(() => {
      metricsUpdatedRef.current = false;
    });

    let memoOnMoveStart = useMemo(
      () =>
        Utils.Function.memo((onMoveStart) => (...args) => {
          if (!collapsed) setMetrics(getMetrics(dialogRef.current));
          onMoveStart(...args);
        }),
      [collapsed],
    );

    let styles;
    let _bottomSheetDisabled = true;
    if (isMobileOrTablet && screenSize === "xs") {
      styles = Config.Css.css({ "&&": { borderBottomRightRadius: 0, borderBottomLeftRadius: 0 } });
      _bottomSheetDisabled = false;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      displayed &&
      Utils.Dom.createPortal(
        <Overlay
          className={overlayClassName}
          elementRef={overlayRef}
          onClose={onClose}
          closeOnEsc={disabled ? false : closeOnEsc}
          closeOnOverlayClick={disabled ? false : closeOnOverlayClick}
        >
          <ModalView
            className={dialogClassName}
            collapsed={collapsed}
            fullscreen={fullscreen}
            metrics={metrics}
            // passing prop instead of using different component (with HOC vs. without HOC) so that if user
            // has xs screensize and rotates mobile to screensize s, ModalView should not remount (it must not be different class)
            _bottomSheetDisabled={_bottomSheetDisabled}
          >
            {({ onMoveStart }) => (
              <ModalContentWithModalBus
                {...propsToPass}
                className={Utils.Css.joinClassName(props.className, styles)}
                elementRef={Utils.Component.combineRefs(props.elementRef, dialogRef)}
                onMoveStart={memoOnMoveStart(onMoveStart)}
                collapsed={collapsed}
                fullscreen={fullscreen}
                metrics={metrics}
              >
                {children}
              </ModalContentWithModalBus>
            )}
          </ModalView>
        </Overlay>,
        element,
      )
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { ModalStandard };
export default ModalStandard;
