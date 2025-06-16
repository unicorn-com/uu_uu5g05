//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useValueChange, useState, useDevice } from "uu5g05";
import Config from "./config/config.js";
import TabsHeader from "./_internal/tabs-header.js";
import Box from "./box.js";
import ScrollableBox from "./scrollable-box.js";
//@@viewOff:imports

const Css = {
  main: ({ activeItem, contentMaxHeight }) => {
    return Config.Css.css({
      display: "flex",
      flexDirection: "column",
      flex: activeItem?.children == null ? "none" : undefined,
      maxHeight: contentMaxHeight === "auto" ? "100%" : undefined,
    });
  },
  header: () => {
    return Config.Css.css({ flex: "none" });
  },
  body: ({ type, itemList, activeItem }) => {
    let keyframes = Config.Css.keyframes({
      "0%": { opacity: 0 },
      "100%": { opacity: 1 },
    });
    let staticStyles = {
      animation: `${keyframes} 300ms`,
      flex: "1 1 auto",
    };
    let dynamicStyles;
    if (type === "card-outer") {
      dynamicStyles = {
        display: "flex",
        minHeight: 0,
        flexDirection: "column",
      };
      if (activeItem === itemList?.[0]) {
        dynamicStyles = { ...dynamicStyles, "&&&": { borderTopLeftRadius: 0 } };
      }
    }
    return [staticStyles, dynamicStyles]
      .filter(Boolean)
      .map((it) => Config.Css.css(it))
      .join(" ");
  },
  scrollableBox: () => {
    return Config.Css.css({
      flex: "1 1 auto",
    });
  },
};

const { ...tabsHeaderPropTypes } = TabsHeader.propTypes;
const { ...tabsHeaderDefaultProps } = TabsHeader.defaultProps;
const Tabs = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Tabs",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...tabsHeaderPropTypes,
    activeCode: PropTypes.string,
    onChange: PropTypes.func,
    contentMaxHeight: PropTypes.unit,
    displayBottomLine: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...tabsHeaderDefaultProps,
    activeCode: undefined,
    onChange: undefined,
    contentMaxHeight: undefined,
    displayBottomLine: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      itemList,
      actionList,
      type,
      size,
      colorScheme,
      displayScrollButtons,
      block,
      contentMaxHeight,
      displayBottomLine,
      justified,
    } = props;

    const onChange =
      typeof props.onChange === "function"
        ? (activeCode) => {
            let e = new Utils.Event({ activeCode });
            e.activeCode = activeCode; // for backward compatibility
            props.onChange(e);
          }
        : null;
    const [activeCode, setActiveCode] = useValueChange(
      props.activeCode === null ? props.activeCode : props.activeCode || (itemList?.[0]?.code ?? "0"),
      onChange,
    );
    const [id] = useState(() => Utils.String.generateId());

    let activeItem = itemList?.find((it) => it.code === activeCode);
    if (!activeItem) activeItem = itemList?.[activeCode];
    if (!activeItem && (activeCode !== null || itemList?.some((it) => it.children != null))) {
      activeItem = itemList?.[0];
    }

    const onActivate = (item) => setActiveCode(item.code ?? itemList.indexOf(item) + "");
    const { isHeadless } = useDevice();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    function _renderBox({ children, key, ...boxProps }) {
      return type === "card-outer" ? (
        <Box key={key} {...boxProps}>
          {contentMaxHeight != null ? (
            <ScrollableBox className={Css.scrollableBox()} maxHeight={contentMaxHeight}>
              {children}
            </ScrollableBox>
          ) : (
            children
          )}
        </Box>
      ) : (
        <div key={key} {...Utils.VisualComponent.getAttrs(boxProps)}>
          {children}
        </div>
      );
    }

    const attrs = Utils.VisualComponent.getAttrs(props, Css.main({ ...props, activeItem }));
    return (
      <div {...attrs}>
        <TabsHeader
          labelId={id}
          itemList={itemList}
          actionList={actionList}
          onActivate={onActivate}
          activeItem={activeItem}
          type={type}
          size={size}
          colorScheme={colorScheme}
          displayScrollButtons={displayScrollButtons}
          block={block}
          className={Css.header()}
          displayBottomLine={displayBottomLine}
          justified={justified}
        />
        {_renderBox({
          key: activeCode,
          elementAttrs: { role: "tabpanel", "aria-labelledby": `${id}-${activeCode}` },
          className: Css.body({ ...props, activeItem }),
          borderRadius: "elementary",
          colorScheme: "building",
          significance: "common",
          children: activeItem?.children,
        })}
        {isHeadless &&
          itemList.map(({ children, code }, i) => {
            return (code || i + "") === activeCode ? null : (
              <div key={code ?? i} hidden>
                {children}
              </div>
            );
          })}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Tabs };
export default Tabs;
