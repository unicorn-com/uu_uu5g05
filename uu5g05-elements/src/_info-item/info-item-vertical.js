//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import Text from "../text.js";
import RichIcon from "../rich-icon";
import Tools from "../_internal/tools.js";
import Link from "../link.js";
//@@viewOff:imports

//@@viewOn:constants
const VERTICAL_FULL_ICON_SIZE = {
  xxs: {
    type: "basic",
    size: "m",
  },
  xs: {
    type: "basic",
    size: "m",
  },
  s: {
    type: "basic",
    size: "l",
  },
  m: {
    type: "basic",
    size: "xl",
  },
  l: {
    type: "major",
    size: "m",
  },
  xl: {
    type: "major",
    size: "l",
  },
};
const TITLE_TEXT_TYPE_MAP = {
  xxs: "small",
  xs: "small",
  s: "small",
  m: "medium",
  l: "medium",
  xl: "large",
};
const SUBTITLE_TEXT_TYPE_MAP = {
  xxs: "xsmall",
  xs: "xsmall",
  s: "xsmall",
  m: "small",
  l: "small",
  xl: "medium",
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main() {
    return Config.Css.css({
      display: "inline-block",
      textAlign: "center",
    });
  },
  icon({ height }) {
    return Config.Css.css({
      margin: "auto",
      marginBottom: UuGds.getValue(["SpacingPalette", "relative", "a"]) * height,
    });
  },
  text() {
    const styles = { "&&": { display: "block" } };

    return Config.Css.css(styles);
  },
  clickable: () =>
    Config.Css.css({
      "*:hover>&, *:focus>&": {
        filter: "brightness(0.7) contrast(2.6)",
      },
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function getIconHeight(sizeProp) {
  const { type, size } = VERTICAL_FULL_ICON_SIZE[sizeProp];
  const { height } = UuGds.getSizes("spot", type, size);
  return height;
}
//@@viewOff:helpers

const InfoItemVertical = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InfoItemVertical",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    icon: RichIcon.propTypes.icon,
    iconText: PropTypes.node,
    imageSrc: PropTypes.string,
    title: PropTypes.node,
    subtitle: PropTypes.node,
    significance: PropTypes.oneOf(["common", "highlighted", "subdued"]),
    size: PropTypes.oneOf(Object.keys(VERTICAL_FULL_ICON_SIZE)),
    colorScheme: PropTypes.colorScheme,
    onClick: PropTypes.func,
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
    size: "xs",
    colorScheme: "neutral",
    onClick: undefined,
    href: undefined,
    target: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { title, subtitle, onClick, iconText, size, icon, imageSrc, href, target, ...otherProps } = props;

    const isIcon = !!(icon || iconText || imageSrc);
    const iconHeight = getIconHeight(size);

    const componentProps = {
      ...otherProps,
      text: iconText,
      size,
      icon,
      imageSrc,
      height: iconHeight,
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let result;

    if (title != null || subtitle != null) {
      const titleProps = {
        colorScheme: "building",
        significance: "common",
        className: Css.text(),
        testId: "title",
        category: "interface",
        segment: "content",
        type: TITLE_TEXT_TYPE_MAP[size],
        autoFit: true,
      };

      const subtitleProps = {
        colorScheme: "building",
        significance: "subdued",
        className: Css.text(),
        testId: "subtitle",
        category: "interface",
        segment: "content",
        type: SUBTITLE_TEXT_TYPE_MAP[size],
        autoFit: true,
      };

      const {
        elementAttrs,
        elementProps,
        componentProps: iconProps,
      } = Utils.VisualComponent.splitProps(componentProps, Css.main());

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
          {isIcon && (
            <RichIcon {...iconProps} className={Css.icon({ height: iconHeight })} clickable={!!(onClick || href)} />
          )}
          {title != null && <Text {...titleProps}>{title}</Text>}
          {subtitle != null && <Text {...subtitleProps}>{subtitle}</Text>}
        </Comp>
      );
    } else if (isIcon) {
      result = <RichIcon {...componentProps} onClick={onClick} href={href} target={target} />;
    } else {
      result = null;
    }

    return result;
    //@@viewOff:render
  },
});

export { InfoItemVertical };
export default InfoItemVertical;
