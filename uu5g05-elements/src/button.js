//@@viewOn:imports
import {
  createVisualComponent,
  Utils,
  PropTypes,
  useBackground,
  BackgroundProvider,
  useDevice,
  Environment,
} from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import withTooltip from "./with-tooltip.js";
import Tools from "./_internal/tools.js";
import Icon from "./icon.js";
import IconWithNotification from "./_internal/icon-with-notification.js";
import withRouteLink from "./with-route-link.js";
//@@viewOff:imports

const ICON_FONT_SIZE = UuGds.SizingPalette.getValue(["inline", "emphasized"]);

function getShapeStyles({ background, colorScheme, significance, pressed, effect, onClick, href, disabled }) {
  const states = UuGds.getValue(["Shape", "interactiveElement", background, colorScheme, significance]);

  if (effect) {
    const elevationKey = "elevation" + Utils.String.capitalize(effect);
    states.default = {
      ...states.default,
      effect: [states.default.effect, UuGds.EffectPalette.getValue([elevationKey])].filter(Boolean),
    };
    states.accent = {
      ...states.accent,
      effect: [states.accent.effect, UuGds.EffectPalette.getValue([elevationKey + "Expressive"])].filter(Boolean),
    };
    states.saving = { ...states.saving, effect: states.default.effect };
  }

  const gdsBackground = states.default.colors?.gdsBackground;

  let defaultStyles = UuGds.Shape.getStateStyles(states.default, true);
  let hoverStyles = UuGds.Shape.getStateStyles(states.accent);
  const pressedStyles = UuGds.Shape.getStateStyles(states.marked);

  if (pressed) {
    hoverStyles = { ...defaultStyles, ...hoverStyles };
    defaultStyles = { ...defaultStyles, ...pressedStyles };
  }

  const activeStyles = {
    "&:hover, &:focus-visible": disabled ? undefined : hoverStyles,
    "&:active": pressedStyles,

    // for demo
    "&.accent": disabled ? undefined : hoverStyles,
    "&.marked": pressedStyles,
  };

  const styles = {
    ...defaultStyles,

    ...(onClick || href ? activeStyles : { "a > &": activeStyles }), // backward compatibility for button covered by link

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
    },
    // for demo
    "&.saving": UuGds.Shape.getStateStyles(states.saving),
  };

  return [styles, gdsBackground];
}

// icon size to SizingPalette.spot.minor
const ICON_SIZE = {
  xxs: "m",
  xs: "m",
  s: "l",
  m: "l",
  l: "xl",
  xl: "xl",
};

const CONTAINER_SIZE_MAP_MOBILE = Tools.CONTAINER_SIZE_MAP_MOBILE;
const TEXT_TYPE_MAP = {
  xxs: "small",
  xs: "small",
  s: "small",
  m: "medium",
  l: "large",
  xl: "large",
};

const Css = {
  // icon has different size - by em -> need to solve somehow, here by vertical centering
  mainStatic: () =>
    Config.Css.css({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "safe center",
      // this establishes baseline of the whole element (because it is 1st content inside)
      "&:before": {
        content: '"\\200b"',
        width: 0,
        overflow: "hidden",
        alignSelf: "center",
      },
      whiteSpace: "nowrap",
      overflow: "hidden",

      // user agent reset
      userSelect: "none",
      outline: "none",
      paddingTop: 0,
      paddingBottom: 0,
    }),
  mainDynamic(cssProps) {
    const { shapeStyles, width, borderRadius, containerSize, textType, onClick, href } = cssProps;
    const { height, borderRadius: radius } = UuGds.getSizes("spot", "basic", containerSize, borderRadius);

    const interactive = UuGds.getValue(["Typography", "interface", "interactive"]);

    const styles = {
      // size
      height,
      minWidth: height,

      // typography
      ...interactive[textType],

      // shape
      ...shapeStyles,

      borderRadius: radius || undefined,

      // backward compatibility for button covered by link
      [onClick || href ? "&:hover" : "a > &:hover"]: {
        cursor: "pointer",
      },
    };

    Object.assign(styles, _getButtonPaddingStyle({ ...cssProps, height }));
    // if using only icon without children, we simply center the icon without giving paddings,
    // but browser has its own paddings by default which might be too big for size="xs" so reset those
    styles.paddingLeft ??= 0;
    styles.paddingRight ??= 0;

    width != null && (styles.width = width);

    return Config.Css.css(styles);
  },
  icon: ({ containerSize, children, right, labelAlignment, width }) => {
    const iconStatic = Config.Css.css({ fontSize: ICON_FONT_SIZE });
    const sizes = UuGds.getValue(["SizingPalette", "spot", "minor"]);
    const iconDynamic = Config.Css.css({
      "&::before": {
        width: sizes[ICON_SIZE[containerSize]]?.h,
        height: sizes[ICON_SIZE[containerSize]]?.h,
        lineHeight: sizes[ICON_SIZE[containerSize]]?.h + "px", // center vertically (icon can be smaller font-size than height, e.g. Button size="m" on "xs" viewport)
      },
      // paddingLeft: children != null && right ? getIconRightLeftPadding() : undefined,
      marginLeft:
        children != null && right
          ? width && labelAlignment === "stretch"
            ? "auto"
            : getIconRightLeftPadding()
          : undefined,
    });

    return [iconStatic, iconDynamic].join(" ");
  },
};

