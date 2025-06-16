//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useState, Lsi, useBackground, useDevice, useEffect } from "uu5g05";
import Config from "../config/config.js";
import Box from "../box.js";
import Body from "./body.js";
import Header from "./header.js";
import UuGds from "./gds.js";
import ContextCenterButton from "../context-center-button.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

let warnedDeprecated;

const Css = {
  main: (props) => Css.root(props),
  root: ({ height, minHeight, maxHeight, collapsible, collapsed }) => {
    return Config.Css.css({
      display: "flex",
      flexDirection: "column",
      height: !collapsible || !collapsed ? height : undefined,
      maxHeight: !collapsible || !collapsed ? maxHeight : undefined,
      minHeight: !collapsible || !collapsed ? minHeight : undefined,
    });
  },
  header: () => {
    return Config.Css.css({
      flex: "none",
    });
  },
  boxBorder: ({ leftBorderCssColor }) => Config.Css.css({ "&&": { borderLeft: `4px solid ${leftBorderCssColor}` } }),
  boxMiddleWrapper: () => {
    return Config.Css.css({
      display: "flex",
      flexDirection: "column",
      flex: "1 1 auto",
      minHeight: 0,
    });
  },
  body: () => {
    return Config.Css.css({
      display: "flex",
      flexDirection: "column",
      flex: "1 1 auto",
      minHeight: 0,
    });
  },
  bodyCard: () => {
    return Utils.Css.joinClassName(Css.body(), Config.Css.css({ borderRadius: "inherit" }));
  },
  bodyNoCard: ({ background, colorScheme = "building" }) => {
    const states = UuGds.getValue(["Shape", "ground", background, colorScheme, "common"]);
    return Utils.Css.joinClassName(
      Css.body(),
      Config.Css.css({
        color: UuGds.Shape.getStateStyles(states.default).color,
      }),
    );
  },
  content: ({ header, footer, card, height, maxHeight }) => {
    let staticStyles = {
      flex: "1 1 auto",
      minHeight: height != null || maxHeight != null ? 0 : undefined,
    };
    let dynamicStyles = {};
    if (!header || card !== "full") {
      dynamicStyles.borderTopLeftRadius = "inherit";
      dynamicStyles.borderTopRightRadius = "inherit";
    }
    if (!footer) {
      dynamicStyles.borderBottomLeftRadius = "inherit";
      dynamicStyles.borderBottomRightRadius = "inherit";
    }
    return Utils.Css.joinClassName(Config.Css.css(staticStyles), Config.Css.css(dynamicStyles));
  },
};

const DEFAULT_LSI = {
  moreInfo: { import: importLsi, path: ["moreInfo"] },
  expand: { import: importLsi, path: ["expand"] },
  collapse: { import: importLsi, path: ["collapse"] },
};

