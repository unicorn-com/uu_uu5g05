//@@viewOn:imports
import { BackgroundProvider, createVisualComponent, PropTypes, useBackground, Utils } from "uu5g05";
import UuGds from "./gds.js";
import Config from "../config/config.js";
import Tools from "./tools.js";
import Icon from "../icon.js";
import withTooltip from "../with-tooltip.js";
import useSpacing from "../use-spacing.js";
import Text from "../text.js";
//@@viewOff:imports

function getShapeStyles({ background, active, type }) {
  const states = UuGds.getValue(["Shape", "ground", background, "building", "common"]);
  const gdsBackground = states.default.colors?.gdsBackground;

  let styles = {};
  if (active && type !== "line") {
    const borderRadius = UuGds.getValue(["RadiusPalette", "box", "elementary"]);

    const { boxShadow, ...restStyles } = {
      ...UuGds.Shape.getStateStyles(states.default),
      "@media print": {
        "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
      },

      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      position: "relative",
      zIndex: 1,
      opacity: 1,
    };

    styles = restStyles;
    styles["&:before"] = {
      content: '""',
      display: "block",
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: -1,
      borderRadius: "inherit",
      boxShadow: boxShadow,
      clipPath: "inset(-8px -8px 1px -8px)",
    };
  }

  return [styles, active ? gdsBackground : background];
}

function getItemStyles({
  size,
  colorScheme,
  borderRadius,
  type,
  active,
  spacing,
  background,
  nestedBackground,
  disabled,
}) {
  const typography = UuGds.getValue(["Typography", "interface", "interactive"]);
  const { height, borderRadius: radius } = UuGds.getSizes("spot", "basic", size, borderRadius);

  const paddingHorizontal =
    type === "card-outer"
      ? spacing.d
      : type === "card-inner"
        ? spacing.d * 0.5
        : UuGds.getValue(["SpacingPalette", "fixed", "b"]);

  let lineStyles;
  if (active && type === "line") {
    let bgStates = UuGds.getValue(["Shape", "background", background, colorScheme, "highlighted"]);
    let lineHeight = 4;
    lineStyles = {
      ...UuGds.Shape.getStateStyles(bgStates.default),
      position: "absolute",
      content: '""',
      display: "block",
      bottom: 0,
      left: 0,
      right: 0,
      height: lineHeight,
      borderRadius: UuGds.RadiusPalette.getValue(["spot", "full"], { height: lineHeight }),
    };
  }

  const styles = {
    position: "relative",
    cursor: !active ? "pointer" : undefined,
    minHeight: height + 2 * spacing.b,
    borderRadius: radius,
    paddingLeft: paddingHorizontal,
    paddingRight: paddingHorizontal,
    transition: "opacity 0.6s cubic-bezier(0.65, 0, 0.35, 1)", // TODO from uuGds
    ...typography[Tools.TEXT_TYPE_MAP[size]],
    ...(active
      ? UuGds.Shape.getStateStyles(UuGds.Shape.getValue(["text", nestedBackground, "building", "common", "default"]))
      : null),
    marginLeft: type === "line" ? spacing.c : undefined,
    "&:after": lineStyles,
  };

  if (!disabled && !active) {
    styles.opacity = 0.6;

    styles["&:hover"] = { opacity: 1 };
    styles["&:active"] = { opacity: 1 };
    styles["@media print"] = {
      "&, &:hover, &:focus, &:active, &[disabled]": { opacity: 1 },
    };
  }
  return styles;
}

const DEFAULT_STYLES = {
  display: "inline-flex",
  alignItems: "center",
  outline: "none",
};

let TabsItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TabsItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    // FIXME Revise props.
    icon: Icon.propTypes.icon,
    onClick: PropTypes.func,
    size: PropTypes.oneOf(Object.keys(Tools.TEXT_TYPE_MAP)),
    colorScheme: PropTypes.colorScheme,
    type: PropTypes.oneOf(["card-outer", "card-inner", "line"]),
    active: PropTypes.bool,
    iconAnimation: Icon.propTypes.animation,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    icon: undefined,
    onClick: undefined,
    size: "m",
    colorScheme: "primary",
    type: undefined,
    active: false,
    iconAnimation: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { icon, onClick, label, active, type, iconAnimation, ...otherProps } = props;

    const spacing = useSpacing();
    const background = useBackground();
    const [shapeStyles, nestedBackground] = getShapeStyles({ ...props, background });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const itemStyles = getItemStyles({ ...props, spacing, background, nestedBackground });
    const className = [DEFAULT_STYLES, itemStyles, shapeStyles]
      .filter(Boolean)
      .map((style) => Config.Css.css(style))
      .join(" ");
    const iconFontSize = UuGds.SizingPalette.getValue(["inline", "emphasized"]) ?? "1em";
    const attrs = Utils.VisualComponent.getAttrs(props, className);

    return (
      <Text {...otherProps} colorScheme="building">
        {({ style }) => (
          <a
            {...attrs}
            tabIndex="0"
            className={Utils.Css.joinClassName(Config.Css.css(style), attrs.className)}
            {...(active ? undefined : Tools.getOnWheelClickAttrs({ ...attrs, onClick }))}
          >
            <BackgroundProvider background={nestedBackground}>
              {icon && (
                <Icon
                  testId="icon"
                  icon={icon}
                  animation={iconAnimation}
                  className={Config.Css.css({
                    fontSize: iconFontSize,
                    marginRight:
                      label != null
                        ? `calc(${UuGds.getValue(["SpacingPalette", "inline", "e"])} / ${parseFloat(iconFontSize)})`
                        : undefined,
                  })}
                />
              )}
              {label}
            </BackgroundProvider>
          </a>
        )}
      </Text>
    );
    //@@viewOff:render
  },
});

TabsItem = withTooltip(TabsItem);

export { TabsItem };
export default TabsItem;
