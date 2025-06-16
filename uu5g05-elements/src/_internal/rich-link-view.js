//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes, Environment, BackgroundProvider } from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import Tools from "../_internal/tools.js";
import withTooltip from "../with-tooltip.js";
import Box from "../box.js";
import Text from "../text.js";
import Icon from "../icon.js";
import Svg from "../svg.js";
//@@viewOff:imports

//@@viewOn:constants
const TITLE_SIZE_CFG = {
  xs: "xsmall",
  s: "small",
  m: "medium",
  l: "large",
};
const DESCRIPTION_SIZE_CFG = {
  xs: "xsmall",
  s: "xsmall",
  m: "small",
  l: "medium",
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ imageSrc }, data) => {
    let styles = {
      "&&": { display: "inline-flex" },
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
      zIndex: 0,
      maxWidth: "100%",
      "&&&:active": { borderStyle: "hidden" }, // disable "marked" subsignificance
    };

    let backgroundImageStyles =
      imageSrc || data?.image
        ? {
            "&::before": {
              content: '""',
              background: `url("${imageSrc ?? data.image}") no-repeat center / cover`,
              filter: "blur(16px)",
              clipPath: "inset(0 0 0 0)", // don't bleed out blur outwards
              position: "absolute",
              left: -16,
              top: -16,
              right: -16,
              bottom: -16,
              zIndex: -1,
            },
          }
        : undefined;

    return [styles, backgroundImageStyles]
      .filter(Boolean)
      .map((it) => Config.Css.css(it))
      .join(" ");
  },
  imageContainer: ({ data, size, imageSrc }) => {
    let errorStyles;
    if (!imageSrc && !data) {
      errorStyles = {
        "&&": {
          display: "grid",
          aspectRatio: "auto",
          minHeight: 0,
          padding: size !== "xs" && size !== "s" ? UuGds.getValue(["SpacingPalette", "fixed", "e"]) : undefined,
        },
        "&>svg": {
          height: "100%",
          width: "100%",
          margin: "auto",
          // aspect-ratio: 1 / 1;
        },
      };
    }
    return Config.Css.css({
      position: "relative",
      flex: 1,
      minHeight: 0,
      background: imageSrc || data?.image ? `url("${imageSrc ?? data.image}") no-repeat center / contain` : undefined,
      ...errorStyles,
    });
  },
  image: () => {
    return Config.Css.css({
      width: "100%",
      height: "100%",
      objectFit: "contain",
      objectPosition: "center",
      position: "relative",
      zIndex: 0,
    });
  },
  contentContainer: () => {
    return Config.Css.css({
      padding: UuGds.getValue(["SpacingPalette", "fixed", "c"]),
      flex: "none",
    });
  },
  title: () => {
    return Config.Css.css({
      "&&": { fontWeight: "bold" },
      marginBottom: UuGds.getValue(["SpacingPalette", "fixed", "b"]),
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      display: "block",
    });
  },
  description: (textStyles) => {
    return Config.Css.css({
      ...textStyles,
      maxHeight: parseFloat(textStyles.lineHeight) * 5 || undefined,
      lineClamp: 5,
      display: "-webkit-box",
      WebkitLineClamp: 5,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      textOverflow: "ellipsis",
      marginBottom: UuGds.getValue(["SpacingPalette", "fixed", "b"]),
    });
  },
  footer: () => {
    return Config.Css.css({
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      display: "block",
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const RichLinkView = withTooltip(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "RichLinkView",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      target: PropTypes.string,
      size: PropTypes.oneOf(Object.keys(TITLE_SIZE_CFG)),
      aspectRatio: PropTypes.oneOf(["2x3", "4x3", "3x2", "16x9", "3x4", "1x1"]),
      data: PropTypes.shape({
        url: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        image: PropTypes.string,
      }),
      borderRadius: PropTypes.oneOf(["none", "elementary", "moderate", "expressive"]),
      imageSrc: PropTypes.string,
      title: PropTypes.node,
      description: PropTypes.node,
      width: PropTypes.unit,
      height: PropTypes.unit,
      maxWidth: PropTypes.unit,
      onClick: PropTypes.func,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      target: undefined,
      size: "s",
      aspectRatio: "4x3",
      data: {},
      borderRadius: "moderate",
      imageSrc: undefined,
      title: undefined,
      description: undefined,
      width: undefined,
      height: undefined,
      maxWidth: undefined,
      onClick: undefined,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      let { target, children, data, href: propsHref, imageSrc, title, description, ...propsToPass } = props;
      const { size, aspectRatio, height, width, maxWidth } = props;

      const href = data?.url || propsHref;
      if (
        href &&
        (Environment.isMobileApp || (!target && /^https?:/.test(href) && !href.startsWith(Environment.appBaseUri)))
      ) {
        target = "_blank";
      }

      let onClick = props.onClick;
      let otherElementAttrs;
      if (href) {
        onClick = (e) => {
          if (typeof props.onClick === "function") props.onClick(e);
          if (!e.defaultPrevented) {
            Tools.openLink(href, target);
          }
        };
        ({ onClick, ...otherElementAttrs } = Tools.getOnWheelClickAttrs({ onClick }));
      }

      const [w, h] = aspectRatio.split("x", 2);
      const isPortrait = Number(w) <= Number(h);

      let url;
      try {
        url = href ? new URL(href, document.baseURI).host : null;
      } catch (e) {
        url = null;
      }
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <Box
          {...propsToPass}
          className={Utils.Css.joinClassName(Css.main(props, data), propsToPass.className)}
          shape={data ? undefined : "background"}
          colorScheme={data ? "building" : "steel"}
          significance={data ? "common" : "distinct"}
          onClick={onClick}
          elementAttrs={{ ...propsToPass.elementAttrs, ...otherElementAttrs }}
          maxWidth={maxWidth}
          height={height}
          width={width}
        >
          {imageSrc || data ? (
            <div className={Css.imageContainer({ data, imageSrc })} />
          ) : (
            <Svg code="uugdssvg-svg-error" height={48} className={Css.imageContainer({ data, size })} />
          )}

          <BackgroundProvider background="full">
            <Box shape="background" colorScheme="building" significance="distinct" className={Css.contentContainer()}>
              {title || data ? (
                <Text
                  colorScheme="building"
                  significance="common"
                  category="interface"
                  segment="content"
                  type={TITLE_SIZE_CFG[size] || "small"}
                  className={Css.title()}
                >
                  {title ?? data.title}
                </Text>
              ) : null}
              {(description || data) && isPortrait && size !== "xs" && size !== "s" ? (
                <Text
                  colorScheme="building"
                  significance="common"
                  category="interface"
                  segment="content"
                  type={DESCRIPTION_SIZE_CFG[size] || "xsmall"}
                >
                  {({ style }) => <div className={Css.description(style)}>{description ?? data.description}</div>}
                </Text>
              ) : null}
              <Text className={Css.footer()} colorScheme="building" significance="subdued">
                <Icon
                  icon="uugds-web"
                  colorScheme="building"
                  significance="subdued"
                  margin={{ right: UuGds.getValue(["SpacingPalette", "inline", "e"]) }}
                />
                <Text
                  category="interface"
                  segment="content"
                  type="xsmall"
                  tooltip={["xs", "s"].includes(size) ? url : undefined}
                >
                  {url}
                </Text>
              </Text>
            </Box>
          </BackgroundProvider>
        </Box>
      );
      //@@viewOff:render
    },
  }),
);

export { RichLinkView };
export default RichLinkView;
