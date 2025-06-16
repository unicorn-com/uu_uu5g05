//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useState, useEffect, useBackground, useLanguage } from "uu5g05";
import Config from "./config/config.js";
import Text from "./text.js";
import { iconLibraryMap } from "./uu5-environment.js";

//@@viewOff:imports

function useSvgLoader({ uri, onError }) {
  const [svgText, setSvgText] = useState(null);

  useEffect(() => {
    let changed = false;

    async function load() {
      const res = await fetch(new Request(uri));

      if (res.ok) {
        const text = await res.text();
        if (!changed) setSvgText(text);
      } else {
        onError?.(res);
      }
    }

    if (process.env.NODE_ENV === "test") {
      setSvgText(`<!-- ${uri ? uri.replace(/-->/g, "-- >") : uri} -->`);
    } else if (uri) {
      load();
    }

    return () => {
      changed = true;
    };
  }, [uri]);

  return svgText;
}

function SvgComponent({ uri, colorScheme, height, onError, ...elementProps }) {
  const [, , { direction } = {}] = useLanguage();
  const svgHtml = useSvgLoader({ uri, onError });

  const classNames = [
    Config.Css.css({
      display: "inline-block",
      aspectRatio: "1/1",
      "& > svg": {
        maxWidth: "100%",
        maxHeight: "100%",
      },

      // for right to left languages like Arabic
      // necessary to be set dir="ltr" for svg, which should not be flipped
      '&[dir="rtl"] > svg:not([dir="ltr"])': {
        transform: "scaleX(-1)",
      },
    }),
  ];
  if (height) classNames.push(Config.Css.css({ height }));

  const background = useBackground();
  if (colorScheme) {
    classNames.push(
      Config.Css.css(
        Text._getColorStyles({
          background,
          colorScheme,
          significance: "subdued",
        }),
      ),
    );
  }

  return (
    <span
      dir={direction}
      {...Utils.VisualComponent.getAttrs(elementProps, classNames.join(" "))}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}

const SUPPORTED_STENCIL_LIST = ["uugdssvg-svg"];

const Svg = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Svg",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    code: PropTypes.isRequiredIf(PropTypes.string, (props) => !props.uri),
    uri: PropTypes.isRequiredIf(PropTypes.string, (props) => !props.code),
    type: PropTypes.oneOf(["svg", "img"]),
    colorScheme: PropTypes.colorScheme,
    height: PropTypes.unit,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    //code: "uugds-svg-error",
    height: 88,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { code, uri, height, colorScheme, type, ...restProps } = props;
    const [parseErr, setParseErr] = useState();

    if (uri) {
      type = "img";
    } else {
      const [iconLibraryName, stencil, ...restName] = code.split("-");
      if (iconLibraryMap[iconLibraryName]) {
        uri =
          (iconLibraryMap[iconLibraryName] + "/").replace(/\/\/$/, "/") + stencil + "/" + restName.join("-") + ".svg";
        type ||= SUPPORTED_STENCIL_LIST.find((v) => v === [iconLibraryName, stencil].join("-")) ? "svg" : "img";
        if (type === "svg" && !colorScheme) colorScheme = "steel";
      } else {
        type = "img";
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return type === "svg" && !parseErr ? (
      <SvgComponent {...restProps} uri={uri} height={height} colorScheme={colorScheme} onError={setParseErr} />
    ) : (
      <img {...Utils.VisualComponent.getAttrs(restProps)} src={uri} height={height} alt={parseErr ? undefined : code} />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Svg };
export default Svg;