//@@viewOn:helpers
function getIconRightLeftPadding() {
  return UuGds.getValue(["SpacingPalette", "inline", "e"]);
}

// NOTE Keep in sync with render().
function getButtonPaddingStyle(cssProps) {
  const { size, borderRadius, isMobileOrTablet } = cssProps;
  const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
  const { height } = UuGds.getSizes("spot", "basic", containerSize, borderRadius);
  return _getButtonPaddingStyle({ ...cssProps, containerSize, height }, true);
}

function _getButtonPaddingStyle(
  { width, height, icon, iconRight, children, containerSize },
  returnCompleteStyle = false,
) {
  const result = {};

  const paddingB = UuGds.getValue(["SpacingPalette", "relative", "h"]) * height;
  const paddingILeft = UuGds.getValue(["SpacingPalette", "relative", "g"]) * height;
  const paddingIRight = UuGds.getValue(["SpacingPalette", "relative", "c"]) * height;

  if (icon) {
    if (children != null) {
      result.paddingLeft = paddingILeft;
    } else if (iconRight || returnCompleteStyle) {
      const sizes = UuGds.getValue(["SizingPalette", "spot", "minor"]);
      result.paddingLeft = `calc((${_fillUnit(width ?? height)} - max(${ICON_FONT_SIZE}, ${_fillUnit(
        sizes[ICON_SIZE[containerSize]]?.h || 0,
      )})) / 2)`;
    }
    if (iconRight) {
      if (children != null) {
        result.paddingRight = paddingIRight;
      } else {
        result.paddingRight = result.paddingLeft;
      }
    } else if (children != null) {
      result.paddingRight = paddingB;
    } else if (returnCompleteStyle) {
      result.paddingRight = result.paddingLeft;
    }
  } else if (iconRight) {
    result.paddingLeft = paddingB;
    result.paddingRight = paddingIRight;
  } else {
    result.paddingLeft = result.paddingRight = paddingB;
  }
  for (let k in result) result[k] = _fillUnit(result[k]);
  return result;
}

function _fillUnit(value, defaultUnit = "px") {
  if (value != null) {
    value += "";
    return /\d$/.test(value) ? value + defaultUnit : value;
  }
}
//@@viewOff:helpers

