//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import TouchButton from "./touch-button.js";
import withTooltip from "./with-tooltip.js";
import Text from "./text.js";
import Tools from "./_internal/tools.js";
import Link from "./link";
//@@viewOff:imports

// icon size to SizingPalette.spot.basic / major
const SIZE = {
  xs: ["basic", "xxs"],
  s: ["basic", "l"],
  m: ["major", "s"],
  l: ["major", "m"],
  xl: ["major", "l"],
};

const TEXT_SIZE_CFG = {
  s: "xsmall",
  m: "xsmall",
  l: "small",
  xl: "medium",
};

const BUTTON_SIZE = {
  xs: "xxs",
  s: "l",
  m: "xl",
  l: "xxl",
  xl: "3xl",
};

const Css = {
  // icon has different size - by em -> need to solve somehow, here by vertical centering
  main: ({ size, children, height, onClick, href }) => {
    return Config.Css.css({
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      wordBreak: "break-word",
      textAlign: "center",
      "&:hover": onClick || href ? { cursor: "pointer" } : undefined,
      width: height,
      "&&:hover": {
        textDecoration: "none", // diabled text decoration of the Link
      },
    });
  },
  button: () =>
    Config.Css.css({
      "&&": { display: "flex" },
      margin: "0 auto",
    }),
};

const TouchLinkView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TouchLink",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...TouchButton.propTypes,
    size: PropTypes.oneOf(Object.keys(SIZE)),
    maxLines: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    size: "m",
    maxLines: 2,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, size, iconText, text, maxLines, ...buttonProps } = props;

    const [sizePalette, sizeKey] = SIZE[size] || [];
    const { h: height } = UuGds.SizingPalette.getValue(["spot", sizePalette, sizeKey]);
    const space = UuGds.SpacingPalette.getValue(["relative", "a"], { height });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const buttonAddProps = { size: BUTTON_SIZE[size], text: text === undefined ? iconText : text };

    let result;
    if (children == null || size === "xs") {
      result = <TouchButton {...buttonProps} {...buttonAddProps} />;
    } else {
      const {
        elementProps,
        componentProps: { onClick, href, target, ...compProps },
      } = Utils.VisualComponent.splitProps(buttonProps, Css.main({ ...props, height }));

      const linkProps = Tools.getLinkProps(elementProps.elementAttrs, { href, target, onClick, role: "link" });
      const { background } = compProps; // TODO Next major - remove props.background.

      result = (
        <Link {...elementProps} {...linkProps}>
          <TouchButton
            {...compProps}
            {...buttonAddProps}
            className={Css.button()}
            size={BUTTON_SIZE[size]}
            clickable={!!(onClick || href)}
          />
          <Text
            autoFit
            category="interface"
            segment="content"
            type={TEXT_SIZE_CFG[size]}
            background={background}
            colorScheme="building"
            className={Config.Css.css({
              "&&": {
                display: "-webkit-inline-box",
              },
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: maxLines,
              overflow: "hidden",
              marginTop: space,
              width: "calc(100% + 32px)",
            })}
          >
            {children}
          </Text>
        </Link>
      );
    }
    return result;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

const TouchLink = withTooltip(TouchLinkView);

export { TouchLink };
export default TouchLink;
