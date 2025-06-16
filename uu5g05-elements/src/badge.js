//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useBackground } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import withTooltip from "./with-tooltip.js";
import Icon from "./icon.js";

//@@viewOff:imports

function getShapeStyles({ background, colorScheme, significance, onClick }) {
  const states = UuGds.getValue(["Shape", "interactiveElement", background, colorScheme, significance]);

  const styles = {
    ...UuGds.Shape.getStateStyles(states.default, true),

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
    },

    // for demo
    "&.saving": UuGds.Shape.getStateStyles(states.saving),
  };

  if (onClick) {
    styles["&:hover, &:focus-visible"] = UuGds.Shape.getStateStyles(states.accent);
    styles["&:active, &.marked"] = UuGds.Shape.getStateStyles(states.marked);
    // for demo
    styles["&.accent"] = UuGds.Shape.getStateStyles(states.accent);
  }

  return styles;
}

const SIZE_CFG = {
  xs: "xsmall",
  s: "xsmall",
  m: "xsmall",
  l: "small",
  xl: "medium",
};

const SizingPalette = UuGds.SizingPalette.getValue(["relative"]);
const HEIGHT = SizingPalette.xxl;
const FONT_SIZE = SizingPalette.xs;
const ICON = SizingPalette.s;
const SpacingPalette = UuGds.SpacingPalette.getValue(["relative"]);
const TEXT_SPACE = SpacingPalette.d;
const ICON_SPACE = SpacingPalette.b;
const MIDDLE_SPACE = SpacingPalette.a;
const TOP = "0.5em";
const BACKGROUND_MAP = { soft: "light", full: "dark" };

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
  mainDynamic({ shapeStyles, size, icon, children, onClick, borderRadius }) {
    const interactive = UuGds.getValue(["Typography", "interface", "interactive"]);

    const styles = {
      "&:before": {
        marginTop: size ? undefined : TOP,
      },

      // typography
      ...interactive[SIZE_CFG[size || "m"]],

      // shape
      ...shapeStyles,
    };

    let paddingChildren, paddingIcon, height, radius;

    if (size) {
      ({ height, borderRadius: radius } = UuGds.getSizes("spot", "minor", size, borderRadius));
      paddingChildren = UuGds.SpacingPalette.getValue(["relative", "d"], { height });
      paddingIcon = UuGds.SpacingPalette.getValue(["relative", "c"], { height });
    } else {
      height = HEIGHT / FONT_SIZE + "em";

      radius = UuGds.getValue(["RadiusPalette", "spot", borderRadius]);
      if (radius) {
        switch (typeof radius) {
          case "number":
            radius = `calc(${radius} * ${height})`;
            break;
          case "object": {
            radius = `min(${radius.value} * ${height}, ${radius.max}px)`;
            break;
          }
        }
      }

      paddingChildren = TEXT_SPACE / FONT_SIZE + "em";
      paddingIcon = ICON_SPACE / FONT_SIZE + "em";

      // normalize typography
      styles.lineHeight = "normal";
      styles.fontSize = FONT_SIZE + "em";
    }

    styles.height = height;
    if (children) styles.minWidth = height;
    else styles.width = height;
    styles.borderRadius = radius || undefined;

    if (icon) {
      if (children) {
        styles.paddingLeft = paddingIcon;
        styles.paddingRight = paddingChildren;
      }
    } else if (children) {
      styles.paddingLeft = styles.paddingRight = paddingChildren;
    }

    if (onClick) styles.cursor = "pointer";

    return Config.Css.css(styles);
  },
  icon: ({ size, children }) => {
    const interactive = UuGds.getValue(["Typography", "interface", "interactive"]);
    const lineHeight = (size && interactive[SIZE_CFG[size]]?.lineHeight) || ICON / FONT_SIZE + "em";

    let marginRight;
    if (!size && children) {
      marginRight = MIDDLE_SPACE / FONT_SIZE + "em";
    }
    return Config.Css.css({
      "&&": {
        display: "inline-flex",
        alignItems: "center",
        height: lineHeight,
        lineHeight,
        fontSize: lineHeight,
        "&:before,&:after": { lineHeight: "inherit" },
        marginRight,
      },
    });
  },
};

const Badge = withTooltip(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Badge",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      icon: Icon.propTypes.icon,
      size: PropTypes.oneOf(Object.keys(SIZE_CFG)),
      borderRadius: PropTypes.borderRadius,
      borderContrast: PropTypes.bool,
      colorScheme: PropTypes.colorScheme,
      significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
      onClick: PropTypes.func,
      iconAnimation: Icon.propTypes.animation,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      icon: undefined,
      size: undefined,
      borderRadius: "expressive",
      borderContrast: false,
      colorScheme: "red",
      significance: "highlighted",
      onClick: undefined,
      iconAnimation: undefined,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      let { icon, children, onClick, size, borderContrast, iconAnimation } = props;

      const background = useBackground(props.background); // TODO Next major - remove props.background.
      const shapeStyles = getShapeStyles({ ...props, background });
      if (borderContrast) {
        shapeStyles.borderColor = UuGds.ColorPalette.getValue([
          "building",
          BACKGROUND_MAP[background] || background,
          "main",
        ]);
        shapeStyles.borderStyle = "solid";
        shapeStyles.borderWidth = 1;
      }
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
          {size !== "xs" && (
            <>
              {icon && (
                <Icon
                  icon={icon}
                  margin={children != null ? { right: UuGds.getValue(["SpacingPalette", "inline", "b"]) } : undefined}
                  className={Css.icon(props)}
                  testId="icon"
                  animation={iconAnimation}
                />
              )}
              {children ?? (icon ? null : "\u200b")}
            </>
          )}
        </span>
      );
      //@@viewOff:render
    },
  }),
);

//@@viewOn:helpers
//@@viewOff:helpers

export { Badge, getShapeStyles };
export default Badge;
