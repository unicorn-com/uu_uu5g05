//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useDevice, useRef, useBackground } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import Box from "./box.js";
import ActionGroup from "./action-group.js";
import useSpacing from "./use-spacing.js";
//@@viewOff:imports

const SIGNIFICANCE_LIST = ["common", "distinct", "subdued", "highlighted"];
const HEADER_FOOTER_SIGNIFICANCE_LIST = ["common", "highlighted", "distinct"];

const Css = {
  main: ({ aspectRatio, width }, isMobileOrTablet) => {
    let styles = {
      position: "relative",
      flexDirection: "column",
      textAlign: "left",
      "&&": { display: aspectRatio || width != null ? "inline-flex" : "flex" },
    };

    if (!isMobileOrTablet) {
      styles[`&:hover .${Css.actionGroup(isMobileOrTablet)}`] = { opacity: 1 };
    }

    return Config.Css.css(styles);
  },
  header: ({
    overlap,
    isTransparent,
    padding,
    headerSeparator,
    background,
    headerHorizontalAlignment,
    displayActionList,
  }) => {
    let borderBottom = {};
    if (headerSeparator) {
      const styles = UuGds.getValue(["Shape", "line", background, "building", "subdued"]).default;
      borderBottom = {
        borderBottomWidth: styles?.border?.width + " !important",
        borderBottomStyle: styles?.border?.style + " !important",
        borderBottomColor: styles?.colors?.border + " !important",
      };
    }
    const alignmentStyles = {};
    if (headerHorizontalAlignment) {
      if (displayActionList) {
        if (headerHorizontalAlignment === "end") {
          alignmentStyles.flexDirection = "row-reverse";
        }
      } else {
        alignmentStyles.textAlign = headerHorizontalAlignment;
      }
    }
    return Config.Css.css({
      display: "flex",
      alignItems: "center",
      borderTopLeftRadius: "inherit",
      borderTopRightRadius: "inherit",
      ...alignmentStyles,
      ...padding,
      ...(overlap || isTransparent ? { "&&": { backgroundColor: "transparent" } } : {}),
      ...(overlap ? { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 } : {}),
      ...borderBottom,
    });
  },
  headerChildren: ({ headerHorizontalAlignment, displayActionGroup }) =>
    Config.Css.css({
      flexGrow: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      textAlign: displayActionGroup && headerHorizontalAlignment === "center" ? undefined : headerHorizontalAlignment,
    }),
  children: ({ padding, hasHeader, hasFooter, aspectRatio }) =>
    Config.Css.css({
      flexGrow: 1,
      minHeight: 0,
      borderTopLeftRadius: hasHeader ? undefined : "inherit",
      borderTopRightRadius: hasHeader ? undefined : "inherit",
      borderBottomLeftRadius: hasFooter ? undefined : "inherit",
      borderBottomRightRadius: hasFooter ? undefined : "inherit",
      ...(aspectRatio && { display: "flex", flexDirection: "column", maxHeight: "100%" }),
      ...padding,
    }),
  footer: ({ overlap, isTransparent, padding, footerSeparator, footerHorizontalAlignment, background }) => {
    let borderTop = {};
    if (footerSeparator) {
      const styles = UuGds.getValue(["Shape", "line", background, "building", "subdued"]).default;
      borderTop = {
        borderTopWidth: styles?.border?.width + " !important",
        borderTopStyle: styles?.border?.style + " !important",
        borderTopColor: styles?.colors?.border + " !important",
      };
    }
    const alignmentStyles = {};
    if (footerHorizontalAlignment) {
      alignmentStyles.textAlign = footerHorizontalAlignment;
    }
    return Config.Css.css({
      borderBottomLeftRadius: "inherit",
      borderBottomRightRadius: "inherit",
      ...alignmentStyles,
      ...padding,
      ...(overlap || isTransparent ? { "&&": { backgroundColor: "transparent" } } : {}),
      ...(overlap ? { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 } : { marginTop: "auto" }),
      ...borderTop,
    });
  },
  actionGroup: ({ isMobileOrTablet, displayActionList }) => {
    const styles = {};
    if (!(isMobileOrTablet || displayActionList)) {
      styles.opacity = 0;
      styles.transition = "opacity 300ms ease-out";
    }

    return Config.Css.css(styles);
  },
};

