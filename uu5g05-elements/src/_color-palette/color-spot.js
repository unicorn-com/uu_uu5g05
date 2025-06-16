//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useBackground, useDevice } from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import Input from "../input.js";
import EmptyPreview from "../_internal/empty-preview.js";
//@@viewOff:imports

export const SIZE_MAP_MOBILE = {
  xxs: "s",
  xs: "m",
  s: "l",
  m: "xl",
  l: "xl",
  xl: "xl",
};

const ColorSpot = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ColorSpot",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    color: PropTypes.string,
    size: PropTypes.string,
    borderRadius: PropTypes.borderRadius,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func,
    insideInputBox: PropTypes.bool, // Need for color custom styling inside input box
    colorScheme: PropTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    color: undefined,
    size: undefined,
    borderRadius: Input.defaultProps.borderRadius,
    isSelected: false,
    onClick: undefined,
    insideInputBox: false,
    colorScheme: "primary",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const background = useBackground();
    const { onClick, color } = props;
    const { isMobileOrTablet } = useDevice();
    let size = props.size || "m";
    const minSize = (isMobileOrTablet && SIZE_MAP_MOBILE[size]) || size;
    const attrs = Utils.VisualComponent.getAttrs(props, CLASS_NAMES.main(props, background, minSize));

    function handleClick(e) {
      if (typeof onClick === "function") {
        onClick(new Utils.Event({ color }, e));
      }
    }
    //@@viewOff:private

    //@@viewOn:render
    return color ? (
      <div {...attrs} onClick={handleClick} />
    ) : (
      <EmptyPreview size={props.size} borderRadius={props.borderRadius} insideInputBox={props.insideInputBox} />
    );
    //@@viewOff:render
  },
});
//@@viewOn:helpers
const CLASS_NAMES = {
  main: ({ color, size, borderRadius, onClick, isSelected, colorScheme, insideInputBox }, background, minSize) => {
    // If size is not set we may still need height for borderRadius so "m" is set for cases where the spot has width "auto"
    let { h: minHeight } = UuGds.SizingPalette.getValue(["spot", "basic", minSize]);
    let radius = UuGds.RadiusPalette.getValue(["spot", borderRadius], { height: minHeight });
    if (insideInputBox) {
      minHeight -= 2 * UuGds.SpacingPalette.getValue(["relative", "b"], { height: minHeight });
    }

    let style = {
      width: size ? minHeight : undefined,
      height: size ? minHeight : undefined, // on "xs" viewport, parent component sets width to "auto" and clears aspect ratio
      aspectRatio: "1 / 1",
      minHeight: insideInputBox ? undefined : minHeight,
      borderRadius: radius,
      cursor: typeof onClick === "function" ? "pointer" : undefined,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    if (color === "#FFFFFF") {
      const whiteColorBorder = UuGds.getValue(["BorderPalette", "solidThin"]);
      style.borderStyle = whiteColorBorder.style;
      style.borderWidth = whiteColorBorder.width;
      style.borderColor = "rgba(0,0,0,0.2)";
    }

    if (isSelected) {
      let boxShadow = UuGds.Shape.getValue(["formElement", background, colorScheme || "building", "common", "marked"]);
      style = {
        ...style,
        "::after": {
          content: '""',
          position: "absolute",
          top: -2,
          bottom: -2,
          left: -2,
          right: -2,
          borderRadius: radius,
          boxShadow: `${boxShadow.effect.offsetX}px ${boxShadow.effect.offsetY}px ${boxShadow.effect.blurRadius}px ${boxShadow.effect.spreadRadius}px ${boxShadow.colors.border}`,
        },
      };
    }

    style.background = color;

    return Config.Css.css(style);
  },
};
//@@viewOff:helpers

export { ColorSpot };
export default ColorSpot;
