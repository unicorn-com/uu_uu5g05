//@@viewOn:imports
import {
  createComponent,
  PropTypes,
  useLayoutEffect,
  useRef,
  useState,
  Utils,
  useBackground,
  useDevice,
  useElementSize,
  BackgroundProvider,
} from "uu5g05";
import Uu5Elements, { UuGds } from "uu5g05-elements";
import Config from "./config/config.js";
//@@viewOff:imports

const COLOR_SCHEME_MAP = Config.COLOR_SCHEME_MAP;

const FEEDBACK_ICON_MAP = {
  success: "uugds-check-circle",
  warning: "uugds-alert-circle",
  error: "uugds-alert-circle-solid",
};

const ICON_SIZE = {
  xxs: "m",
  xs: "m",
  s: "l",
  m: "l",
  l: "xl",
  xl: "xl",
};

const PENDING_SIZE = {
  xxs: "xxs",
  xs: "xxs",
  s: "xs",
  m: "xs",
  l: "m",
  xl: "m",
};

const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;
const TEXT_TYPE_MAP_MOBILE = Uu5Elements.Input._TEXT_TYPE_MAP_MOBILE;
const TEXT_TYPE_MAP = Uu5Elements.Input._TEXT_TYPE_MAP;

const BEFORE_STYLES = {
  display: "inline-flex",
  position: "absolute",
  height: "100%",
  pointerEvents: "none",
};

const EXTENSION_STYLES = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
};

const Css = {
  main: ({ width, pending }) =>
    Config.Css.css({
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      width,
      minWidth: 0,
      pointerEvents: pending ? "none" : undefined,
    }),
  before: () => {
    return Utils.Css.joinClassName(Config.Css.css({ ...BEFORE_STYLES, left: 0 }));
  },
  after: (scrollbarWidth = 0) => {
    return Utils.Css.joinClassName(Config.Css.css({ ...BEFORE_STYLES, right: scrollbarWidth }));
  },
  pending: (height = 0) =>
    Config.Css.css({
      display: "flex",
      alignItems: "center",
      paddingLeft: Uu5Elements.UuGds.getValue(["SpacingPalette", "inline", "d"]),
      paddingRight: Uu5Elements.UuGds.getValue(["SpacingPalette", "relative", "c"]) * height,
    }),
  extension: ({ containerSize }, styles) => {
    const { h: height } = Uu5Elements.UuGds.getValue(["SizingPalette", "spot", "basic", containerSize]) || {};

    return Utils.Css.joinClassName(
      Config.Css.css({
        ...EXTENSION_STYLES,
        height,
        lineHeight: "normal",
        ...(top ? { top: 0 } : undefined),
      }),
      Config.Css.css(styles),
    );
  },
  hidePatch: ({ height, offset, significance }) => {
    // Workaround for Firefox because we cannot hide native date input icon by css.
    // We render span element which covers this icon.
    return Config.Css.css({
      position: "absolute",
      backgroundColor: significance === "highlighted" ? undefined : "white", // We cannot determine if input elements is hovered, for that reason we cannot properly set color if significance is highlighted
      right: offset ? offset : 0,
      top: 0,
      width: height - 2,
      height: height - 2,
      margin: 1,
      borderRadius: "100%",
    });
  },
};

function Icon(props) {
  const { onClick, className, size, containerSize, textType, top, colorScheme = "building", ...restProps } = props;

  const { fontSize } = UuGds.getValue(["Typography", "interface", "content", textType]); // icon font size is based on input text

  const { h: iconHeight } =
    Uu5Elements.UuGds.getValue(["SizingPalette", "spot", "minor", ICON_SIZE[containerSize]]) || {};
  const { h: height } = Uu5Elements.UuGds.getValue(["SizingPalette", "spot", "basic", containerSize]) || {};

  return (
    <Uu5Elements.Icon
      {...restProps}
      colorScheme={colorScheme}
      onClick={onClick}
      className={Utils.Css.joinClassName(
        className,
        Config.Css.css({
          ...EXTENSION_STYLES,
          ...(typeof onClick === "function" ? { pointerEvents: "auto" } : undefined),
        }),
        Config.Css.css({
          fontSize,
          height,
          ...(top ? { top: 0 } : undefined),
          "&&::before": {
            fontSize: "1.5em",
            width: iconHeight,
            height: iconHeight,
            lineHeight: iconHeight + "px",
          },
        }),
      )}
      elementAttrs={{
        // NOTE: not loose focus if user click to icon
        onMouseDown: (e) => e.preventDefault(),
      }}
    />
  );
}

