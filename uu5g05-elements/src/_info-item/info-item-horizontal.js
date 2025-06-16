//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice, Utils } from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import Text from "../text.js";
import RichIcon from "../rich-icon";
import Tools from "../_internal/tools.js";
import Link from "../link.js";
//@@viewOff:imports

const ICON_SIZE_MAP_MOBILE = Tools.CONTAINER_SIZE_MAP_MOBILE;
const TITLE_1LINE_TEXT_TYPE_MAP = Tools.TEXT_TYPE_MAP;
const SUBTITLE_1LINE_TEXT_TYPE_MAP = TITLE_1LINE_TEXT_TYPE_MAP;
const TITLE_2LINE_TEXT_TYPE_MAP = {
  xxs: "xsmall",
  xs: "xsmall",
  s: "small",
  m: "medium",
  l: "large",
  xl: "large",
};
const SUBTITLE_2LINE_TEXT_TYPE_MAP = {
  xxs: "xsmall",
  xs: "xsmall",
  s: "xsmall",
  m: "small",
  l: "small",
  xl: "medium",
};

const Css = {
  main({ direction, title, subtitle, platform, browserName }) {
    // static styles
    const staticCss = Config.Css.css({
      display: "inline-grid",
      alignItems: "center",
      // alignContent other than "stretch" is required for older versions of Safari < 18 when InfoItem has `alignItems: center` and is inside of vertical flex container,
      // otherwise the InfoItem can be misplaced - https://uuapp.plus4u.net/uu-sls-maing01/558dcc308da34b82bbe044d94074802f/issueDetail?id=67126c73a7fadb0035f434db
      alignContent: browserName === "safari" || platform === "ios" ? "start" : undefined,
      justifyContent: "start",
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
  icon() {
    return Config.Css.css({
      gridArea: "icon",
    });
  },
  title(size, isIcon) {
    let marginLeft;
    if (isIcon) {
      if (size) {
        const { height } = UuGds.getSizes("spot", "basic", size);
        marginLeft = UuGds.SpacingPalette.getValue(["relative", "b"], { height });
      } else {
        marginLeft = UuGds.SpacingPalette.getValue(["inline", "c"]);
      }
    }
    return Config.Css.css({
      gridArea: "title",
      marginLeft,
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      "&&": { fontWeight: 700 },
    });
  },
  subtitle(size, isIcon, isTitle) {
    let marginLeft;
    if (isIcon || isTitle) {
      if (size) {
        const { height } = UuGds.getSizes("spot", "basic", size);
        marginLeft = UuGds.SpacingPalette.getValue(["relative", "b"], { height });
      } else {
        marginLeft = UuGds.SpacingPalette.getValue(["inline", "c"]);
      }
    }
    return Config.Css.css({
      gridArea: "subtitle",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      marginLeft,
    });
  },
  clickable: () =>
    Config.Css.css({
      "*:hover>&, *:focus>&": {
        filter: "brightness(0.7) contrast(2.6)",
      },
    }),
};

const InfoItemHorizontal = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InfoItemHorizontal",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    icon: RichIcon.propTypes.icon,
    iconText: PropTypes.node,
    imageSrc: PropTypes.string,
    title: PropTypes.node,
    subtitle: PropTypes.node,
    significance: PropTypes.oneOf(["common", "highlighted", "subdued"]),
    size: PropTypes.oneOf(Object.keys(TITLE_1LINE_TEXT_TYPE_MAP)),
    colorScheme: PropTypes.colorScheme,
    direction: PropTypes.oneOf(["horizontal", "vertical", "vertical-reverse"]),
    onClick: PropTypes.func,
    iconAnimation: RichIcon.propTypes.iconAnimation,
    href: PropTypes.string,
    target: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    icon: undefined,
    iconText: undefined,
    imageSrc: undefined,
    title: undefined,
    subtitle: undefined,
    significance: "common",
    size: "m",
    colorScheme: "neutral",
    direction: "vertical",
    onClick: undefined,
    iconAnimation: undefined,
    href: undefined,
    target: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    // children are excluded and do not use anymore
    let {
      title,
      subtitle,
      direction,
      onClick,
      iconText,
      size,
      icon,
      imageSrc,
      children,
      iconAnimation,
      href,
      target,
      ...restProps
    } = props;
    const isNestingLevelInline = size === null;
    direction = !isNestingLevelInline ? direction : "horizontal";

    const { isMobileOrTablet, browserName, platform } = useDevice();
    const iconSize = isNestingLevelInline ? size : (isMobileOrTablet && ICON_SIZE_MAP_MOBILE[size]) || size;
    const isIcon = !!(icon || iconText || imageSrc);
    const isTitle = title != null && direction === "horizontal";

    restProps = {
      ...restProps,
      text: iconText,
      size: iconSize,
      icon,
      imageSrc,
      iconAnimation,
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let result;

    if (title != null || subtitle != null) {
      let titleProps = {
        colorScheme: "building",
        significance: "common",
        className: Utils.Css.joinClassName(Css.title(size, isIcon)),
        testId: "title",
        autoFit: true,
      };

      let subtitleProps = {
        colorScheme: "building",
        significance: "subdued",
        className: Utils.Css.joinClassName(Css.subtitle(size, isIcon, isTitle)),
        testId: "subtitle",
        autoFit: true,
      };

      if (size) {
        const titleType =
          direction === "horizontal" ? TITLE_1LINE_TEXT_TYPE_MAP[size] : TITLE_2LINE_TEXT_TYPE_MAP[size];
        titleProps = { ...titleProps, category: "interface", segment: "content", type: titleType };

        const subtitleType =
          direction === "horizontal" ? SUBTITLE_1LINE_TEXT_TYPE_MAP[size] : SUBTITLE_2LINE_TEXT_TYPE_MAP[size];
        subtitleProps = { ...subtitleProps, category: "interface", segment: "content", type: subtitleType };
      }

      const {
        elementAttrs,
        elementProps,
        componentProps: iconProps,
      } = Utils.VisualComponent.splitProps(restProps, Css.main({ direction, title, subtitle, platform, browserName }));

      let Comp, propsToPass;
      if (onClick || href) {
        Comp = Link;
        const role = typeof onClick === "function" ? "button" : undefined;
        const linkProps = Tools.getLinkProps(elementAttrs, { href, target, onClick, role });
        propsToPass = { ...elementProps, ...linkProps };
        titleProps.className = Utils.Css.joinClassName(titleProps.className, Css.clickable());
        subtitleProps.className = Utils.Css.joinClassName(subtitleProps.className, Css.clickable());
      } else {
        Comp = "span";
        propsToPass = { ...elementAttrs };
      }

      result = (
        <Comp {...propsToPass}>
          {isIcon && <RichIcon {...iconProps} className={Css.icon()} clickable={!!(onClick || href)} />}
          {title != null && <Text {...titleProps}>{title}</Text>}
          {subtitle != null && <Text {...subtitleProps}>{subtitle}</Text>}
        </Comp>
      );
    } else if (isIcon) {
      result = <RichIcon {...restProps} onClick={onClick} href={href} target={target} />;
    } else {
      result = null;
    }

    return result;
    //@@viewOff:render
  },
});

export { InfoItemHorizontal, SUBTITLE_2LINE_TEXT_TYPE_MAP };
export default InfoItemHorizontal;
