//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useScreenSize } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import Text from "./text.js";
import InfoItem from "./info-item.js";
import TouchButton from "./touch-button.js";
import useSpacing from "./use-spacing.js";
//@@viewOff:imports

//@@viewOn:constants
const HEADER_TYPE = {
  tight: "micro",
  normal: "minor",
  loose: "common",
};

const SIZE_CFG = {
  xs: "smallScreen",
  s: "smallScreen",
  m: "largeScreen",
  l: "largeScreen",
  xl: "largeScreen",
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main({ direction, title, subtitle }) {
    // static styles
    const staticCss = Config.Css.css({
      display: "inline-grid",
      alignItems: "center",
    });

    // dynamic styles
    const styles = {};

    switch (direction) {
      case "horizontal":
        styles.gridTemplateAreas = `
          "icon ${title ? "title" : "subtitle"} ${subtitle ? "subtitle" : "title"}"
        `;
        break;
      case "vertical-reverse":
        styles.gridTemplateAreas = `
          "icon ${subtitle ? "subtitle" : "title"}"
          "icon ${title ? "title" : "subtitle"}"
        `;
        break;
      default:
        styles.gridTemplateAreas = `
          "icon ${title ? "title" : "subtitle"}"
          "icon ${subtitle ? "subtitle" : "title"}"
        `;
    }

    const dynamicCss = Config.Css.css(styles);

    return [staticCss, dynamicCss].join(" ");
  },
  icon(onIconClick, isString) {
    return Config.Css.css({
      gridArea: "icon",
      cursor: onIconClick && isString ? "pointer" : undefined,
    });
  },
  title(icon, screenSize, type) {
    return Config.Css.css({
      gridArea: "title",
      "&&": {
        marginLeft: icon ? UuGds.getValue(["SpacingPalette", "adaptive", SIZE_CFG[screenSize], type, "c"]) : null,
        fontWeight: 700,
      },
    });
  },
  subtitle(icon, screenSize, type) {
    return Config.Css.css({
      gridArea: "subtitle",
      "&&": {
        marginLeft: icon ? UuGds.getValue(["SpacingPalette", "adaptive", SIZE_CFG[screenSize], type, "c"]) : null,
      },
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Header = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Header",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InfoItem.propTypes,
    icon: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    onIconClick: PropTypes.func,
    level: PropTypes.oneOf([1, 2, 3, 4, 5]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    title: undefined,
    subtitle: undefined,
    direction: "vertical",
    icon: undefined,
    onIconClick: undefined,
    level: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { title, subtitle, icon, onIconClick, level } = props;
    const spacing = useSpacing();
    const [screenSize] = useScreenSize();
    const isString = typeof icon === "string";
    const isIcon = isString && icon.startsWith("uugds");

    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main(props));

    return (
      <span {...attrs}>
        {icon && isIcon && (
          <TouchButton icon={icon} size="xs" className={Css.icon(onIconClick, isString)} onClick={onIconClick} />
        )}
        {icon && !isIcon && (
          <TouchButton
            text={icon}
            size="xs"
            className={Css.icon(onIconClick, isString)}
            onClick={isString ? onIconClick : undefined}
          />
        )}
        {title != null && (
          <Text
            category={level != null ? "story" : "interface"}
            segment={level != null ? "heading" : "title"}
            type={level != null ? "h" + level : subtitle ? "micro" : HEADER_TYPE[spacing.type]}
            colorScheme="building"
            className={Css.title(icon, screenSize, spacing.type)}
            significance="common"
          >
            {title}
          </Text>
        )}
        {subtitle != null && (
          <Text
            category="interface"
            segment="content"
            type="small"
            className={Css.subtitle(icon, screenSize, spacing.type)}
            colorScheme="building"
            significance="subdued"
          >
            {subtitle}
          </Text>
        )}
      </span>
    );
  },
});

//@@viewOn:exports
export { Header };
export default Header;
//@@viewOff:exports
