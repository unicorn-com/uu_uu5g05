//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useBackground, BackgroundProvider } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import withTooltip from "./with-tooltip.js";
import Icon from "./icon.js";
//@@viewOff:imports

function getShapeStyles({ background, colorScheme, significance, onClick, focused }) {
  const states = UuGds.getValue(["Shape", "interactiveElement", background, colorScheme, significance]);

  let defaultStyles = UuGds.Shape.getStateStyles(states.default, true);
  const hoverStyles = UuGds.Shape.getStateStyles(states.accent);

  if (focused) {
    defaultStyles = { ...defaultStyles, ...hoverStyles };
  }

  let styles = {
    ...defaultStyles,

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
    },

    // for demo
    "&.saving": UuGds.Shape.getStateStyles(states.saving),
  };

  if (onClick) {
    styles["&:hover, &:focus-visible"] = hoverStyles;
    styles["&:active, &.marked"] = UuGds.Shape.getStateStyles(states.marked);
    // for demo
    styles["&.accent"] = hoverStyles;
  }

  return styles;
}

const SIZE_CFG = {
  xs: ["xsmall", "minor", "l"],
  s: ["small", "basic", "xxs"],
  m: ["medium", "basic", "xs"],
  l: ["large", "basic", "s"],
  xl: ["large", "basic", "m"],
};

const HEIGHT = "1.3em";
const FONT_SIZE = "0.6em";
const TOP = "0.5em";

const Css = {
  mainStatic: () =>
    Config.Css.css({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "nowrap",
      // this establishes baseline of the whole element (because it is 1st content inside)
      "&:before": {
        content: '"\\200b"',
        width: 0,
        overflow: "hidden",
        alignSelf: "center",
      },
    }),
  mainDynamic({ shapeStyles, size, onClick, borderRadius, icon, iconRight }) {
    const interactive = UuGds.getValue(["Typography", "interface", "interactive"]);

    const [fontSize, lineType, lineSize] = SIZE_CFG[size || "m"] || [];

    const styles = {
      "&:before": {
        marginTop: size ? undefined : TOP,
      },

      // typography
      ...interactive[fontSize],

      // shape
      ...shapeStyles,
    };

    let height, radius;

    if (size) {
      if (lineType) {
        ({ height, borderRadius: radius } = UuGds.getSizes("spot", lineType, lineSize, borderRadius));
      }
    } else {
      height = HEIGHT;

      radius = UuGds.getValue(["RadiusPalette", "spot", borderRadius]);
      if (radius) {
        switch (typeof radius) {
          case "number":
            radius = `calc(${radius} * ${height} * 10)`;
            break;
          case "object": {
            radius = `min(calc(${radius.value} * ${height} * 10), ${radius.max})`;
            break;
          }
        }
      }

      // normalize typography
      styles.lineHeight = "normal";
      styles.fontSize = FONT_SIZE;
    }

    styles.minWidth = styles.height = height;
    styles.borderRadius = radius || undefined;
    styles.paddingLeft = UuGds.getValue(["SpacingPalette", "relative", icon ? "c" : "d"]) * height;
    styles.paddingRight = UuGds.getValue(["SpacingPalette", "relative", iconRight ? "b" : "d"]) * height;

    if (onClick) styles.cursor = "pointer";

    return Config.Css.css(styles);
  },
  contentWrapper: ({ ellipsis }) =>
    Config.Css.css({
      minWidth: 0,
      overflow: ellipsis ? "hidden" : undefined,
      textOverflow: ellipsis ? "ellipsis" : undefined,
    }),
  icon: () => Config.Css.css({ fontSize: "1.5em" }),
};

const Tag = withTooltip(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Tag",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      icon: Icon.propTypes.icon,
      size: PropTypes.oneOf(Object.keys(SIZE_CFG)),
      ellipsis: PropTypes.bool,
      borderRadius: PropTypes.borderRadius,
      colorScheme: PropTypes.colorScheme,
      significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
      onClick: PropTypes.func,

      iconRight: Icon.propTypes.icon,
      onIconRightClick: PropTypes.func,

      focused: PropTypes.bool,
      iconAnimation: Icon.propTypes.animation,
      iconRightAnimation: Icon.propTypes.animation,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      icon: undefined,
      size: undefined,
      ellipsis: false,
      borderRadius: "moderate",
      colorScheme: "building",
      significance: "common",
      onClick: undefined,

      iconRight: undefined,
      onIconRightClick: undefined,

      focused: false,
      iconAnimation: undefined,
      iconRightAnimation: undefined,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      let {
        icon,
        children,
        onClick,
        iconRight,
        onIconRightClick,
        colorScheme,
        significance,
        iconAnimation,
        iconRightAnimation,
      } = props;

      const background = useBackground(props.background); // TODO Next major - remove props.background.
      const shapeStyles = getShapeStyles({ ...props, background });
      const staticCss = Css.mainStatic();
      const mainCss = Css.mainDynamic({ ...props, shapeStyles });
      const className = [staticCss, mainCss].join(" ");
      let role;
      if (onClick) role = "button";
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      const attrs = Utils.VisualComponent.getAttrs(props, className);
      return (
        <span {...attrs} onClick={onClick} role={role}>
          {icon && (
            <Icon
              icon={icon}
              animation={iconAnimation}
              margin={children != null ? { right: UuGds.getValue(["SpacingPalette", "inline", "e"]) } : undefined}
              className={Css.icon()}
              testId="icon"
            />
          )}
          <span data-testid="content" className={Css.contentWrapper(props)}>
            {children ?? (icon ? null : "\u200b")}
          </span>
          {iconRight && (
            <BackgroundProvider
              background={significance === "highligted" ? (background === "full" ? "light" : "full") : "soft"}
            >
              <Icon
                colorScheme={colorScheme}
                significance="subdued"
                icon={iconRight}
                animation={iconRightAnimation}
                onClick={onIconRightClick}
                margin={{ left: UuGds.getValue(["SpacingPalette", "inline", "e"]) }}
                className={Css.icon()}
                testId="icon-right"
              />
            </BackgroundProvider>
          )}
        </span>
      );
      //@@viewOff:render
    },
  }),
);

//@@viewOn:helpers
//@@viewOff:helpers

export { Tag };
export default Tag;
