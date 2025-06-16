//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useBackground } from "uu5g05";
import UuGds from "./_internal/gds.js";
import withTooltip from "./with-tooltip.js";
import Config from "./config/config.js";
import AutoFittedText from "./_internal/auto-fitted-text.js";

//@@viewOff:imports

const HEADER_REGEXP = /^h\d$/;

const TYPOGRAPHY_STRUCTURE = {
  expose: {
    default: ["hero", "lead", "broad", "notice", "distinct"],
  },
  interface: {
    title: ["main", "major", "common", "minor", "micro"],
    content: ["large", "medium", "small", "xsmall"],
    highlight: ["major", "common", "minor"],
    interactive: ["xsmall", "small", "medium", "large"],
  },
  story: {
    heading: ["h1", "h2", "h3", "h4", "h5"],
    body: ["major", "common", "minor"],
    special: ["caption", "code"],
  },
};

const SEGMENT_CFG = Object.fromEntries(
  Object.entries(TYPOGRAPHY_STRUCTURE).map(([category, cfg]) => [category, Object.keys(cfg)]),
);

const TYPE_CFG = Object.fromEntries(
  Object.entries(SEGMENT_CFG).reduce(
    (arr, [category, segmentList]) => [
      ...arr,
      ...segmentList.map((segment) => [segment, TYPOGRAPHY_STRUCTURE[category][segment]]),
    ],
    [],
  ),
);

const Text = withTooltip(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Text",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      colorScheme: PropTypes.colorScheme,
      significance: PropTypes.oneOf(["common", "subdued"]),
      category: PropTypes.oneOf(Object.keys(TYPOGRAPHY_STRUCTURE)),
      segment(props, propName, componentName) {
        if (props.category && SEGMENT_CFG[props.category].indexOf(props[propName]) < 0) {
          return new Error(
            `Invalid prop '${propName}' with value '${props[propName]}' supplied to ${componentName}. For category '${
              props.category
            }' is available one of '${SEGMENT_CFG[props.category].join("', '")}'.`,
          );
        }
      },
      type(props, propName, componentName) {
        if (props.segment && TYPE_CFG[props.segment].indexOf(props[propName]) < 0) {
          return new Error(
            `Invalid prop '${propName}' with value '${props[propName]}' supplied to ${componentName}. For segment '${
              props.segment
            }' is available one of '${TYPE_CFG[props.segment].join("', '")}'.`,
          );
        }
      },
      bold: PropTypes.bool,
      italic: PropTypes.bool,
      autoFit: PropTypes.bool,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      colorScheme: undefined,
      significance: "common",
      category: undefined,
      segment: undefined,
      type: undefined,
      bold: false,
      italic: false,
      autoFit: false,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { children, category, segment, type, colorScheme, italic, bold, autoFit, ...otherProps } = props;

      let colorStyles, typographyStyles, otherStyles;

      const background = useBackground(props.background); // TODO Next major - remove props.background.
      if (colorScheme) {
        colorStyles = getColorStyles({ ...props, background });
      }

      let Comp = "span";
      if (type) {
        typographyStyles = UuGds.getValue(["Typography", category, segment, type]);

        if (bold) {
          typographyStyles.fontWeight = "bold";
        }

        if (HEADER_REGEXP.test(type)) {
          Comp = type;
          typographyStyles.margin = 0;
        }
      }

      if ((bold || italic) && category === "interface" && (segment === "content" || segment === "interactive")) {
        otherStyles = {
          fontWeight: bold ? "bold" : undefined,
          fontStyle: italic ? "italic" : undefined,
        };
      }

      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      let renderResult;

      if (autoFit || typeof children === "function") {
        const style = { ...typographyStyles, ...colorStyles, ...otherStyles };
        if (autoFit) {
          const { elementProps } = Utils.VisualComponent.splitProps(props);
          renderResult = (
            <AutoFittedText {...elementProps} textStyle={style} component={Comp}>
              {children}
            </AutoFittedText>
          );
        } else {
          renderResult = children({ style });
        }
      } else {
        const className = [typographyStyles, colorStyles, otherStyles]
          .filter(Boolean)
          .map((styles) => Config.Css.css(styles))
          .join(" ");
        const attrs = Utils.VisualComponent.getAttrs(props, className);
        renderResult = <Comp {...attrs}>{children}</Comp>;
      }

      return renderResult;
      //@@viewOff:render
    },
  }),
);

//@@viewOn:helpers
function getColorStyles({ background, colorScheme, significance, hoverable = false }) {
  const states = UuGds.Shape.getValue(["text", background, colorScheme, significance]);

  return {
    ...UuGds.Shape.getStateStyles(states.default),

    "&:hover": hoverable ? UuGds.Shape.getStateStyles(states.accent) : undefined,
    // for demo
    "&.accent": hoverable ? UuGds.Shape.getStateStyles(states.accent) : undefined,

    "&:active": hoverable ? UuGds.Shape.getStateStyles(states.marked) : undefined,
    "&.marked": hoverable ? UuGds.Shape.getStateStyles(states.marked) : undefined,

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
    },
    // for demo
    "&.saving": UuGds.Shape.getStateStyles(states.saving),
  };
}

//@@viewOff:helpers

Text._getColorStyles = getColorStyles;

export { Text, HEADER_REGEXP };
export default Text;