const Tile = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Tile",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Box.propTypes,
    significance: PropTypes.oneOf(SIGNIFICANCE_LIST),

    actionList: ActionGroup.propTypes.itemList,
    actionCollapsedMenuProps: ActionGroup.propTypes.collapsedMenuProps,
    displayActionList: PropTypes.bool,

    header: PropTypes.node,
    headerOverlap: PropTypes.bool,
    headerSeparator: PropTypes.bool,
    headerSignificance: PropTypes.oneOf(HEADER_FOOTER_SIGNIFICANCE_LIST),
    headerColorScheme: Box.propTypes.colorScheme,
    headerHorizontalAlignment: PropTypes.oneOf(["start", "center", "end"]),

    footer: PropTypes.node,
    footerOverlap: PropTypes.bool,
    footerSeparator: PropTypes.bool,
    footerSignificance: PropTypes.oneOf(HEADER_FOOTER_SIGNIFICANCE_LIST),
    footerColorScheme: Box.propTypes.colorScheme,
    footerHorizontalAlignment: PropTypes.oneOf(["start", "center", "end"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    significance: "common",
    borderRadius: "moderate",

    actionList: ActionGroup.defaultProps.itemList,
    actionCollapsedMenuProps: ActionGroup.defaultProps.collapsedMenuProps,
    displayActionList: undefined,

    header: undefined,
    headerOverlap: false,
    headerSeparator: false,
    headerSignificance: undefined,
    headerColorScheme: undefined,
    headerHorizontalAlignment: "start",

    footer: undefined,
    footerOverlap: false,
    footerSeparator: false,
    footerSignificance: undefined,
    footerColorScheme: undefined,
    footerHorizontalAlignment: "start",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      children,
      className,
      actionList,
      actionCollapsedMenuProps,
      displayActionList,
      header,
      headerOverlap,
      headerSeparator,
      headerSignificance,
      headerColorScheme,
      headerHorizontalAlignment,
      footer,
      footerOverlap,
      footerSeparator,
      footerSignificance,
      footerColorScheme,
      footerHorizontalAlignment,
      onClick,
      ...otherProps
    } = props;

    const { b } = useSpacing();
    const { isMobileOrTablet } = useDevice();
    const background = useBackground();

    const actionGroupRef = useRef();

    function handleClick(e) {
      // Prevent trigger of onClick when ActionGroup was clicked
      if (!actionGroupRef.current?.contains(e.target)) {
        onClick(e);
      }
    }

    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const padding = { paddingTop: b, paddingRight: b, paddingBottom: b, paddingLeft: b };
    // NOTE: This padding value is copied to uu5bricks. If the value is changed in uu5g05, the value must also be changed in uu5bricks.
    const legacyPadding = {
      top: padding.paddingTop,
      right: padding.paddingRight,
      bottom: padding.paddingBottom,
      left: padding.paddingLeft,
    };

    const isChildrenFn = typeof children === "function";
    const isFooterFn = typeof footer === "function";
    const hasHeader = !!(header || actionList);
    const hasFooter = !!footer;
    const displayActionGroup = actionList && displayActionList !== false;

    return (
      <Box
        {...otherProps}
        onClick={typeof onClick === "function" ? handleClick : undefined}
        className={Utils.Css.joinClassName(className, Css.main(props, isMobileOrTablet))}
      >
        {hasHeader ? (
          <Box
            significance={headerOverlap || !headerSignificance ? "distinct" : headerSignificance}
            colorScheme={headerOverlap ? undefined : headerColorScheme}
            className={Css.header({
              overlap: headerOverlap,
              isTransparent: !(headerSignificance || headerColorScheme),
              padding,
              headerSeparator,
              background,
              headerHorizontalAlignment,
              displayActionList: displayActionGroup,
            })}
            testId="header"
            shape="background"
          >
            {header ? (
              <div className={Css.headerChildren({ headerHorizontalAlignment, displayActionGroup })}>{header}</div>
            ) : null}
            {displayActionGroup ? (
              <ActionGroup
                itemList={actionList}
                collapsedMenuProps={actionCollapsedMenuProps}
                size={isMobileOrTablet ? "s" : "xs"}
                className={Css.actionGroup({ isMobileOrTablet, displayActionList })}
                elementRef={actionGroupRef}
                elementAttrs={{ onClick: typeof onClick === "function" ? (e) => e.stopPropagation() : undefined }}
                alignment={headerHorizontalAlignment === "end" ? "left" : undefined}
              />
            ) : null}
          </Box>
        ) : null}
        {children ? (
          <div
            className={Css.children({
              padding: isChildrenFn ? undefined : padding,
              hasHeader: hasHeader && !headerOverlap,
              hasFooter: hasFooter && !footerOverlap,
              aspectRatio: props.aspectRatio,
            })}
          >
            {typeof children === "function" ? children({ style: padding, padding: legacyPadding }) : children}
          </div>
        ) : null}
        {hasFooter ? (
          <Box
            significance={footerOverlap || !footerSignificance ? "distinct" : footerSignificance}
            colorScheme={footerOverlap ? undefined : footerColorScheme}
            className={Css.footer({
              overlap: footerOverlap,
              isTransparent: !(footerSignificance || footerColorScheme),
              padding: isFooterFn ? undefined : padding,
              footerSeparator: footerSeparator,
              footerHorizontalAlignment,
              background,
            })}
            testId="footer"
          >
            {typeof footer === "function" ? footer({ style: padding, padding: legacyPadding }) : footer}
          </Box>
        ) : null}
      </Box>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Tile };
export default Tile;
