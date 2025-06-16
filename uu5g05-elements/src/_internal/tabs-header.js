//@@viewOn:imports
import {
  Utils,
  createVisualComponent,
  PropTypes,
  useBackground,
  useElementSize,
  useRef,
  useState,
  useEffect,
} from "uu5g05";
import MenuItem from "../menu-item.js";
import Config from "../config/config.js";
import Bar from "./bar.js";
import TabsItem from "./tabs-item.js";
import UuGds from "./gds.js";
import ActionGroup from "../action-group.js";
import useSpacing from "../use-spacing.js";
import ScrollableBox from "../scrollable-box.js";
import Dropdown from "../dropdown.js";
//@@viewOff:imports

const SHADOW_RESERVE = 3;

function scrollIntoViewIfNeeded(element, scrollerElement) {
  if (!scrollerElement || !element) return;
  let scrollerRect = scrollerElement.getBoundingClientRect();
  let elementRect = element.getBoundingClientRect();

  // if we're first/last tab item in tab list in scroller then scroll entirely to the left/right (so that we see
  // box-shadows and don't see gradient scroll indicators)
  let doScrollIntoView = true;
  if (element.parentNode?.parentNode === scrollerElement) {
    if (!element.previousSibling && !element.parentNode.previousSibling) {
      if (scrollerElement.scrollLeft !== 0) scrollerElement.scrollLeft = 0;
      doScrollIntoView = false;
    } else if (!element.nextSibling && !element.parentNode.nextSibling) {
      scrollerElement.scrollLeft = scrollerElement.scrollWidth;
      doScrollIntoView = false;
    }
  }

  if (doScrollIntoView) {
    // scroll the element to the nearest edge of scrollElement (if it is not entirely visible)
    // and in case that the element is wider than scrollElement, prefer alignment of left edges
    const EXTRA_SPACE_NEAR_EDGE = 16;
    if (
      elementRect.width + 2 * EXTRA_SPACE_NEAR_EDGE >= scrollerRect.width ||
      elementRect.left < scrollerRect.left + EXTRA_SPACE_NEAR_EDGE
    ) {
      scrollerElement.scrollLeft += elementRect.left - scrollerRect.left - EXTRA_SPACE_NEAR_EDGE; // scroll to left edge
    } else if (elementRect.right > scrollerRect.right - EXTRA_SPACE_NEAR_EDGE) {
      scrollerElement.scrollLeft += elementRect.right - scrollerRect.right + EXTRA_SPACE_NEAR_EDGE; // scroll to right edge
    }
  }
}

const Css = {
  main: ({ type, background, displayBottomLine }) => {
    let staticClassName = Config.Css.css({
      position: "relative",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      flexWrap: "nowrap",
    });

    let borderBottomStyles, boxShadowStyles;
    if (type === "line") {
      let states = UuGds.getValue(["Shape", "line", background, "neutral", "subdued"]);
      let shapeStyles = UuGds.Shape.getStateStyles(states.default, true);
      borderBottomStyles = displayBottomLine
        ? {
            borderBottomWidth: shapeStyles?.borderWidth,
            borderBottomStyle: shapeStyles?.borderStyle,
            borderBottomColor: shapeStyles?.borderColor,
          }
        : undefined;
    } else if (type === "card-inner") {
      let states = UuGds.getValue(["Shape", "ground", background, "building", "common"]);
      let shapeStyle = UuGds.Shape.getStateStyles(states.default, true);
      boxShadowStyles = {
        "&:after": {
          content: '""',
          display: "block",
          position: "absolute",
          bottom: -4,
          left: 0,
          right: 0,
          boxShadow: shapeStyle.boxShadow,
          height: 4,
          clipPath: "inset(-8px 0px 3px 0px)", // keep shadow which extends 8px upwards from the element
        },
      };
    }
    let dynamicStyles = {
      ...borderBottomStyles,
      ...boxShadowStyles,
    };
    return Utils.Css.joinClassName(staticClassName, Config.Css.css(dynamicStyles));
  },
  dropdown: ({ spacing }) => {
    return Config.Css.css({
      flex: "none",
      marginBottom: spacing.b,
      marginLeft: spacing.d,
      marginRight: spacing.d,
    });
  },
  tabListWrapperNoScrolling: ({ type, block, justified }) => {
    return Config.Css.css({
      flex: justified ? "1 1 auto" : undefined,
      minWidth: 0,
      width: block ? "100%" : undefined,
      paddingTop:
        type === "card-outer" || type === "card-inner" ? UuGds.getValue(["SpacingPalette", "fixed", "b"]) : undefined,
    });
  },
  scrollableBox: () =>
    Config.Css.css({
      zIndex: 1,
    }),
  tabList: ({ isOverflowing, type, block }) => {
    let staticClassName = Config.Css.css({
      display: "flex",
      alignItems: "flex-end",
      whiteSpace: "nowrap",
    });
    let dynamicStyles = {
      marginTop:
        type === "card-outer" || type === "card-inner" ? UuGds.getValue(["SpacingPalette", "fixed", "b"]) : undefined,
      paddingLeft: isOverflowing && (type === "card-outer" || type === "card-inner") ? SHADOW_RESERVE : 0,
      paddingRight: isOverflowing && (type === "card-outer" || type === "card-inner") ? SHADOW_RESERVE : 0,
      minWidth: block ? "100%" : "max-content",
    };

    return Utils.Css.joinClassName(staticClassName, Config.Css.css(dynamicStyles));
  },
  item: ({ isFirst, spacing, type, isLast, isOverflowing, hasActions, block }) => {
    const styles = {
      "&&&": {
        marginLeft:
          isFirst && isOverflowing
            ? 0
            : isFirst && type === "card-inner"
              ? spacing.d / 2
              : isFirst && type === "line"
                ? spacing.c
                : undefined,
        marginRight:
          isLast && isOverflowing && hasActions
            ? 0
            : isLast && type === "card-inner"
              ? spacing.d / 2 - (isOverflowing ? SHADOW_RESERVE : 0)
              : isLast && type === "line"
                ? spacing.c
                : undefined,
      },
      justifyContent: "center",
    };

    if (block) {
      styles.width = "100%";
      styles.display = "flex";
      styles.minWidth = 0;
    } else {
      styles.flex = "1 0 auto";
    }

    return Config.Css.css(styles);
  },
  actions: ({ spacing }) => {
    return Config.Css.css({
      flex: "1 0 0%",
      marginLeft: spacing.b,
      marginTop: spacing.b,
      marginBottom: spacing.b,
      paddingRight: spacing.b,
    });
  },
  blockLabel: () =>
    Config.Css.css({
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    }),
};

