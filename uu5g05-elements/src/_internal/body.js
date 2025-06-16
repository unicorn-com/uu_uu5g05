//@@viewOn:imports
import { ContentSizeProvider, createVisualComponent, PropTypes, useMemo, Utils } from "uu5g05";
import Config from "../config/config.js";
import HighlightedBox from "../highlighted-box.js";
import Footer from "./footer.js";
import CollapsibleBox from "../collapsible-box.js";
import ScrollableBox from "../scrollable-box.js";
import useSpacing from "../use-spacing.js";

//@@viewOff:imports

const Css = {
  footer: () =>
    Config.Css.css({
      borderBottomLeftRadius: "inherit",
      borderBottomRightRadius: "inherit",
      flex: "none",
    }),
};

const Body = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Body",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    scrollable: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    collapsed: false,
    scrollable: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      background,
      collapsed,
      children,
      displayInfo,
      info,
      infoIcon,
      contentMaxHeight,
      footer,
      footerSeparator,
      paddingHorizontal,
      paddingTop,
      paddingBottom,
      disabled,
      scrollable,
      contentClassName,
      skipContentSizeProvider,
      width, // expected width; serves as a hint for initial value of ContentSizeProvider
      scrollIndicator,
      _showScrollIndicators,
      ...mainProps
    } = props;
    const spacing = useSpacing();
    const isChildrenFn = typeof children === "function";

    const usedPaddingTop = paddingTop || displayInfo ? spacing.d : undefined;
    const usedPaddingBottom =
      ((paddingBottom ?? true) && (footer == null || footerSeparator)) ||
      (paddingBottom === false && footer != null && footerSeparator) // paddingBottom false will be applied by Footer (if having separator; or not at all)
        ? spacing.d
        : undefined;
    const usedPaddingLeft = paddingHorizontal ? spacing.d : undefined;
    const usedPaddingRight = paddingHorizontal ? spacing.d : undefined;

    // NOTE: This padding value is copied to uu5bricks. If the value is changed in uu5g05, the value must also be changed in uu5bricks.
    const padding = useMemo(
      () => ({
        paddingTop: usedPaddingTop,
        paddingBottom: usedPaddingBottom,
        paddingLeft: usedPaddingLeft,
        paddingRight: usedPaddingRight,
      }),
      [usedPaddingTop, usedPaddingBottom, usedPaddingLeft, usedPaddingRight],
    );

    const memoizedChildren = useMemo(
      () => (isChildrenFn ? children({ style: padding }) : children),
      [isChildrenFn, children, padding],
    );
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let contentProps = {
      maxHeight: contentMaxHeight,
      disabled: disabled,
      className: Utils.Css.joinClassName(
        isChildrenFn ? Config.Css.css({ display: "flex", flexDirection: "column", minHeight: 0 }) : undefined,
        contentClassName,
      ),
      scrollable: scrollable,
      skipContentSizeProvider,
      width,
      scrollIndicator,
      _showScrollIndicators: _showScrollIndicators,
      testId: scrollable ? "scrollable" : "",
    };

    if (!isChildrenFn) {
      contentProps = { ...contentProps, ...padding };
    }

    return (
      <CollapsibleBox {...mainProps} collapsed={collapsed} disabled={!scrollable ? disabled : false}>
        {info && (
          <CollapsibleBox collapsed={!displayInfo} className={Config.Css.css({ flex: "none" })}>
            <HighlightedBox colorScheme="dim" borderRadius="none" icon={infoIcon}>
              {info}
            </HighlightedBox>
          </CollapsibleBox>
        )}
        <Content {...contentProps}>{memoizedChildren}</Content>
        {footer != null && (
          <Footer
            background={background}
            paddingHorizontal={paddingHorizontal}
            paddingBottom={paddingBottom}
            separator={footerSeparator}
            disabled={disabled}
            className={Css.footer()}
          >
            {footer}
          </Footer>
        )}
      </CollapsibleBox>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function Content({
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  scrollable,
  className,
  children,
  skipContentSizeProvider,
  width,
  ...props
}) {
  let Component, componentProps;
  if (scrollable && props.maxHeight && props.maxHeight !== "none") {
    Component = ScrollableBox;
    componentProps = props;
  } else {
    Component = "div";
    componentProps = Utils.VisualComponent.getAttrs(props);
  }

  let content = children;
  if (!skipContentSizeProvider) {
    content = <ContentSizeProvider>{content}</ContentSizeProvider>;
  }
  return (
    <Component
      {...componentProps}
      className={Utils.Css.joinClassName(
        className,
        Config.Css.css({
          paddingTop: paddingTop,
          paddingBottom: paddingBottom,
          paddingLeft: paddingLeft,
          paddingRight: paddingRight,
        }),
      )}
    >
      {content}
    </Component>
  );
}

//@@viewOff:helpers

export { Body };
export default Body;