function _withExtensionInput(Input, defaultProps = {}, { clickableReadOnlyIconKeySet } = {}) {
  let { extensionPosition: staticExtensionPosition, ...restDefaultProps } = defaultProps;

  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + (Input ? `withExtensionInput(${Input.uu5Tag || Input.displayName})` : "ExtensionInput"),
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Input?.propTypes,
      iconLeft: Uu5Elements.Icon.propTypes.icon,
      onIconLeftClick: PropTypes.func,
      iconRight: Uu5Elements.Icon.propTypes.icon,
      onIconRightClick: PropTypes.func,
      iconRightList: PropTypes.arrayOf(PropTypes.shape({ icon: PropTypes.string, onClick: PropTypes.func })),
      prefix: PropTypes.node,
      suffix: PropTypes.node,
      feedback: PropTypes.string,
      feedbackIcon: PropTypes.icon,
      feedbackRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
      onFeedbackClick: PropTypes.func,
      pending: PropTypes.bool,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Input?.defaultProps,
      iconLeft: undefined,
      onIconLeftClick: undefined,
      iconRight: undefined,
      onIconRightClick: undefined,
      iconRightList: [],
      prefix: undefined,
      suffix: undefined,
      feedback: undefined,
      feedbackIcon: undefined,
      feedbackRef: undefined,
      onFeedbackClick: undefined,
      pending: false,
      ...restDefaultProps,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      let {
        pending,
        feedback,
        feedbackIcon,
        feedbackRef,
        onFeedbackClick,
        iconLeft,
        onIconLeftClick,
        iconRight,
        onIconRightClick,
        iconRightList: propsIconRightList,
        prefix,
        suffix,
        width,
        elementAttrs,
        extensionPosition = staticExtensionPosition,
        elementRef,
        ...inputProps
      } = props;

      const { colorScheme, significance, size = "m", readOnly, disabled, value, type } = inputProps;
      const background = useBackground();

      const gdsBg = UuGds.getValue([
        "Shape",
        "formElement",
        background,
        colorScheme ?? "building",
        significance ?? "common",
        "default",
        "colors",
      ]).gdsBackground;

      function coverByBg(children) {
        return gdsBg && gdsBg !== background ? (
          <BackgroundProvider background={gdsBg}>{children}</BackgroundProvider>
        ) : (
          children
        );
      }

      const { isMobileOrTablet, browserName } = useDevice();
      const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
      const textType = (isMobileOrTablet && TEXT_TYPE_MAP_MOBILE[size]) || TEXT_TYPE_MAP[size];

      const { h: height } = Uu5Elements.UuGds.getValue(["SizingPalette", "spot", "basic", containerSize]);

      let iconRightList = propsIconRightList || [];
      if (!iconRightList.length && iconRight) {
        // Use iconRight only if iconRightList isnt defined
        iconRightList = [{ icon: iconRight, onClick: onIconRightClick }];
      }

      if (readOnly || disabled) {
        onFeedbackClick = null;
        onIconLeftClick = null;
        iconRightList = iconRightList.map((it) => ({
          ...it,
          onClick: clickableReadOnlyIconKeySet?.has(it.key) ? it.onClick : null,
        }));
      }

      const { ref: beforeRef, width: beforeWidth } = useElementSize();
      const { ref: afterRef, width: afterWidth } = useElementSize();

      const inputRef = useRef();
      const [scrollbarWidth, setScrollbarWidth] = useState(0);

      useLayoutEffect(() => {
        if (inputRef.current) {
          let scrWidth = 0;

          if (inputRef.current.scrollHeight !== inputRef.current.clientHeight) {
            scrWidth = inputRef.current.offsetWidth - inputRef.current.clientWidth;
          }

          if (scrollbarWidth !== scrWidth) setScrollbarWidth(scrWidth);
        }
      }, [value, beforeWidth, afterWidth]);

      // For date inputs we need to hide native date picker icon, unfortunately firefox does not have proper way to do it. For that reason we cover it with span element.
      const isHidePatch = browserName === "firefox" && (type === "date" || type === "date-local");
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      const before = [];
      const after = [];

      if (iconLeft) {
        before.push(
          <Icon
            key="iconLeft"
            testId="icon-left"
            significance="subdued"
            size={size}
            containerSize={containerSize}
            textType={textType}
            top={extensionPosition === "top"}
            icon={iconLeft}
            onClick={typeof onIconLeftClick === "function" ? onIconLeftClick : undefined}
            style={{
              paddingRight: Uu5Elements.UuGds.getValue(["SpacingPalette", "inline", "d"]),
              paddingLeft: Uu5Elements.UuGds.getValue(["SpacingPalette", "relative", "c"]) * height,
            }}
          />,
        );
      }

      if (prefix || suffix) {
        const textProps = {
          colorScheme: "building",
          significance: "subdued",
          category: "interface",
          segment: "interactive",
          type: textType,
        };

        if (prefix) {
          before.push(
            <Uu5Elements.Text
              {...textProps}
              key="prefix"
              testId="prefix"
              className={Css.extension(
                { ...props, containerSize },
                {
                  paddingRight: Uu5Elements.UuGds.getValue(["SpacingPalette", "inline", "d"]),
                  paddingLeft: Uu5Elements.UuGds.getValue(["SpacingPalette", "relative", "c"]) * height,
                },
              )}
            >
              {prefix}
            </Uu5Elements.Text>,
          );
        }

        if (suffix) {
          after.push(
            <Uu5Elements.Text
              {...textProps}
              key="suffix"
              testId="suffix"
              className={Css.extension(
                { ...props, containerSize },
                {
                  paddingLeft: Uu5Elements.UuGds.getValue(["SpacingPalette", "inline", "d"]),
                  paddingRight:
                    iconRightList.length || feedback || pending
                      ? undefined
                      : Uu5Elements.UuGds.getValue(["SpacingPalette", "relative", "c"]) * height,
                },
              )}
            >
              {suffix}
            </Uu5Elements.Text>,
          );
        }
      }

      for (let i = 0; i < iconRightList.length; i++) {
        let { icon = "uugds-react", onClick, tooltip } = iconRightList[i];
        after.push(
          <Icon
            key={`iconRight-${i}`}
            testId="icon-right"
            significance="subdued"
            size={size}
            containerSize={containerSize}
            textType={textType}
            top={extensionPosition === "top"}
            icon={icon}
            onClick={onClick}
            tooltip={tooltip}
            style={{
              paddingLeft: Uu5Elements.UuGds.getValue(["SpacingPalette", "inline", "d"]),
              paddingRight:
                !onClick === !onFeedbackClick && feedback
                  ? (Uu5Elements.UuGds.getValue(["SpacingPalette", "relative", "c"]) * height) / 2
                  : onClick || !feedback
                    ? Uu5Elements.UuGds.getValue(["SpacingPalette", "relative", "c"]) * height
                    : undefined,
            }}
          />,
        );
      }

      if (pending) {
        after.push(
          <div key="pending" className={Css.pending(height)}>
            <Uu5Elements.Pending
              size={PENDING_SIZE[size]}
              className={Css.extension(
                { ...props, containerSize },
                {
                  "& > svg": {
                    background: Uu5Elements.UuGds.Shape.getValue([
                      "background",
                      background,
                      "building",
                      "subdued",
                      "default",
                      "colors",
                      "background",
                    ]),
                    borderRadius: "50%",
                  },
                },
              )}
            />
          </div>,
        );
      } else if (feedback && feedbackIcon !== null) {
        after.push(
          <Icon
            key="feedback"
            testId="feedback"
            elementRef={feedbackRef}
            size={size}
            containerSize={containerSize}
            textType={textType}
            top={extensionPosition === "top"}
            icon={feedbackIcon || FEEDBACK_ICON_MAP[feedback]}
            onClick={typeof onFeedbackClick === "function" ? onFeedbackClick : undefined}
            colorScheme={COLOR_SCHEME_MAP[feedback]}
            style={{
              paddingLeft: Uu5Elements.UuGds.getValue(["SpacingPalette", "inline", "d"]),
              paddingRight: Uu5Elements.UuGds.getValue(["SpacingPalette", "relative", "c"]) * height,
            }}
            className={Config.Css.css({ // necessary for those inputs, where is possibility to have a text behind the icon (e.g. Uu5CodeKit.Json, ...) 
              "&:before, & > span:first-child:before": {
                background: Uu5Elements.UuGds.Shape.getValue([
                  "formElement",
                  background,
                  COLOR_SCHEME_MAP[feedback],
                  significance ?? "common",
                  "default",
                  "colors",
                  "background",
                ]) || "#fff",
                borderRadius: "50%",
              },
            })}
          />,
        );
      }

      if (width) inputProps.width = "100%";

      const [attrs, inputPropsOnly] = Utils.VisualComponent.splitProps(inputProps, Css.main(props));

      // must be always span around because input is unmounted in another way :-(
      return (
        <div {...attrs} tabIndex={undefined}>
          <Input
            testId={inputProps.testId ? inputProps.testId + "-field" : undefined}
            {...inputPropsOnly}
            elementRef={Utils.Component.combineRefs(inputRef, elementRef)}
            colorScheme={(feedback !== "success" && COLOR_SCHEME_MAP[feedback]) || colorScheme}
            className={
              beforeWidth || afterWidth
                ? Config.Css.css({
                    paddingLeft: beforeWidth ? beforeWidth + "px!important" : undefined,
                    paddingRight: afterWidth ? afterWidth + "px!important" : undefined,
                  })
                : undefined
            }
            elementAttrs={{
              ...elementAttrs,
              tabIndex: disabled || pending ? -1 : elementAttrs?.tabIndex,
            }}
          />
          {before.length
            ? coverByBg(
                <span className={Css.before()} ref={beforeRef}>
                  {before}
                </span>,
              )
            : null}
          {after.length
            ? coverByBg(
                <span className={Css.after(scrollbarWidth)} ref={afterRef}>
                  {after}
                </span>,
              )
            : null}
          {isHidePatch && (
            <span className={Css.hidePatch({ height, offset: afterWidth, colorScheme, significance, background })} />
          )}
        </div>
      );
      //@@viewOff:render
    },
  });
}

function withExtensionInput(Component, defaultProps) {
  return _withExtensionInput(Component, defaultProps);
}

//@@viewOn:helpers
//@@viewOff:helpers

export { withExtensionInput, _withExtensionInput, Icon, FEEDBACK_ICON_MAP };
export default withExtensionInput;
