//@@viewOn:imports
import {
  createVisualComponent,
  PropTypes,
  Utils,
  useState,
  useEffect,
  ContentSizeProvider,
  useContentSizeValue,
  useStickyTop,
  createComponent,
  useMemo,
  useMemoObject,
  useBackground,
  useElementSize,
} from "uu5g05";
import SpacingProvider from "./spacing-provider";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import ScrollableBox from "./scrollable-box.js";
import Overlay from "./_modal/overlay.js";
import Button from "./button.js";
import useModalTransition from "./_modal/use-modal-transition";
//@@viewOff:imports

//@@viewOn:constants
const TRANSITION_DURATION = Config.COLLAPSIBLE_BOX_TRANSITION_DURATION;
const TYPE = {
  ELEVATED: "elevated",
  FLAT: "flat",
  COLLAPSIBLE: "collapsible", // deprecated - replaced by "collapsed" & "expanded"
  COLLAPSED: "collapsed",
  EXPANDED: "expanded",
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main({ open, elevated, collapsed, width, widthCollapsed, height, rightPosition }) {
    const _width = !open || elevated ? 0 : (collapsed ? widthCollapsed : width) + (elevated ? 0 : 1);
    return Config.Css.css({
      display: "grid",
      gridTemplateColumns: `minmax(0, ${_width}px) minmax(0, 1fr)`,
      transition: `grid-template-columns ease ${TRANSITION_DURATION}ms`,
      position: "relative",
      height: height ?? undefined,
      overflow: height ? "hidden" : undefined,
      borderRadius: "inherit",
      direction: rightPosition ? "rtl" : "ltr",
      gridTemplateRows: "minmax(0, 1fr)", // necessary for correct height in a parent with fixed height
    });
  },
  aside({ open, delayed, elevated, collapsed, width, widthCollapsed, background, rightPosition }) {
    const buildingBg = ["light", "soft"].includes(background) ? "light" : "dark";
    const buildingBgReverse = "light" === buildingBg ? "dark" : "light";

    const _width = !open ? 0 : elevated ? width : (collapsed ? widthCollapsed : width) + 1;
    const elevation = UuGds.EffectPalette.getValue(["elevationUpper"]);
    const borderColor = UuGds.getValue(["ColorPalette", "building", buildingBgReverse, "softTransparent"]);
    return Config.Css.css({
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      position: "relative",
      boxShadow: elevated ? getBoxShadowValue(elevation, open) : undefined,
      [rightPosition ? "borderInlineStart" : "borderInlineEnd"]:
        delayed._open && !elevated ? `1px solid ${borderColor}` : undefined,
      width: _width,
      minHeight: 0,
      transition: `width ease ${TRANSITION_DURATION}ms`,
      borderStartStartRadius: "inherit",
      borderEndStartRadius: "inherit",
      direction: "ltr",
    });
  },
  drawer({ open, elevated, collapsed, width, widthCollapsed, background }, stickyTransition) {
    const buildingBg = ["light", "soft"].includes(background) ? "light" : "dark";

    const _width = !open ? 0 : collapsed ? widthCollapsed : width;

    return Config.Css.css({
      backgroundColor: UuGds.getValue(["ColorPalette", "building", buildingBg, "main"]),
      borderStartStartRadius: "inherit",
      borderEndStartRadius: "inherit",
      transition: [`height ease 0.4s`, `max-height ease 0.4s`, `width ease ${TRANSITION_DURATION}ms`, stickyTransition]
        .filter(Boolean)
        .join(", "),
      width: _width,
      flex: "1 1 auto",
      minHeight: 0,
      "& > div": {
        overflow: "hidden",
        height: "100%",
      },
      "&:hover > aside": { opacity: 1 },
    });
  },
  scrollable({ delayed, width, widthCollapsed, height }, padding) {
    const { open, type } = delayed;
    return Config.Css.css({
      height,
      padding,
      width: type === TYPE.COLLAPSED || (type === TYPE.COLLAPSIBLE && !open) ? widthCollapsed : width,
    });
  },
  toggle({ expanded, rightPosition }) {
    const gradientColor = UuGds.ColorPalette.getValue(["meaning", "primary", "softStrongerTransparent"]);
    return Config.Css.css({
      position: "absolute",
      insetBlockStart: 0,
      insetBlockEnd: 0,
      width: 15,
      [rightPosition ? "insetInlineStart" : "insetInlineEnd"]: -8,
      zIndex: 26,
      padding: "64px 0",
      display: "flex",
      alignItems: "flex-end",
      opacity: 0,
      transition: `opacity ease ${TRANSITION_DURATION}ms`,
      cursor: "pointer",
      "&::before": {
        content: "''",
        position: "absolute",
        zIndex: -1,
        width: 15,
        insetBlockStart: 0,
        insetBlockEnd: 0,
        insetInlineStart: 0,
        background: `linear-gradient(to ${rightPosition ? "left" : "right"}, transparent 0%, ${gradientColor} 52%, transparent 53%)`,
        transform: `scaleX(${expanded ? 1 : -1})`,
        opacity: 0,
        transition: `transform ease ${TRANSITION_DURATION}ms, opacity ease ${TRANSITION_DURATION}ms`,
      },
      "&:hover::before": { opacity: 1 },
      "& > *": { margin: "0 -5px" },
    });
  },
  overlay() {
    return Config.Css.css({
      zIndex: 24,
      direction: "ltr",
    });
  },
  children({ height, padding, children }) {
    return Config.Css.css({
      ...(typeof padding === "object" ? padding : { padding }),
      maxHeight: height ? undefined : "100%",
      minWidth: 0,
      direction: "ltr",
      ...(typeof children === "function" ? { display: "flex", flexDirection: "column", minHeight: 0 } : undefined),
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getBoxShadowValue({ inset, offsetX, offsetY, blurRadius, spreadRadius, color }, open) {
  return `${inset ? "inset" : ""} ${offsetX}px ${offsetY}px ${blurRadius}px ${spreadRadius}px ${
    open ? color : "transparent"
  }`;
}

function withCustomStickyTop(Component) {
  let ResultComponent = createComponent({
    uu5Tag: Config.TAG + `withCustomStickyTop(${Component.uu5Tag})`,
    render(props) {
      const { style: propsStyle } = props;
      const { style: stickyStyle, ref, metrics } = useStickyTop("always", true, 0);
      const styleObject = typeof propsStyle === "string" ? Utils.Style.parse(propsStyle) : propsStyle;

      const style = useMemoObject({
        ...styleObject,
        ...stickyStyle,
        // TODO If our scrollContainer isn't window, we should be using `${scrollContainerHeight}px` instead of `100vh`.
        maxHeight: `calc(100vh - ${
          Math.max(metrics?.offsetToStickyBoundary || 0, 0) + (metrics?.precedingItemsStuckHeight || 0)
        }px)`,
      });

      const rendered = useMemo(
        () => <Component {...props} style={style} elementRef={Utils.Component.combineRefs(ref, props.elementRef)} />,
        [props, ref, style],
      );
      return rendered;
    },
  });
  Utils.Component.mergeStatics(ResultComponent, Component);
  return ResultComponent;
}

function getToggleIcon(rightPosition, expanded) {
  const position = ["right", "left"];

  if (expanded) position.reverse();
  if (rightPosition) position.reverse();

  return "uugds-" + position[0];
}
//@@viewOff:helpers

const _Drawer = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Drawer",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    type: PropTypes.sizeOf(PropTypes.oneOf(Object.values(TYPE))),
    position: PropTypes.oneOf(["left", "right"]),
    open: PropTypes.bool,
    onChange: PropTypes.func,
    onClose: PropTypes.func, // deprecated
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    offsetTop: PropTypes.number,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    widthCollapsed: PropTypes.number,
    content: PropTypes.any,
    padding: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
    spacing: PropTypes.oneOf(["tight", "normal", "loose"]),
    collapsible: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    type: { xs: TYPE.ELEVATED, m: TYPE.FLAT },
    position: "left",
    open: true,
    height: undefined,
    offsetTop: undefined,
    width: 248,
    widthCollapsed: 68,
    padding: undefined,
    spacing: "normal",
    collapsible: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      position,
      open,
      width: propsWidth,
      widthCollapsed,
      height,
      offsetTop,
      spacing,
      elementRef,
      style: propsStyle,
      onChange,
      onClose,
      content,
      children,
      padding,
      collapsible,
      _drawerClassName,
      ...restProps
    } = props;
    const { transition, ...style } = propsStyle || {};
    if (offsetTop !== undefined) {
      style.top = offsetTop;
    }

    const type = useContentSizeValue(props.type);
    const _open = type === TYPE.COLLAPSIBLE || open;

    const background = useBackground();

    const [delayed, setDelayed] = useState({ open, _open, type });

    useEffect(() => {
      if (!open || (type === TYPE.COLLAPSED && delayed.type === TYPE.EXPANDED)) {
        const timer = setTimeout(() => setDelayed({ open, _open, type }), TRANSITION_DURATION);
        return () => clearTimeout(timer);
      } else {
        setDelayed({ open, _open, type });
      }
    }, [open, _open, type]);

    // for using 50% of width
    const { ref, width: elementWidth } = useElementSize();
    const width =
      typeof propsWidth === "string" && propsWidth.endsWith("%")
        ? Math.round((elementWidth * parseInt(propsWidth)) / 100)
        : propsWidth;

    const features = {
      elevated: type === TYPE.ELEVATED,
      flat: type === TYPE.FLAT,
      collapsible: type === TYPE.COLLAPSIBLE, // deprecated type - props.open controls drawer width instead of drawer visiblity
      collapsed: type === TYPE.COLLAPSED || (type === TYPE.COLLAPSIBLE && !open),
      expanded: type === TYPE.EXPANDED || (type === TYPE.COLLAPSIBLE && open),
      expandable: [TYPE.COLLAPSED, TYPE.EXPANDED].includes(type),
      switchable: [TYPE.COLLAPSIBLE, TYPE.COLLAPSED, TYPE.EXPANDED].includes(type), // can be switched from narrow to wide and vice versa
      rightPosition: position === "right",
      height,
      width,
      widthCollapsed,
      open: _open, // = drawer is visible,
      delayed,
    };

    useEffect(() => {
      features.delayed = delayed;
    }, [delayed]);

    const handleToggle = (event) => {
      const data = features.collapsible
        ? { open: !open }
        : features.expanded
          ? { type: TYPE.COLLAPSED }
          : { type: TYPE.EXPANDED };
      onChange && onChange(new Utils.Event(data, event));
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    // TODO id, className, ..., is on aside, but elementRef & style on aside>div. :-/
    const attrs = Utils.VisualComponent.getAttrs(restProps, Css.aside({ ...features, background }));
    const { ref: overlayRef, overlayClassName } = useModalTransition(open, false);
    attrs["aria-expanded"] = open ? "true" : "false";

    const ChildrenWrapper = height ? ScrollableBox : "div";

    return (
      <div ref={ref} className={Utils.Css.joinClassName(Css.main(features), _drawerClassName)}>
        <SpacingProvider type={spacing}>
          {({ c: padding }) => (
            <aside {...attrs}>
              <div ref={elementRef} className={Css.drawer({ ...features, background }, transition)} style={style}>
                {content && (
                  <>
                    <div>
                      <ScrollableBox
                        className={Css.scrollable(features, typeof content === "function" ? undefined : padding)}
                        maxHeight="100%"
                        height="100%"
                        _skipRenderLoopDetection
                        testId="scrollable-box"
                      >
                        {typeof content === "function"
                          ? content({
                              open: delayed.open,
                              type: delayed.type,
                              style: {
                                paddingTop: padding,
                                paddingBottom: padding,
                                paddingLeft: padding,
                                paddingRight: padding,
                              },
                            })
                          : content}
                      </ScrollableBox>
                    </div>
                    {features.switchable && (
                      <aside className={collapsible ? Css.toggle(features) : undefined} onClick={handleToggle}>
                        <Button
                          icon={getToggleIcon(features.rightPosition, features.expanded)}
                          size="xxs"
                          significance="highlighted"
                          colorScheme="primary"
                        />
                      </aside>
                    )}
                  </>
                )}
              </div>
            </aside>
          )}
        </SpacingProvider>

        <ContentSizeProvider>
          <ChildrenWrapper className={Css.children(props)} {...(height ? { maxHeight: "100%" } : {})}>
            {typeof children === "function" ? children({}) : children}
          </ChildrenWrapper>
        </ContentSizeProvider>

        {features.elevated && delayed.open && (
          <Overlay
            className={`${overlayClassName} ${Css.overlay(features)}`}
            elementRef={overlayRef}
            onClose={(event) => (onChange ? onChange(new Utils.Event({ open: false }, event)) : onClose && onClose())}
            closeOnOverlayClick
            drawerMode
          />
        )}
      </div>
    );
    //@@viewOff:render
  },
});

const Drawer = withCustomStickyTop(_Drawer);

//@@viewOn:exports
export { Drawer };
export default Drawer;
//@@viewOff:exports
