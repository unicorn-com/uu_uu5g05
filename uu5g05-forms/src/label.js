//@@viewOn:imports
import { createComponent, PropTypes, Utils, Lsi, useState, useRef, useBackground } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
//@@viewOff:imports

// TODO replace by Uu5Elements.Label since 1.19.0!!!

const TEXT_TYPE_MAP = {
  xxs: "xsmall",
  xs: "small",
  s: "medium",
  m: "medium",
  l: "large",
  xl: "large",
};

const Css = {
  main({ background, colorScheme, significance, size, required }) {
    const textStyles = colorScheme
      ? Uu5Elements.UuGds.Shape.getValue(["text", background, colorScheme, significance])
      : {};
    return Config.Css.css({
      cursor: "inherit",
      ...Uu5Elements.UuGds.getValue(["Typography", "interface", "content", TEXT_TYPE_MAP[size]]),

      ...(textStyles.default ? Uu5Elements.UuGds.Shape.getStateStyles(textStyles.default) : null),
      "@media print": {
        "&, &:hover, &:focus, &:active, &[disabled]": textStyles.saving
          ? Uu5Elements.UuGds.Shape.getStateStyles(textStyles.saving)
          : undefined,
      },

      "&::after": required
        ? {
            ...Uu5Elements.UuGds.Shape.getStateStyles(
              Uu5Elements.UuGds.getValue(["Shape", "background", background, "negative", "highlighted", "default"]),
            ),
            content: '" "',
            display: "inline-block",
            verticalAlign: "middle",
            borderRadius: "50%",
            width: 6,
            height: 6,
            marginLeft: Uu5Elements.UuGds.getValue(["SpacingPalette", "inline", "b"]),
          }
        : undefined,
    });
  },
  icon(props) {
    return Config.Css.css({
      marginLeft: Uu5Elements.UuGds.getValue(["SpacingPalette", "inline", "b"]),
    });
  },
};

const Label = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Label",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
    info: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
    required: PropTypes.bool,
    size: PropTypes.oneOf(Object.keys(TEXT_TYPE_MAP)),
    htmlFor: PropTypes.string,
    colorScheme: PropTypes.string,
    significance: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    info: undefined,
    required: undefined,
    size: "m",
    htmlFor: undefined,
    colorScheme: "dim",
    significance: "common",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { children, info, htmlFor } = props;

    const [infoOpen, setInfoOpen] = useState(false);
    const iconRef = useRef();

    if (children && typeof children === "object" && !Utils.Element.isValid(children)) {
      children = <Lsi lsi={children} />;
    }

    if (info && typeof info === "object" && !Utils.Element.isValid(info)) {
      info = <Lsi lsi={info} />;
    }

    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const cssProps = { ...props, background };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main(cssProps));

    return (
      <>
        <label {...attrs} htmlFor={htmlFor}>
          {children}
          {info != null && info !== "" && (
            <Uu5Elements.Icon
              icon="uugds-info"
              colorScheme="primary"
              className={Css.icon(cssProps)}
              onClick={(e) => {
                // stop focus input, because if required, then input is with error, because user does not write any text
                e.preventDefault();
                e.stopPropagation();
                setInfoOpen("click");
              }}
              elementRef={iconRef}
              elementAttrs={{
                // TODO MFA Switch aria-label to use lsi value
                "aria-label": "Info",
                onMouseEnter: () => setInfoOpen("hover"),
                onMouseLeave: () => {
                  if (infoOpen === "hover") setInfoOpen(false);
                },
              }}
            />
          )}
        </label>
        {infoOpen && (
          <Uu5Elements.Tooltip
            element={iconRef.current}
            onClose={() => setInfoOpen(false)}
            delayMs={infoOpen === "click" ? 0 : undefined}
          >
            {info}
          </Uu5Elements.Tooltip>
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Label };
export default Label;
