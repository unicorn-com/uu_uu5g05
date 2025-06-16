//@@viewOn:imports
import {
  createVisualComponent,
  PropTypes,
  Utils,
  useRef,
  useEffect,
  Content,
  BackgroundProvider,
  Lsi,
  useDevice,
  useState,
  useAppBackground,
  PortalElementProvider,
} from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import Text from "../text.js";
import useSpacing from "../use-spacing.js";
import Body from "../_internal/body.js";
import useModalCollapseAnimation from "./use-modal-collapse-animation.js";
import Header from "../_internal/header.js";
import ContextCenterButton from "../context-center-button.js";
import { POPOVER_TYPE } from "../popover.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const DEFAULT_LSI = {
  moreInfo: { import: importLsi, path: ["moreInfo"] },
};

const HEADER_TYPE = {
  tight: "micro",
  normal: "minor",
  loose: "common",
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main({ disabled, width, fullscreen, borderRadius, shapeStyles, _maxHeight }, isMobileOrTablet, browserName) {
    const staticClassName = Config.Css.css({
      display: "flex",
      flexDirection: "column",
      transition: `background-color ${Config.MODAL_TRANSITION_DURATION}ms`,
      outline: "none",

      padding: 0,
      position: "relative",
      margin: "0 auto",
      maxWidth: "100%",
      maxHeight: _maxHeight ? _maxHeight : "100%",
      // NOTE Not using `overflow: hidden` because:
      // 1. In Chrome when modal has scrollbar, Chrome *in some cases* inverts
      //    the -webkit-mask in ScrollableBox, i.e. the body is black and at the bottom ~40px (where indicator is)
      //    is a transition from black to visible content. Probably bug like
      //    https://bugs.chromium.org/p/chromium/issues/detail?id=1229700
      //    Simulation:
      //    i. Use uu5string:
      //       <UuForum.Questionnaire.Questionnaire baseUri="https://uuapp.plus4u.net/uu-forum-maing02/079b02fde54145a1b2c4d7b4f566852b" code="7811111111111211112111211111111111111111111111111111111111112035" expanded/>
      //    ii. Menu (cog wheel) -> Edit Questionnaire => black Modal is shown.
      // 2. We want nested Popovers (which have their portal element nested in Modal) to go beyond Modal.
    });

    if (!fullscreen) {
      const radius = UuGds.getValue(["RadiusPalette", "box", borderRadius]);
      if (radius) {
        shapeStyles.borderRadius = radius && typeof radius === "object" ? radius.max : radius;
      }
    }

    if (disabled) {
      // prettier-ignore
      shapeStyles.backgroundColor = UuGds.getValue([
        "Shape", "overlay", "light", "building", "distinct", "default", "colors", "background"
      ]);
    }

    if (isMobileOrTablet) {
      shapeStyles.paddingBottom = "env(safe-area-inset-bottom)";
    }

    Object.assign(shapeStyles, {
      width: fullscreen || isMobileOrTablet ? "100%" : width === null ? undefined : width === "full" ? "100%" : width,
      height: fullscreen ? "100%" : undefined,
    });

    const dynamicClassName = Config.Css.css(shapeStyles);

    return [staticClassName, dynamicClassName].join(" ");
  },

  header({ onHeaderClick, actionGroupStyle, trapFocus, restrainedHeader }) {
    return Config.Css.css({
      flex: "none",
      cursor: onHeaderClick ? "pointer" : "grab",
      "&>*:last-child": actionGroupStyle,
      outline: trapFocus === "header" ? "none" : undefined,
      zIndex: restrainedHeader ? 1 : undefined,
    });
  },

  title({ disabled }) {
    return Config.Css.css({
      pointerEvents: disabled ? "none" : undefined,
      visibility: "visible",
      overflow: "hidden",
      textOverflow: "ellipsis",
    });
  },

  body({ disabled }) {
    let staticCss = Config.Css.css({
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      borderRadius: "inherit",
    });

    let dynamicStyles;
    if (disabled) {
      dynamicStyles = {
        // prettier-ignore
        backgroundColor: UuGds.getValue(["Shape", "overlay", "light", "building", "distinct", "default", "colors", "background"]),
        pointerEvents: "none",
      };
    }
    let dynamicCss = dynamicStyles ? Config.Css.css(dynamicStyles) : undefined;

    return Utils.Css.joinClassName(staticCss, dynamicCss);
  },

  content({ scrollable, header, footer }) {
    let dynamicStyles = {};
    if (!header) {
      dynamicStyles.borderTopLeftRadius = "inherit";
      dynamicStyles.borderTopRightRadius = "inherit";
    }
    if (!footer) {
      dynamicStyles.borderBottomLeftRadius = "inherit";
      dynamicStyles.borderBottomRightRadius = "inherit";
    }
    if (scrollable) {
      dynamicStyles.overscrollBehavior = "none";
    }
    return Config.Css.css(dynamicStyles);
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getShapeStyles({ background, colorScheme = "building", significance = "common" }) {
  const states = UuGds.getValue(["Shape", "overlay", background, colorScheme, significance]);
  const gdsBackground = states.default.colors?.gdsBackground;
  const styles = UuGds.Shape.getStateStyles(states.default, true);
  return [styles, gdsBackground];
}

function matchPopoverPortalType({ type }) {
  return type.startsWith(POPOVER_TYPE);
}

//@@viewOff:helpers

let ModalContent = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ModalContent",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    borderRadius: PropTypes.oneOf(["none", "elementary", "moderate", "expressive"]),
    lsi: PropTypes.object,
    trapFocus: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(["header"])]),
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    header: " ",
    borderRadius: "moderate",
    lsi: DEFAULT_LSI,
    trapFocus: true,
    colorScheme: "building",
    significance: "common",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      actionList,
      actionLeft,
      actionCollapsedMenuProps,
      header,
      headerSeparator,
      onHeaderClick: propsOnHeaderClick,
      footer,
      footerSeparator,
      info,
      initialDisplayInfo,
      infoIcon,
      children,
      onMoveStart,
      collapsed,
      disabled,
      metrics,
      scrollable,
      fullscreen,
      lsi,
      width,
      trapFocus,
      focusLockComponent: FocusLockComponent,
      colorScheme,
      significance,
      restrainedHeader,
      ...otherProps
    } = props;

    const [displayInfo, setDisplayInfo] = useState(initialDisplayInfo);

    const { isMobileOrTablet, browserName } = useDevice();

    const { dialogStyle, actionGroupStyle, headerTextStyle, buttonStyle, collapseButtonStyle, bodyStyle } =
      useModalCollapseAnimation(collapsed, metrics);
    const dialogRef = useRef();
    useEffect(() => {
      if (dialogRef.current) {
        if (!dialogRef.current.contains(document.activeElement)) {
          dialogRef.current.focus();
        }
      }
    }, []);

    // Modal/Popover - do not fall back to parent background (but fall back to app background / dark mode setting)
    const [appBackground] = useAppBackground();
    const background = appBackground;
    let [shapeStyles, gdsBackground] = getShapeStyles({ background, colorScheme, significance });
    const fullLsi = { ...DEFAULT_LSI, ...lsi };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(
      otherProps,
      Css.main({ ...props, shapeStyles }, isMobileOrTablet, browserName),
    ); // otherProps excluding "disabled"

    let extendedActionLeft = actionLeft ? { ...actionLeft, disabled: actionLeft.disabled || collapsed } : actionLeft;
    let extendedActionList = actionList || [];

    const isDeprecatedInitialDisplayInfo = !Array.isArray(info) && initialDisplayInfo;

    if (info) {
      let infoAction = {
        tooltip: fullLsi.moreInfo,
        style: props.headerButtonStyle,
      };

      if (isDeprecatedInitialDisplayInfo) {
        infoAction = {
          ...infoAction,
          icon: Config.INFO_ICON,
          collapsedChildren: <Lsi lsi={fullLsi.moreInfo} />,
          pressed: displayInfo,
          onClick: () => setDisplayInfo((open) => !open),
        };
      } else {
        infoAction = {
          ...infoAction,
          component: (
            <ContextCenterButton info={info}>
              <Lsi lsi={fullLsi.moreInfo} />
            </ContextCenterButton>
          ),
          collapsed: isMobileOrTablet ? undefined : false,
        };
      }

      extendedActionList = [...extendedActionList, infoAction];
    }

    extendedActionList = extendedActionList.map((it) => {
      const result = {
        ...it,
        disabled: it.disabled === undefined ? !it._collapsedBtn && !it._modalList && disabled : it.disabled,
        style: { ...it.style, ...(it._collapsedBtn ? collapseButtonStyle : buttonStyle) },
      };

      return result;
    });

    const onHeaderMouseDown =
      typeof onMoveStart === "function"
        ? (event) => {
            // ignore mousedown if clicking outside of header (i.e. into different portal such as Dropdown's popover content)
            let { currentTarget, target } = event;
            if (currentTarget === target || currentTarget.contains(event.target)) onMoveStart(event);
          }
        : undefined;

    function onHeaderClick(e) {
      if (typeof propsOnHeaderClick === "function" && e.currentTarget.contains(e.target)) {
        // Prevent trigger when clicking overlay or actionList
        propsOnHeaderClick(e);
      }
    }

    const spacing = useSpacing();

    return (
      <BackgroundProvider background={gdsBackground ?? appBackground}>
        <FocusLockComponent disabled={trapFocus !== true}>
          {({ ref: focusLockRef, className: focusLockClassName, ...focusLockElementProps }) => (
            <dialog
              open
              {...attrs}
              style={{ ...attrs.style, ...dialogStyle }}
              tabIndex={0}
              {...focusLockElementProps} // onFocus, onBlur, data-focus-lock*
              className={Utils.Css.joinClassName(attrs.className, focusLockClassName)}
              ref={Utils.Component.combineRefs(attrs.ref, dialogRef, focusLockRef)}
            >
              <PortalElementProvider filter={matchPopoverPortalType} skipModalBus>
                {header != null && (
                  <FocusLockComponent disabled={trapFocus !== "header"}>
                    {({ ref: focusLockRef, className: focusLockClassName, ...focusLockElementProps }) => (
                      <Header
                        actionLeft={extendedActionLeft}
                        actionList={extendedActionList}
                        className={Utils.Css.joinClassName(
                          Css.header({ ...props, actionGroupStyle, trapFocus }),
                          focusLockClassName,
                        )}
                        elementAttrs={{
                          onMouseDown: isMobileOrTablet ? undefined : onHeaderMouseDown,
                          onClick: onHeaderClick,
                          "data-uu5-modal-header": true, // for animations (getting metrics)
                          tabIndex: trapFocus === "header" ? 0 : undefined, // for case when header has no focusable element
                          ...focusLockElementProps,
                        }}
                        elementRef={focusLockRef}
                        style={props.headerStyle}
                        separator={headerSeparator && !restrainedHeader}
                        actionCollapsedMenuProps={{
                          ...actionCollapsedMenuProps,
                          style: { ...actionCollapsedMenuProps?.style, ...buttonStyle },
                        }}
                        overlaid={restrainedHeader}
                      >
                        {!restrainedHeader ? (
                          <Text
                            className={Css.title({ ...props })}
                            category="interface"
                            segment="title"
                            type={HEADER_TYPE[spacing.type]}
                            style={{ ...props.headerTextStyle, ...headerTextStyle }}
                          >
                            <Content nestingLevel="spotCollection">{header}</Content>
                          </Text>
                        ) : null}
                      </Header>
                    )}
                  </FocusLockComponent>
                )}

                <Body
                  footer={footer}
                  footerSeparator={footerSeparator}
                  {...(isDeprecatedInitialDisplayInfo && { displayInfo, info, infoIcon })}
                  paddingHorizontal
                  paddingTop={headerSeparator}
                  className={Css.body(props)}
                  contentMaxHeight="auto"
                  contentClassName={Css.content(props)}
                  style={{ ...props.bodyStyle, ...bodyStyle }}
                  skipContentSizeProvider={width === null}
                  width={typeof width === "number" ? width : undefined}
                  scrollable={scrollable}
                  scrollIndicator={{
                    top: header == null ? "disappear" : "gradient",
                    bottom: footer == null ? "disappear" : "gradient",
                  }}
                  // TODO Revert commit where this was introduced. Hotfix for uuDocKit presentation mode.
                  _showScrollIndicators={!fullscreen}
                >
                  {children}
                </Body>
              </PortalElementProvider>
            </dialog>
          )}
        </FocusLockComponent>
      </BackgroundProvider>
    );
    //@@viewOff:render
  },
});
ModalContent = process.env.NODE_ENV !== "test" ? Utils.Component.memo(ModalContent) : ModalContent; // optimize so that dragging standalone Modals (outside of ModalBus) is fast

export { ModalContent, matchPopoverPortalType, getShapeStyles };
export default ModalContent;
