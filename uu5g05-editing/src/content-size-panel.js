//@@viewOn:imports
import { Lsi, PropTypes, Utils, createVisualComponent, useDevice, useScreenSize, useWillMount } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import importLsi from "./lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const CONTENT_SIZE_MAP = {
  xs: "XS (320 - 414 px)",
  s: "S (415 - 767 px)",
  m: "M (768 - 1280 px)",
  l: "L (1281 - 1599 px)",
  xl: "XL (> 1600 px)",
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  box: ({ padding }) =>
    Config.Css.css({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      ...padding,
    }),
  title: () => {
    const { height } = Uu5Elements.UuGds.getSizes("spot", "basic", "m", "moderate");
    return Config.Css.css({
      lineHeight: height + "px", // the Toggle height due to same height of panels
    });
  },
  leftContent: () =>
    Config.Css.css({
      display: "flex",
      alignItems: "center",
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "c"]),
    }),
  header: ({ isMobileOrTablet, screenSize }) => {
    let isSmallScreen = isMobileOrTablet || screenSize === "xs";
    return Config.Css.css({
      display: "flex",
      alignItems: "baseline",
      flexDirection: isSmallScreen ? "column" : "row",
      gap: isSmallScreen
        ? Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"])
        : Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "c"]),
    });
  },
  rightContent: () =>
    Config.Css.css({
      display: "flex",
      alignItems: "center",
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"]),
    }),
  children: ({ padding }) => Config.Css.css({ ...padding }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const ContentSizePanel = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ContentSizePanel",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    contentSize: PropTypes.oneOf(["xs", "s", "m", "l", "xl"]),
    title: PropTypes.node,
    subtitle: PropTypes.node,
    open: PropTypes.bool,
    onChange: PropTypes.func,
    displayScreenName: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    contentSize: "xs",
    title: undefined,
    subtitle: undefined,
    open: false,
    onChange: undefined,
    displayScreenName: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      contentSize,
      title,
      subtitle,
      children,
      initialOpen,
      open: propsOpen,
      onChange,
      displayScreenName,
      ...otherProps
    } = props;

    const open = contentSize === "xs" || propsOpen;
    const spacing = Uu5Elements.useSpacing();
    const { isMobileOrTablet } = useDevice();
    const [screenSize] = useScreenSize();

    if (process.env.NODE_ENV !== "production") {
      useWillMount(() => {
        ContentSizePanel.logger.error(
          `WARNING: This component is deprecated. It is recommended to use components from Uu5Editing instead. (https://uuapp.plus4u.net/uu-bookkit-maing01/5ee03d6a2be14b9f8d6e138b3ed3d250)`,
        );
      });
    }

    function handleChange(newValue, e) {
      if (typeof onChange === "function") {
        onChange(new Utils.Event({ open: newValue }), e);
      }
    }

    const padding = {
      paddingLeft: spacing.d,
      paddingRight: spacing.d,
      paddingTop: spacing.c,
      paddingBottom: spacing.c,
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(otherProps);

    return (
      <div {...attrs}>
        <Uu5Elements.Box
          onClick={contentSize !== "xs" ? () => handleChange(!open) : undefined}
          shape="interactiveItem"
          className={Css.box({ padding: { padding: spacing.c } })}
          // TODO add props to API
          colorScheme="building"
          significance="distinct"
          borderRadius="moderate"
        >
          <div className={Css.leftContent()}>
            {contentSize !== "xs" && (
              <Uu5Elements.Toggle
                value={open}
                onChange={(e) => {
                  e.stopPropagation();
                  handleChange(e.data.value, e);
                }}
              />
            )}
            <div className={Css.header({ isMobileOrTablet, screenSize })}>
              <Uu5Elements.Text
                className={contentSize === "xs" ? Css.title() : undefined}
                category="interface"
                segment="interactive"
                type="medium"
                colorScheme="building"
                significance="common"
              >
                {title ? (
                  title
                ) : displayScreenName ? (
                  <Lsi import={importLsi} path={["screenSizeDevice", contentSize]} />
                ) : (
                  CONTENT_SIZE_MAP[contentSize]
                )}
              </Uu5Elements.Text>
              <Uu5Elements.Text
                category="interface"
                segment="content"
                type="medium"
                colorScheme="building"
                significance="subdued"
              >
                {subtitle ? subtitle : displayScreenName ? CONTENT_SIZE_MAP[contentSize] : undefined}
              </Uu5Elements.Text>
            </div>
          </div>
          {!open && (
            <Uu5Elements.Text
              className={Css.rightContent()}
              category="interface"
              segment="content"
              type="medium"
              colorScheme="building"
              significance="subdued"
            >
              <Lsi import={importLsi} path={["FormSpaces", "inherited"]} />
              <Uu5Elements.Icon icon="uugdsstencil-arrow-arrow-right-up-half" />
            </Uu5Elements.Text>
          )}
        </Uu5Elements.Box>
        {children && (
          <Uu5Elements.CollapsibleBox collapsed={!open}>
            {typeof children === "function" ? (
              children({ style: padding })
            ) : (
              <div className={Css.children({ padding })}>{children}</div>
            )}
          </Uu5Elements.CollapsibleBox>
        )}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { ContentSizePanel };
export default ContentSizePanel;
//@@viewOff:exports