const Button = withTooltip(
  withRouteLink(
    createVisualComponent({
      //@@viewOn:statics
      uu5Tag: Config.TAG + "Button",
      //@@viewOff:statics

      //@@viewOn:propTypes
      propTypes: {
        onClick: PropTypes.func,
        icon: Icon.propTypes.icon,
        iconNotification: PropTypes.oneOfType([PropTypes.bool, IconWithNotification.propTypes.iconNotification]),
        iconRight: Icon.propTypes.icon,
        type: PropTypes.oneOf(["button", "submit", "reset"]),
        colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
        significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
        effect: PropTypes.oneOf(["ground", "upper"]),
        size: PropTypes.oneOf(Object.keys(TEXT_TYPE_MAP)),
        borderRadius: PropTypes.borderRadius,
        width: PropTypes.unit,
        pressed: PropTypes.bool,
        labelAlignment: PropTypes.oneOf(["center", "stretch"]),
        iconAnimation: Icon.propTypes.animation,
        iconRightAnimation: Icon.propTypes.animation,
      },
      //@@viewOff:propTypes

      //@@viewOn:defaultProps
      defaultProps: {
        onClick: undefined,
        icon: undefined,
        iconNotification: false,
        iconRight: undefined,
        type: "button",
        colorScheme: "neutral",
        significance: "common",
        effect: undefined,
        size: "m",
        borderRadius: "moderate",
        width: undefined,
        pressed: undefined,
        labelAlignment: "center",
        iconAnimation: undefined,
        iconRightAnimation: undefined,
      },
      //@@viewOff:defaultProps

      render(props) {
        //@@viewOn:private
        const {
          onClick,
          icon,
          iconNotification,
          iconRight,
          type,
          pressed,
          children,
          size,
          href,
          target: targetProps,
          download,
          iconAnimation,
          iconRightAnimation,
        } = props;

        // NOTE Keep in sync with getButtonPaddingStyle().
        const { isMobileOrTablet } = useDevice();
        const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
        const textType = TEXT_TYPE_MAP[size];

        const background = useBackground(props.background); // TODO Next major - remove props.background.
        const [shapeStyles, gdsBackground] = getShapeStyles({ ...props, background });
        const staticCss = Css.mainStatic();
        const mainCss = Css.mainDynamic({ ...props, shapeStyles, containerSize, textType });
        const className = [staticCss, mainCss].join(" ");
        //@@viewOff:private

        //@@viewOn:interface
        //@@viewOff:interface

        //@@viewOn:render
        let Component = "button";
        let attrs = Utils.VisualComponent.getAttrs(props, className);
        attrs["aria-pressed"] = pressed;
        if (onClick == null && href == null) attrs["aria-disabled"] = true;

        if (href) {
          Component = "a";
          let target = targetProps;
          if (targetProps === undefined) {
            if (
              href &&
              (Environment.isMobileApp ||
                (!targetProps && /^https?:/.test(href) && !href.startsWith(Environment.appBaseUri)))
            ) {
              target = "_blank";
            }

            if (href && (href.startsWith(Environment.appBaseUri) || /.*plus4u\.net/.test(href))) {
              target = "_self";
            }
          }

          let rel;
          if (target === "_blank") rel = "noopener";

          attrs = {
            ...attrs,
            className: Utils.Css.joinClassName(attrs.className, Config.Css.css({ textDecoration: "none" })),
            role: "button",
            href,
            target,
            rel,
            download,
            ...Tools.getOnWheelClickAttrs({ ...attrs, onClick }),
          };
        } else {
          attrs = {
            ...attrs,
            type,
            ...Tools.getOnWheelClickAttrs({ ...attrs, onClick }),
          };
        }

        const IconComponent = iconNotification ? IconWithNotification : Icon;

        return (
          <BackgroundProvider background={gdsBackground ?? background}>
            <Component {...attrs}>
              {icon && (
                <IconComponent
                  icon={icon}
                  animation={iconAnimation}
                  className={Css.icon({ ...props, containerSize })}
                  margin={children != null ? { right: UuGds.getValue(["SpacingPalette", "inline", "e"]) } : undefined}
                  testId={iconNotification ? "icon-with-notification" : "icon"}
                  {...(iconNotification
                    ? {
                        testId: "icon-with-notification",
                        iconNotification: typeof iconNotification === "object" ? iconNotification : {},
                      }
                    : {
                        testId: "icon",
                      })}
                />
              )}
              {children}
              {iconRight && (
                <Icon
                  icon={iconRight}
                  animation={iconRightAnimation}
                  className={Css.icon({ ...props, containerSize, right: true })}
                  testId="icon-right"
                />
              )}
            </Component>
          </BackgroundProvider>
        );
        //@@viewOff:render
      },
    }),
  ),
);

export { Button, getButtonPaddingStyle, getIconRightLeftPadding, ICON_FONT_SIZE, TEXT_TYPE_MAP };
export default Button;
