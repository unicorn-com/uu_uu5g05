//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useBackground, BackgroundProvider } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
//@@viewOff:imports

const boxSizing = UuGds.getValue(["SizingPalette", "box"]);

function getShapeStyles({ shape, background, colorScheme, significance, onClick }) {
  const states = UuGds.getValue(["Shape", shape, background, colorScheme, significance]);
  const gdsBackground = states.default.colors?.gdsBackground;
  let styles = {
    ...UuGds.Shape.getStateStyles(states.default, true),

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
    },

    // for demo
    "&.saving": UuGds.Shape.getStateStyles(states.saving),
  };

  if (onClick) {
    styles = {
      ...styles,

      cursor: "pointer",
      "&:hover, &:focus-visible": {
        outline: "none",
        ...UuGds.Shape.getStateStyles(states.accent),
      },

      // for demo
      "&.accent": UuGds.Shape.getStateStyles(states.accent),

      // focus-within is for nested active elements - if they are pressed, this component should not look like pressed
      // active:focus is because of focus-within, because if only this component is pressed, then this styles must be used
      "&:active:focus, &:active:not(:focus-within), &.marked": UuGds.Shape.getStateStyles(states.marked),
    };
  }

  return [styles, gdsBackground];
}

function getClassName({ aspectRatio, size, width, height, maxWidth, borderRadius }, shapeStyles = {}) {
  let style = {};

  if (aspectRatio) {
    style.aspectRatio = aspectRatio.replace("x", "/");
    const sizeCfg = boxSizing[aspectRatio]?.[size];

    if (sizeCfg && !width && !height) {
      width = sizeCfg.w;
    }
  }

  if (maxWidth) {
    style.maxWidth = maxWidth;
  }

  const radius = UuGds.getValue(["RadiusPalette", "box", borderRadius]);
  if (radius) {
    if (typeof radius === "object") {
      const { value, max } = radius;
      shapeStyles.borderRadius =
        typeof width === "number" && typeof height === "number"
          ? `min(${Math.round(value * Math.min(width, height))}px, ${max})`
          : max;
    } else {
      shapeStyles.borderRadius = radius;
    }
  }

  const classNames = [Config.Css.css(shapeStyles)];

  if (width != null || height != null) {
    style.width = width;
    style.height = height;
    if (width || aspectRatio) {
      style.display = "inline-block";
      style.verticalAlign = "top";
    }
  }

  if (Object.keys(style).length) classNames.push(Config.Css.css(style));

  return classNames.join(" ");
}

const Box = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Box",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    shape: PropTypes.oneOf(["ground", "interactiveElement", "interactiveItem", "background"]),
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
    aspectRatio: PropTypes.oneOf(Object.keys(boxSizing)),
    size: PropTypes.oneOf(["xs", "s", "m", "l"]),
    borderRadius: PropTypes.borderRadius,
    width: PropTypes.unit,
    height: PropTypes.unit,
    onClick: PropTypes.func,
    maxWidth: PropTypes.unit,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    shape: "ground",
    colorScheme: "building",
    significance: "common",
    aspectRatio: undefined,
    size: "m",
    borderRadius: "none",
    width: undefined,
    height: undefined,
    onClick: undefined,
    maxWidth: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { onClick, children } = props;

    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const [shapeStyles, gdsBackground] = getShapeStyles({ ...props, background });

    const className = getClassName(props, shapeStyles);
    let role = onClick ? "button" : undefined;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, className);

    return (
      <BackgroundProvider background={gdsBackground ?? background}>
        <div role={role} {...attrs} onClick={onClick}>
          {children}
        </div>
      </BackgroundProvider>
    );
    //@@viewOff:render
  },
});

export { Box, getClassName };
export default Box;
