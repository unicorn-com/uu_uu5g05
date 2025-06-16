//@@viewOn:imports
import { createVisualComponent, PropTypes, useBackground, Utils } from "uu5g05";
import UuGds from "./gds";
import Icon from "../icon.js";
import Config from "../config/config.js";
import Text from "../text";
//@@viewOff:imports

//@@viewOn:constants
const ANIMATION_LENGTH = 300;
//@@viewOff:constants

//@@viewOn:css
function getBorderRadius(borderRadius) {
  const radius = UuGds.getValue(["RadiusPalette", "spot", borderRadius]);
  return typeof radius === "object" ? `min(${radius.value}em, ${radius.max}px)` : radius + "em";
}

const Css = {
  main: ({ value, colorScheme, background, onChange, hoverable, borderRadius }) => {
    const staticStyles = {
      display: "inline-flex",
      alignItems: "stretch",
      transition: `background-color ease ${ANIMATION_LENGTH}ms, color ease ${ANIMATION_LENGTH}ms`,
      padding: UuGds.getValue(["SpacingPalette", "relative", "a"]) + "em",
      width: "1.6em",
      height: "1em",
      borderRadius: getBorderRadius(borderRadius),

      // user agent reset
      border: "none",
      outline: "none",
      userSelect: "none",
    };

    const usedColorScheme = value ? colorScheme : "neutral";
    const states = UuGds.Shape.getValue(["interactiveElement", background, usedColorScheme, "highlighted"]);

    let hoverKey, activeKey;
    if (hoverable) {
      hoverKey = "*:hover > &, *:focus-visible > &";
      activeKey = "*:active > &";
    } else {
      hoverKey = "&:hover, &:focus-visible";
      activeKey = "&:active";
    }

    const dynamicStyles = {
      ...UuGds.Shape.getStateStyles(states.default, true),

      ...(onChange || hoverable
        ? {
            cursor: "pointer",
            [hoverKey]: UuGds.Shape.getStateStyles(states.accent, true),
            [activeKey]: UuGds.Shape.getStateStyles(states.marked, true),
          }
        : null),

      "@media print": {
        "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
      },
    };

    return [staticStyles, dynamicStyles].map((styles) => Config.Css.css(styles)).join(" ");
  },

  icon: ({ value, borderRadius }, style) => {
    const states = UuGds.Shape.getValue(["background", "dark", "building", "highlighted"]);

    return Config.Css.css({
      ...UuGds.Shape.getStateStyles(states.default, true),
      ...style,
      height: "100%",
      minWidth: "unset!important",
      minHeight: "unset!important",
      aspectRatio: "1/1",
      borderRadius: getBorderRadius(borderRadius),
      "&:before": {
        fontSize: UuGds.getValue(["SizingPalette", "relative", "xl"]) + "em",
      },
      transition: `transform ease ${ANIMATION_LENGTH}ms`,

      // 100% - 2 * padding
      transform: value ? `translateX(calc(100% - ${2 * UuGds.getValue(["SpacingPalette", "relative", "a"])}em))` : 0,
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const ToggleButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Switch",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.bool,
    onChange: PropTypes.func,
    colorScheme: PropTypes.colorScheme,
    iconOn: PropTypes.string,
    iconOff: PropTypes.string,
    borderRadius: PropTypes.borderRadius,
    hoverable: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: false,
    onChange: undefined,
    colorScheme: "primary",
    iconOn: "uugds-check",
    iconOff: "uugds-close",
    borderRadius: "full",
    hoverable: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onChange, value, colorScheme, iconOn, iconOff } = props;
    const background = useBackground();

    function onClick(e) {
      onChange(new Utils.Event({ value: !value }, e));
    }

    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main({ ...props, background }));

    return (
      <button
        role="switch"
        type="button"
        aria-checked={value}
        {...attrs}
        onClick={typeof onChange === "function" ? onClick : undefined}
      >
        <Text colorScheme={value ? colorScheme : "neutral"}>
          {({ style }) => (
            <Icon
              icon={value ? iconOn : iconOff}
              className={Css.icon({ ...props }, style)}
              elementAttrs={{ "aria-hidden": true }}
            />
          )}
        </Text>
      </button>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { ToggleButton, ANIMATION_LENGTH };
export default ToggleButton;
//@@viewOff:exports
