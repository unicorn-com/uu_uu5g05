//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes, useBackground } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import withTooltip from "./with-tooltip.js";
import Icon from "./icon.js";
import Svg from "./svg.js";
import Tools from "./_internal/tools.js";
import Link from "./link";
//@@viewOff:imports

//@@viewOn:constants
const SIZE = {
  xxs: ["basic", "xxs"],
  xs: ["basic", "xs"],
  s: ["basic", "s"],
  m: ["basic", "m"],
  l: ["basic", "l"],
  xl: ["major", "s"],
  xxl: ["major", "m"],
  "3xl": ["major", "l"],
};
//@@viewOn:constants

//@@viewOn:css
const Css = {
  main: (props) => {
    const {
      borderRadius,
      cssBackground,
      cssBackgroundHover,
      cssColor,
      cssColorHover,
      imageSrc,
      height: propsHeight,
      clickable,
      onClick,
      shapeStyles,
      href,
    } = props;

    const staticCss = Config.Css.css({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",

      // this establishes baseline of the whole element (because it is 1st content inside)
      "&:before": {
        content: '"\\200b"',
        width: 0,
        overflow: "hidden",
        alignSelf: "center",
      },
      "&&:hover": {
        textDecoration: "none", // diabled text decoration of the Link
      },
    });

    // shape
    const styles = {};
    if (borderRadius != null) styles.borderRadius = borderRadius;
    if (imageSrc) {
      // NOTE Split into 2 declarations because JSDOM fails to parse it properly when it's in single `background`.
      //styles.background = `url(${JSON.stringify(imageSrc)}) 50% 50% / cover no-repeat`;
      styles.background = `url(${JSON.stringify(imageSrc)}) 50% 50% no-repeat`;
      styles.backgroundSize = "cover";
      if (cssBackground) {
        styles.background = `${styles.background}, ${cssBackground}`;
        styles.backgroundSize = "80% 80%, cover";
      }
    } else if (cssBackground) {
      styles.background = cssBackground;
    }

    if (cssColor) styles.color = cssColor;

    if (onClick || clickable) {
      const hoverStyle = (styles[onClick ? "&:hover, &:focus" : "*:hover>&, *:focus>&"] ||= {});

      if (imageSrc || cssBackground) {
        if (cssBackgroundHover) hoverStyle.background = cssBackgroundHover;
        else hoverStyle.filter = "brightness(85%)"; // TODO replace by UuGds EffectPalette hoverDarken in 1.4.0
      }

      if (cssColor && cssColorHover) hoverStyle.color = cssColorHover;
      if (!(href || onClick || clickable)) {
        styles.pointerEvents = "none"; // Disable pointer-events when component is not used for interactive purpose
      }
    }

    const height = propsHeight ?? "1em";
    const dynamicCss = Config.Css.css({ ...shapeStyles, ...styles, width: height, height });

    return [staticCss, dynamicCss].join(" ");
  },
  icon: ({ height }) => {
    return height
      ? Config.Css.css({ fontSize: UuGds.SizingPalette.getValue(["relative", "xs"], { height }) })
      : undefined;
  },
  text: ({ height, text }) => {
    const staticCss = Config.Css.css({ whiteSpace: "nowrap" });

    let classNames = staticCss;
    if (height) {
      let styles = UuGds.getValue(["Typography", "interface", "content", "medium"]);
      if (text.length > 2) {
        styles.fontSize = height / text.length + 2;
      } else {
        styles.fontSize = UuGds.SizingPalette.getValue(["relative", "xxs"], { height });
        styles.fontWeight = 700;
      }
      classNames = [staticCss, Config.Css.css(styles)].join(" ");
    }

    return classNames;
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getShapeStyles({ background, colorScheme, significance, clickable, onClick, href, effect }) {
  const states = UuGds.Shape.getValue(["interactiveElement", background, colorScheme, significance]);

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
  }

  const _onClick = !!(onClick || href);

  return {
    ...UuGds.Shape.getStateStyles(states?.default, true),
    ...(_onClick
      ? {
          cursor: "pointer",

          "&:hover, &:focus-visible": UuGds.Shape.getStateStyles(states.accent),

          // for demo
          "&.accent": UuGds.Shape.getStateStyles(states.accent),

          "&:active, &.marked": UuGds.Shape.getStateStyles(states.marked),
        }
      : null),
    ...(clickable
      ? {
          "*:hover>&, *:focus-visible>&": UuGds.Shape.getStateStyles(states.accent),

          // for demo
          ".accent>&": UuGds.Shape.getStateStyles(states.accent),

          "*:active>&, .marked>&": UuGds.Shape.getStateStyles(states.marked),

          "@media print": {
            "&, *:hover>&, *:focus>&, *:active>&, [disabled]>&": UuGds.Shape.getStateStyles(states.saving),
          },
        }
      : null),
  };
}

function getCssRadius(value, max) {
  let cssValue;
  if (typeof value === "number") {
    cssValue = value * 100 + "%";
  } else if (typeof value === "string" && value) {
    cssValue = value;
  }
  if (cssValue && max != null) {
    cssValue = `min(${cssValue}, ${typeof max === "number" ? max + "px" : max})`;
  }
  return cssValue;
}
function getFullCssRadius() {
  let result;
  let gdsRadius = UuGds.getValue(["RadiusPalette", "spot", "full"]);
  if (gdsRadius && typeof gdsRadius === "object") {
    result = getCssRadius(gdsRadius.value, gdsRadius.max);
  } else {
    result = getCssRadius(gdsRadius);
  }
  return result;
}
//@@viewOff:helpers

const RichIconView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "RichIcon",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    height: PropTypes.number,
    borderRadius: PropTypes.unit,
    icon: PropTypes.string,
    text: PropTypes.node,
    size: PropTypes.oneOf(Object.keys(SIZE)),
    imageSrc: PropTypes.string,
    colorScheme: PropTypes.colorScheme,
    significance: PropTypes.oneOf(["common", "highlighted", "subdued"]),
    effect: PropTypes.oneOf(["ground", "upper"]),
    cssBackground: PropTypes.string,
    cssBackgroundHover: PropTypes.string,
    cssColor: PropTypes.string,
    cssColorHover: PropTypes.string,
    clickable: PropTypes.bool,
    onClick: PropTypes.func,
    href: PropTypes.string,
    target: PropTypes.string,
    iconAnimation: Icon.propTypes.animation,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    height: undefined,
    borderRadius: "full",
    icon: undefined,
    text: undefined,
    size: "m",
    imageSrc: undefined,
    colorScheme: "neutral",
    significance: "common",
    effect: undefined,
    cssBackground: undefined,
    cssBackgroundHover: undefined,
    cssColor: undefined,
    cssColorHover: undefined,
    clickable: false,
    onClick: undefined,
    href: undefined,
    target: "_self",
    iconAnimation: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      children,
      icon,
      text,
      size,
      height,
      borderRadius,
      colorScheme,
      onClick,
      imageSrc,
      href,
      target,
      iconAnimation,
    } = props;
    const isNestingLevelInline = size === null;

    let radius;
    if (height) {
      radius = UuGds.RadiusPalette.getValue(["box", borderRadius], { height, width: height });
    } else {
      const [sizePalette, sizeKey] = SIZE[size ?? "m"] || [];
      const sizes = UuGds.getSizes("spot", sizePalette, sizeKey, borderRadius);
      height = !isNestingLevelInline ? sizes.height : undefined;
      if (size === null && borderRadius === "full") {
        // TODO Replace with UuGds.RadiusPalette.getValue(["spot", "full"], { height: null }) when UuGds is ready.
        radius = getFullCssRadius(borderRadius);
      } else {
        radius = sizes.borderRadius;
      }
    }

    let svgProps;
    if (icon?.startsWith("uugdssvg-svg-")) {
      svgProps = { height: height * 0.7, code: icon, colorScheme };
    } else if (icon?.startsWith("https:")) {
      svgProps = { height, uri: icon, colorScheme };
    } else if (!icon) {
      icon = ["imageSrc", "iconText", "cssBackground"].find((k) => props[k] != null) ? undefined : "uugds-react";
    }

    const background = useBackground();
    const shapeStyles = getShapeStyles({ ...props, background });
    let role;
    if (imageSrc) role = "img";
    if (onClick) role = "button";
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let Comp, propsToPass;
    if (onClick || href) {
      Comp = Link;
      const { elementProps } = Utils.VisualComponent.splitProps(
        props,
        Css.main({ ...props, height, borderRadius: radius, shapeStyles }),
      );
      const linkProps = Tools.getLinkProps(elementProps.elementAttrs, { href, target, onClick, role });
      propsToPass = { ...elementProps, ...linkProps, colorScheme: null };
    } else {
      Comp = "span";
      const attrs = Utils.VisualComponent.getAttrs(
        props,
        Css.main({ ...props, height, borderRadius: radius, shapeStyles }),
      );
      propsToPass = { ...attrs, ...Tools.getOnWheelClickAttrs({ ...attrs, onClick }), role };
    }

    return (
      <Comp {...propsToPass}>
        {svgProps ? (
          <Svg {...svgProps} />
        ) : text ? (
          <b className={Css.text({ ...props, height })}>{text}</b>
        ) : icon ? (
          <Icon icon={icon} animation={iconAnimation} className={Css.icon({ ...props, height })} testId="icon" />
        ) : null}
        {children}
      </Comp>
    );
    //@@viewOff:render
  },
});
const RichIcon = withTooltip(RichIconView);

export { RichIcon, SIZE };
export default RichIcon;