const BlockView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "BlockView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    card: PropTypes.oneOf(["none", "full", "content"]),
    actionList: PropTypes.array,
    actionCollapsedMenuProps: PropTypes.object,

    // Box props
    colorScheme: PropTypes.string,
    significance: PropTypes.string,
    borderRadius: PropTypes.oneOf(["none", "elementary", "moderate", "expressive"]),

    header: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    headerSeparator: PropTypes.bool,
    headerSeparatorColorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    //headerFixed: PropTypes.oneOf(["always", "onScrollUp"]),
    headerType: PropTypes.oneOf(["title", "heading"]),
    level: PropTypes.oneOf([1, 2, 3, 4, 5]),

    footer: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    footerSeparator: PropTypes.bool,

    height: PropTypes.unit,
    minHeight: PropTypes.unit,
    maxHeight: PropTypes.unit,

    initialCollapsed: PropTypes.bool,
    initialDisplayInfo: PropTypes.bool,
    info: PropTypes.oneOfType([PropTypes.node, PropTypes.array]),
    collapsible: PropTypes.bool,

    leftBorderCssColor: PropTypes.string,
    lsi: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    card: "none",
    actionList: [],
    actionCollapsedMenuProps: undefined,

    // Box props
    colorScheme: "building",
    significance: "common",
    borderRadius: "moderate",

    header: undefined,
    headerSeparator: false,
    headerSeparatorColorScheme: undefined,
    level: undefined,
    //headerFixed: undefined,
    footer: undefined,
    footerSeparator: false,

    height: undefined,
    minHeight: 0,
    // NOTE Setting e.g. "100%" and propagating it onto Body component would automatically render ScrollableBox,
    // and if parent didn't actually restrict our height via CSS, our Block would enlarge according to its content,
    // but since it has ScrollableBox, any nested uu5tiles Table-s would be virtualized with respect to this ScrollableBox,
    // not document.body (so Table would render all items and react to scrolling in ScrollableBox only).
    maxHeight: undefined,

    initialCollapsed: false,
    initialDisplayInfo: false,
    info: undefined,
    collapsible: false,

    leftBorderCssColor: undefined, // for IdentificationBlock

    lsi: DEFAULT_LSI,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      card,
      background,
      colorScheme,
      significance,
      borderRadius,

      header,
      headerSeparator,
      headerSeparatorColorScheme,
      //headerFixed, // TODO is it necessary for Block? problem is with background of the Bar
      headerType,
      level,

      footer,
      footerSeparator,

      actionList,
      actionCollapsedMenuProps,
      info,
      initialDisplayInfo,
      initialCollapsed,
      collapsible,

      contentMaxHeight,
      height,
      minHeight,
      maxHeight,

      children,

      leftBorderCssColor,

      lsi,

      ...restProps
    } = props;

    if (height != null && height !== "auto") {
      minHeight = undefined;
      maxHeight = undefined;
    }
    const [collapsed, setCollapsed] = useState(collapsible && initialCollapsed);
    const [displayInfo, setDisplayInfo] = useState(initialDisplayInfo);

    const fullLsi = { ...DEFAULT_LSI, ...lsi };
    const { isMobileOrTablet } = useDevice();

    if (process.env.NODE_ENV !== "production") {
      useEffect(() => {
        if (!warnedDeprecated && props.contentMaxHeight !== undefined) {
          warnedDeprecated = true;
          BlockView.logger.warn('Property "contentMaxHeight" is deprecated. Use "maxHeight" instead.');
        }
      }, [props.contentMaxHeight]);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(
      props,
      Css.main({ ...props, height, minHeight, maxHeight, collapsed }),
    );

    let extendedActionList =
      background && card !== "full"
        ? actionList.map(({ background: itemBg, ...item }) => ({ ...item, background: itemBg || background }))
        : [...actionList];
    if (collapsible) {
      const collapsibleLsiPath = [collapsed ? "expand" : "collapse"];

      extendedActionList.push({
        icon: collapsed ? "uugds-unfold-vertical-more" : "uugds-unfold-vertical-less",
        collapsedChildren: <Lsi lsi={fullLsi[collapsibleLsiPath]} />,
        tooltip: fullLsi[collapsibleLsiPath],
        onClick: () => setCollapsed((open) => !open),
        background: card !== "full" ? background : undefined, // TODO Remove (this value shouldn't be applied if this button is inside Popover). But we can remove this only after BlockView never gets props.background explicitly.
        order: 1,
      });
    }

    const isDeprecatedInitialDisplayInfo = !Array.isArray(info) && initialDisplayInfo;

    if (info) {
      let infoAction = {
        tooltip: fullLsi.moreInfo,
        background: card !== "full" ? background : undefined, // TODO Remove (this value shouldn't be applied if this button is inside Popover). But we can remove this only after BlockView never gets props.background explicitly.
      };

      if (isDeprecatedInitialDisplayInfo) {
        infoAction = {
          ...infoAction,
          icon: Config.INFO_ICON,
          collapsedChildren: <Lsi lsi={fullLsi.moreInfo} />,
          onClick: () => setDisplayInfo((open) => !open),
          tooltip: fullLsi.moreInfo,
          pressed: displayInfo,
        };
      } else {
        infoAction = {
          ...infoAction,
          component: (
            <ContextCenterButton info={info}>
              <Lsi lsi={fullLsi.moreInfo} />
            </ContextCenterButton>
          ),
          collapsed: isMobileOrTablet ? undefined : false,
          primary: true,
          // :-/ must pass significance because when using `component` with JSX, the default props of ContextCenterButton
          // are unrecognizable from normal props (and are therefore preferred - but ActionGroup would think that due to primary:true
          // and no explicit significance on item, the button would be `highlighted` and add margins, but due to default props it wouldn't)
          significance: "subdued",
        };
      }

      extendedActionList.push(infoAction);
    }

    const top =
      (header != null && header !== "") || extendedActionList.length > 0 ? (
        <Header
          background={card !== "full" ? background : undefined}
          actionList={extendedActionList}
          actionCollapsedMenuProps={actionCollapsedMenuProps}
          separator={headerSeparator && card !== "content" && !collapsed}
          paddingTop={card === "full"}
          paddingHorizontal={card === "full"}
          //fixed={headerFixed}
          headerType={headerType}
          level={level}
          className={Css.header()}
          headerSeparatorColorScheme={headerSeparatorColorScheme}
        >
          {header}
        </Header>
      ) : null;

    const boxProps = { background, colorScheme, significance, borderRadius };
    const bodyProps = {
      collapsed: collapsible ? collapsed : false,
      footer,
      footerSeparator,
      contentMaxHeight: contentMaxHeight ?? (height != null || maxHeight != null ? "auto" : undefined),
      ...(isDeprecatedInitialDisplayInfo && { info, displayInfo }),
      paddingHorizontal: true,
      paddingTop: (top != null && headerSeparator) || (top == null && card === "full"),
      paddingBottom: card === "none" ? false : undefined,
      scrollIndicator: {
        top: top == null ? "disappear" : "gradient",
        bottom: footer == null ? "disappear" : "gradient",
      },
      contentClassName: Css.content({ ...props, height, minHeight, maxHeight }),
      testId: "body",
    };
    const bodyNoCardBackground = useBackground(background);

    let view;
    switch (card) {
      case "full":
        view = (
          <Box
            {...restProps}
            {...boxProps}
            className={Utils.Css.joinClassName(
              leftBorderCssColor ? Css.boxBorder({ leftBorderCssColor }) : undefined,
              Css.root({ ...props, height, minHeight, maxHeight, collapsed }),
              restProps.className,
            )}
          >
            {top}
            <Body {...bodyProps} className={Css.bodyCard()}>
              {children}
            </Body>
          </Box>
        );
        break;
      case "content":
        view = (
          <section {...attrs}>
            {top}
            <Box
              {...boxProps}
              className={Utils.Css.joinClassName(
                leftBorderCssColor ? Css.boxBorder({ leftBorderCssColor }) : undefined,
                Css.boxMiddleWrapper(),
              )}
            >
              <Body {...bodyProps} paddingTop className={Css.bodyCard()}>
                {children}
              </Body>
            </Box>
          </section>
        );
        break;
      default:
        view = (
          <section {...attrs}>
            {top}
            <Body
              {...bodyProps}
              className={Css.bodyNoCard({ ...props, background: bodyNoCardBackground })}
              paddingHorizontal={false}
            >
              {children}
            </Body>
          </section>
        );
    }

    return view;
    //@@viewOff:render
  },
});

export default BlockView;
