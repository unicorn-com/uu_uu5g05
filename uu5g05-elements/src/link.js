//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, Environment, useBackground } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import withTooltip from "./with-tooltip.js";
import withRouteLink from "./with-route-link.js";
import Tools from "./_internal/tools.js";
import Text from "./text.js";

//@@viewOff:imports

const DEFAULT_STYLES = {
  textDecoration: "none",
};

const PREFIX = {
  email: "mailto:",
  phone: "tel:",
};

const Css = {
  main({ size, underline }) {
    let sizeStyles;
    if (size) {
      const { h: height } = UuGds.SizingPalette.getValue(["spot", "basic", size]);
      const interactive = UuGds.getValue(["Typography", "interface", "interactive"]);

      sizeStyles = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height,

        // typography
        ...interactive[Tools.TEXT_TYPE_MAP[size]],
      };
    }

    let underlineStyles;
    if (underline) {
      underlineStyles = { textDecoration: "underline" };

      if (underline === "onHover") {
        underlineStyles = { "&:hover": underlineStyles };
      }
    }

    return sizeStyles || underlineStyles
      ? Config.Css.css({
          ...sizeStyles,
          ...underlineStyles,
        })
      : undefined;
  },
};

const LinkView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Link",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onClick: PropTypes.func,
    href: PropTypes.string,
    target: PropTypes.string,
    download: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    colorScheme: PropTypes.oneOfType([PropTypes.oneOf([null]), PropTypes.colorScheme]),
    significance: Text.propTypes.significance,
    size: PropTypes.oneOf(["xxs", "xs", "s", "m", "l", "xl"]),
    type: PropTypes.oneOf(Object.keys(PREFIX)),
    underline: PropTypes.oneOf([true, false, "onHover"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onClick: undefined,
    href: undefined,
    target: undefined,
    download: undefined,
    colorScheme: "blue",
    significance: Text.defaultProps.significance,
    size: undefined,
    type: undefined,
    underline: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { children, onClick, href, target, download, size, type, underline, ...linkProps } = props;

    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const shapeStyles = linkProps.colorScheme
      ? Text._getColorStyles({
          ...linkProps,
          background,
          hoverable: true,
        })
      : {};

    let role = "generic";
    if (href || onClick) {
      shapeStyles.cursor = "pointer";
      role = "link";
    }

    const classNames = [DEFAULT_STYLES, shapeStyles].map((style) => Config.Css.css(style));
    if (size || underline) classNames.push(Css.main({ size, underline }));
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(linkProps, classNames.join(" "));

    if (target === undefined) {
      if (
        href &&
        (Environment.isMobileApp || (!target && /^https?:/.test(href) && !href.startsWith(Environment.appBaseUri)))
      ) {
        target = "_blank";
      }

      if (href && (href.startsWith(Environment.appBaseUri) || /.*plus4u\.net/.test(href))) {
        target = "_self";
      }
    }

    let rel;
    if (target === "_blank") rel = "noopener";

    return (
      <a
        role={role}
        rel={rel}
        {...attrs}
        href={href && PREFIX[type] ? PREFIX[type] + href : href}
        target={target}
        download={download}
        {...Tools.getOnWheelClickAttrs({ ...attrs, onClick })}
        {...(onClick && !href
          ? {
              tabIndex: 0,
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === "NumpadEnter") onClick(e);
                if (typeof attrs.onKeyDown === "function") attrs.onKeyDown(e);
              },
            }
          : null)}
      >
        {type ? (children ?? href) : children}
      </a>
    );
    //@@viewOff:render
  },
});

const Link = withTooltip(withRouteLink(LinkView));

export { Link };
export default Link;