const { iconRight, size, ...itemListPropTypes } = MenuItem.propTypes;
const TabsHeader = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TabsHeader",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    actionList: Bar.propTypes.actionList,
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        ...itemListPropTypes,
        code: PropTypes.string,
      }),
    ),
    type: PropTypes.oneOf(["card-outer", "card-inner", "line"]),
    size: PropTypes.oneOf(["s", "m"]),
    colorScheme: PropTypes.colorScheme,
    displayScrollButtons: PropTypes.bool,
    block: PropTypes.bool,
    displayBottomLine: PropTypes.bool,
    justified: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    actionList: undefined,
    itemList: undefined,
    type: "card-inner",
    size: "m",
    colorScheme: "primary",
    displayScrollButtons: false,
    block: false,
    displayBottomLine: true,
    justified: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      itemList,
      actionList: propsActionList,
      activeItem,
      onActivate,
      labelId,
      elementAttrs,
      type,
      size,
      colorScheme,
      block,
      displayBottomLine,
    } = props;
    const { displayScrollButtons } = props;
    const onClick = (e, item) => {
      if (typeof item.onClick === "function") item.onClick(e);
      if (!e.defaultPrevented) onActivate?.(item);
    };

    const scrollElementRef = useRef();
    const { ref: tabListRef, width: tabListWidth } = useElementSize();
    const { ref: tabListContainerRef, width: tabListContainerWidth } = useElementSize();
    let [isOverflowing, setIsOverflowing] = useState(false);
    // when component switches from normal display to being rendered in ScrollableBox, the tab list will
    // get remounted so we'll temporarily lose width information so we wouldn't be able to compute "isOverflowing"
    // properly (and we don't want to cause never-ending rendering loop) => in such case use the previous value
    // of "isOverflowing" (i.e. the one in state)
    if (tabListWidth && tabListContainerWidth) {
      let newIsOverflowing = tabListWidth > tabListContainerWidth;
      if (newIsOverflowing !== isOverflowing) {
        isOverflowing = newIsOverflowing;
        setIsOverflowing(newIsOverflowing);
      }
    }

    const activeItemRef = useRef();
    useEffect(() => {
      if (isOverflowing) {
        // postpone a bit because ActionGroup might be measuring its children (in which case we
        // might be temporarily shrinked)
        let timeout = setTimeout(() => scrollIntoViewIfNeeded(activeItemRef.current, scrollElementRef.current), 0);
        return () => clearTimeout(timeout);
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [isOverflowing, activeItem?.code || activeItem]);

    function scroll(direction) {
      let scrollerEl = scrollElementRef.current;
      if (!scrollerEl) return;
      if (direction < 0 && scrollerEl.scrollLeft === 0) return;
      // scroll by half of the visible width
      scrollerEl.scrollLeft += direction * Math.round(scrollerEl.clientWidth / 2);
    }
    const showScrollButtons = displayScrollButtons && isOverflowing;
    let actionList = propsActionList;
    if (showScrollButtons) {
      actionList = [
        { icon: "uugds-chevron-left", collapsed: false, onClick: () => scroll(-1) },
        { icon: "uugds-chevron-right", collapsed: false, onClick: () => scroll(1) },
        ...(actionList || []),
      ];
    }
    const hasActions = actionList && actionList.length > 0;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let spacing = useSpacing();
    let background = useBackground();

    function _renderTabList() {
      return (
        <div role="tablist" className={Css.tabList({ ...props, isOverflowing })} ref={tabListRef}>
          {itemList?.map((it, i) => {
            const { key, ...itemProps } = it;
            return (
              <TabsItem
                key={key ?? it.code ?? i}
                id={`${labelId}-${it.code ?? i}`}
                colorScheme={colorScheme}
                {...itemProps}
                label={getTabItemLabel(it.label, block)}
                type={type}
                onClick={(e) => onClick(e, it)}
                active={it === activeItem}
                className={Utils.Css.joinClassName(
                  Css.item({
                    ...props,
                    spacing,
                    isFirst: i === 0,
                    isLast: i === itemList.length - 1,
                    isOverflowing,
                    hasActions,
                  }),
                  it.className,
                )}
                elementAttrs={{ ...elementAttrs, role: "tab", "aria-selected": it === activeItem }}
                elementRef={Utils.Component.combineRefs(it.elementRef, it === activeItem ? activeItemRef : undefined)}
                size={size}
              />
            );
          })}
        </div>
      );
    }
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main({ ...props, background, displayBottomLine }));
    return (
      <div {...attrs}>
        {isOverflowing && (
          <Dropdown
            className={Css.dropdown({ ...props, spacing, isOverflowing })}
            icon="uugds-menu"
            iconOpen={null}
            iconClosed={null}
            itemList={itemList?.map((it) => {
              const { children, label, ...restIt } = it;
              return {
                ...restIt,
                children: label,
                onClick: (e) => onClick(e, it),
              };
            })}
            significance="subdued"
            size={size}
          />
        )}
        {isOverflowing ? (
          // NOTE By default we're rendering tab list outside of ScrollableBox, because we don't want to clip
          // box-shadow of active tab (e.g. if 1st tab is active for type="card-outer" then tab item's shadow extends
          // outwards from the left edge of the whole component; and if it was in ScrollableBox with overflow: xyz, then
          // it would be clipped). And if we later detect that a scrolling mechanism is necessary, we remount it
          // in ScrollableBox and show extra Dropdown on the left side (so box-shadow clipping issue cannot happen on left side;
          // and for other edges we ensure that there is a padding INSIDE of ScrollableBox where active item's shadow can
          // bleed out to).
          <ScrollableBox
            horizontal
            className={Css.scrollableBox(props)}
            scrollIndicator={{ left: "gradient", right: hasActions ? "gradient" : "disappear" }}
            scrollIndicatorOffset={{
              leftTop:
                type === "card-outer" || type === "card-inner"
                  ? UuGds.getValue(["SpacingPalette", "fixed", "b"]) - 1 // make gradient indicator be as tall as tab item + 1px (for tab item top shadow)
                  : 0,
              rightTop:
                (type === "card-outer" || type === "card-inner") && hasActions
                  ? UuGds.getValue(["SpacingPalette", "fixed", "b"]) - 1 // make gradient indicator be as tall as tab item + 1px (for tab item top shadow)
                  : 0,
              rightBottom: (type === "card-outer" || type === "card-inner") && !hasActions ? 2 : 0, // 2px so that bottom 2px of active item (has background) doesn't get masked out (otherwise box-shadow of tab content container would start showing up)
            }}
            elementRef={tabListContainerRef}
            scrollElementRef={scrollElementRef}
            scrollbarWidth={0}
          >
            {_renderTabList()}
          </ScrollableBox>
        ) : (
          <div className={Css.tabListWrapperNoScrolling(props)} ref={tabListContainerRef}>
            {_renderTabList()}
          </div>
        )}
        {hasActions ? (
          <ActionGroup
            className={Css.actions({ ...props, spacing, isOverflowing })}
            itemList={actionList}
            size={size}
          />
        ) : null}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function getTabItemLabel(label, block) {
  if (!block) return label;

  return <div className={Css.blockLabel()}>{label}</div>;
}
//@@viewOff:helpers

export { TabsHeader };
export default TabsHeader;
