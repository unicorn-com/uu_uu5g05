//@@viewOn:imports
import { createVisualComponent, PropTypes, useState, useValueChange, Utils } from "uu5g05";
import Config from "./config/config.js";
import CollapsibleBox from "./collapsible-box.js";
import Box from "./box.js";
import Icon from "./icon.js";
import Text from "./text.js";
import useSpacing from "./use-spacing.js";
import UuGds from "./_internal/gds";
//@@viewOff:imports

//@@viewOn:constants
const HEADER_SIGNIFICANCE_MAP = {
  common: "distinct",
  highlighted: "distinct",
};

const CONTAINER_SIGNIFICANCE_MAP = {
  distinct: "subdued",
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ effect }) => {
    if (effect) {
      const elevationKey = "elevation" + Utils.String.capitalize(effect);
      return Config.Css.css(UuGds.Shape.getStateStyles({ effect: UuGds.EffectPalette.getValue([elevationKey]) }));
    }
  },
  header: ({ spacing, expanded, colorScheme, significance, effect }) => {
    const border = UuGds.Shape.getStateStyles(UuGds.Shape.getValue(["line", "soft", colorScheme, "subdued"]).default);

    let styles = {
      display: "flex",
      gap: UuGds.SpacingPalette.getValue(["inline", "b"]),
      padding: spacing.c,
      paddingLeft: spacing.d,

      justifyContent: significance === "subdued" && !effect ? undefined : "space-between",
      alignItems: "center",

      borderRadius: "inherit",
      transition: `border-radius ${Config.COLLAPSIBLE_BOX_TRANSITION_DURATION}ms ease`,
      transitionDelay: (expanded ? 10 : Config.COLLAPSIBLE_BOX_TRANSITION_DURATION - 100) + "ms",
    };

    if (expanded) {
      const isBorder = ["highlighted", "distinct"].includes(significance);

      if (isBorder || effect) {
        styles = { ...styles, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 };
      }

      if (isBorder || (effect && significance === "subdued")) {
        styles = {
          ...styles,
          borderBottomColor: border.borderColor,
          borderBottomStyle: border.borderStyle,
          borderBottomWidth: border.borderWidth,
        };
      }
    }

    return Config.Css.css(styles);
  },
  content: (padding) => Config.Css.css({ ...padding, borderRadius: "inherit" }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Panel = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Panel",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    header: PropTypes.node.isRequired,
    open: PropTypes.bool,
    onChange: PropTypes.func,
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
    borderRadius: PropTypes.oneOf(["none", "elementary", "moderate", "expressive"]),
    effect: PropTypes.oneOf(["ground", "upper"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    open: false,
    onChange: undefined,
    colorScheme: "building",
    significance: "common",
    borderRadius: "moderate",
    effect: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { header, children, open, significance, colorScheme, onChange, className, borderRadius, ...restProps } =
      props;
    const spacing = useSpacing();
    const [expanded, setExpanded] = useValueChange(
      open,
      typeof onChange === "function" ? (open) => onChange(new Utils.Event({ open })) : undefined,
    );

    const paddingX = spacing.d;
    const paddingY = spacing.c;
    // NOTE: This padding value is copied to uu5bricks. If the value is changed in uu5g05, the value must also be changed in uu5bricks.
    let padding = {
      paddingLeft: paddingX,
      paddingRight: paddingX,
      paddingTop: paddingY,
      paddingBottom: paddingY,
    };

    // onClick should not be passed to Box, because of hover effect
    const { elementProps: boxProps } = Utils.VisualComponent.splitProps(restProps);

    const [id] = useState(() => Utils.String.generateId());
    const headerId = id + "-header";
    const contentId = id + "-content";
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Box
        {...boxProps}
        className={Utils.Css.joinClassName(className, Css.main(props))}
        shape="interactiveItem"
        colorScheme={colorScheme}
        significance={CONTAINER_SIGNIFICANCE_MAP[significance]}
        borderRadius={borderRadius}
        elementAttrs={{ ...boxProps.elementAttrs, "aria-expanded": expanded + "" }}
      >
        <Text category="interface" segment="interactive" type="medium">
          {({ style }) => (
            <Box
              id={headerId}
              shape="interactiveItem"
              onClick={() => setExpanded((expanded) => !expanded)}
              colorScheme={colorScheme}
              significance={HEADER_SIGNIFICANCE_MAP[significance]}
              className={Utils.Css.joinClassName(Config.Css.css(style), Css.header({ ...props, spacing, expanded }))}
              elementAttrs={{
                role: "button",
                "aria-expanded": expanded,
                "aria-controls": contentId,
                tabIndex: 0,
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === "NumpadEnter" || e.key === " ") {
                    setExpanded((expanded) => !expanded);
                  }
                },
              }}
            >
              {header}
              <Icon icon={expanded ? "uugds-chevron-up" : "uugds-chevron-down"} />
            </Box>
          )}
        </Text>

        <CollapsibleBox
          id={contentId}
          collapsed={!expanded}
          testId="collapsible-box"
          className={Config.Css.css({ borderRadius: "inherit", borderTopLeftRadius: 0, borderTopRightRadius: 0 })}
          elementAttrs={{ role: "region", "aria-labelledby": headerId }}
        >
          <Box
            className={Css.content(typeof children !== "function" ? padding : {})}
            shape="interactiveItem"
            {...(significance === "highlighted" ? { colorScheme, significance: "distinct" } : null)}
          >
            {typeof children === "function" ? children({ style: padding }) : children}
          </Box>
        </CollapsibleBox>
      </Box>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Panel };
export default Panel;
//@@viewOff:exports
