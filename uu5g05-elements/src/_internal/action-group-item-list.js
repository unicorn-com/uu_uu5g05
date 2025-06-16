//@@viewOn:imports
import { Utils, createComponent, useRef } from "uu5g05";
import Config from "../config/config.js";
import Button from "../button.js";
import Dropdown from "../dropdown.js";
import Line from "../line.js";
import Tools from "./tools.js";
import UuGds from "./gds.js";
//@@viewOff:imports

//@@viewOn:constants
const BUTTON_MARGIN = UuGds.getValue(["SpacingPalette", "fixed", "c"]);
const DIVIDER_MARGIN = UuGds.getValue(["SpacingPalette", "fixed", "b"]);
const MENU_SIGNIFICANCE = "subdued";
const COLLAPSED = {
  NEVER: "never",
  ALWAYS: "always",
  AUTO: "auto",
  DUPLICATED: "duplicated",
};
const PHASE = {
  MEASURE_FULL: "measureFull",
  MEASURE_ICON: "measureIcon",
  RENDER_COMPUTED: "renderComputed",
};

const CLASS_NAMES = {
  emptyButton: () =>
    Config.Css.css({
      display: "inline-block",
      width: 0,
      height: 1,
      overflow: "hidden",
    }),
  item: ({ marginLeft, order }) => Config.Css.css({ marginLeft, order }),
  divider: ({ order }) => Config.Css.css({ order, alignSelf: "stretch" }),
};

const ABSOLUTE_POSITION_STYLE = {
  position: "absolute",
  bottom: "100%",
  right: "100%",
  left: "auto",
  top: "auto",
};
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

let ActionGroupItemList = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ActionGroupItemList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, renderPhase, itemStates, collapsedMenuProps, menuWidth, size, menuState, openSubmenuAction } =
      props;
    const menuLastItemListRef = useRef([]);
    const spacing = UuGds.SpacingPalette.getValue(["fixed"]);

    function renderButton({ item, type, key, marginLeft = BUTTON_MARGIN, width = 0, itemState }) {
      let result;
      if (item.collapsed === COLLAPSED.ALWAYS) {
        result = (
          <span
            key={key}
            className={CLASS_NAMES.emptyButton() + " " + CLASS_NAMES.item({ marginLeft })}
            style={ABSOLUTE_POSITION_STYLE}
            data-width={width}
          />
        );
      } else if (item.divider) {
        let space = size?.match(/^(xxs|xs|s)$/) ? spacing.b : spacing.c;
        result = (
          <Line
            key={key}
            direction="vertical"
            margin={{ left: marginLeft, top: space, bottom: space, right: 0 }}
            className={CLASS_NAMES.divider({ order: item.order })}
            colorScheme={item.colorScheme || "building"}
            significance={item.significance || "subdued"}
            style={itemState?.type === "full" || itemState?.type === "icon" ? undefined : ABSOLUTE_POSITION_STYLE}
            elementAttrs={{ "data-width": width }}
          />
        );
      } else {
        let {
          icon,
          children,
          primary,
          className,
          colorScheme,
          significance,
          tooltip,
          order,
          component,
          key: _key,
          ...otherProps
        } = item;
        if (primary) {
          if (!colorScheme) colorScheme = "primary";
          if (!significance) significance = "highlighted";
        }

        let Component = Button;
        if (component) {
          Component = component;
          otherProps.displayType = type === "icon" && icon ? "button-compact" : "button";
        }

        let propsToPass = {
          key,
          icon,
          tooltip: tooltip || (type !== "full" && typeof children === "string" ? children : undefined),
          className: Utils.Css.joinClassName(CLASS_NAMES.item({ marginLeft, order }), className),
          colorScheme: colorScheme || "dim",
          significance: significance || "subdued",
          size,
          openSubmenuAction,
          ...otherProps,
          elementAttrs: { ...otherProps.elementAttrs, "data-width": width },
          children: type === "full" || (type === "icon" && !icon) ? children : null,
        };

        result = Tools.getElement(Component, propsToPass);
      }
      return result;
    }

    function renderDropdown({ item, type, key, marginLeft = BUTTON_MARGIN, width = 0 }) {
      let result;
      if (item.collapsed === COLLAPSED.ALWAYS) {
        result = (
          <span
            key={key}
            className={CLASS_NAMES.emptyButton() + " " + CLASS_NAMES.item({ marginLeft })}
            style={ABSOLUTE_POSITION_STYLE}
            data-width={width}
          />
        );
      } else {
        let {
          icon,
          children,
          collapsedIcon,
          collapsedChildren,
          primary,
          className,
          colorScheme,
          significance,
          tooltip,
          order,
          component,
          key: _key,
          ...otherProps
        } = item;
        if (primary) {
          if (!colorScheme) colorScheme = "primary";
          if (!significance) significance = "highlighted";
        }

        let Component = Dropdown;
        if (component) {
          Component = component;
          otherProps.displayType = type === "icon" && icon ? "button-compact" : "button";
        }

        let propsToPass = {
          key,
          icon: icon,
          className: Utils.Css.joinClassName(CLASS_NAMES.item({ marginLeft, order }), className),
          colorScheme: colorScheme || "dim",
          significance: significance || "subdued",
          tooltip: tooltip || (type !== "full" && typeof children === "string" ? children : undefined),
          size,
          openSubmenuAction,
          ...otherProps,
          label: type === "full" || (type === "icon" && !icon) ? children : undefined,
          elementAttrs: { ...otherProps.elementAttrs, "data-width": width },
        };

        result = Tools.getElement(Component, propsToPass);
      }
      return result;
    }

    function renderDropdownMenu(menuItems, style, marginLeft = BUTTON_MARGIN, menuWidth = 0) {
      return (
        <Dropdown
          icon="uugds-dots-vertical"
          iconOpen={null}
          iconClosed={null}
          significance={MENU_SIGNIFICANCE}
          colorScheme="dim"
          size={size}
          openPosition="bottom-left"
          openSubmenuAction={openSubmenuAction}
          {...collapsedMenuProps}
          style={style ? { ...collapsedMenuProps?.style, ...style } : collapsedMenuProps?.style}
          key="menu"
          iconNotification={collapsedMenuProps?.iconNotification ?? menuItems.some((item) => item.iconNotification)}
          className={Utils.Css.joinClassName(collapsedMenuProps?.className, CLASS_NAMES.item({ marginLeft }))}
          itemList={menuItems.map(({ collapsedIcon, collapsedChildren, ...item }) => {
            if (collapsedIcon !== undefined) item.icon = collapsedIcon;
            if (collapsedChildren !== undefined) item.children = collapsedChildren;
            if (item.component !== undefined) item.displayType = "menu-item";
            return item;
          })}
          elementAttrs={{ ...collapsedMenuProps?.elementAttrs, "data-width": menuWidth }}
        />
      );
    }

    function renderAsMeasure(items, type) {
      return items
        .map((item, i) =>
          (item.itemList ? renderDropdown : renderButton)({
            item: { ...item, elementRef: Utils.Component.combineRefs(item.elementRef, itemStates[i]?.elementRef) },
            type,
            key: item.key || i,
            // pass intended itemState so that if divider's itemState is "menu" and we're in measuring phase,
            // we'll render it using absolute position so that it doesn't enlarge root element
            itemState: itemStates[i],
            marginLeft: i ? itemStates[i]?.marginLeft : 0,
          }),
        )
        .concat([
          renderDropdownMenu(
            // we're including menu's last itemList so that if re-measuring is happenning while this menu is opened, it doesn't get closed
            menuLastItemListRef.current,
            menuState ? undefined : ABSOLUTE_POSITION_STYLE,
            menuState?.marginLeft || 0,
          ),
        ]);
    }

    function renderAsComputed(items) {
      let result = [];
      let menuIndex;
      itemStates.forEach((itemState, i) => {
        let { type, marginLeft, skippedInMainArea } = itemState;
        if (skippedInMainArea) return;
        let item = items[i];
        if (type !== "menu") {
          let renderFn = item.itemList ? renderDropdown : renderButton;
          menuIndex ??= item.order > 0 ? result.length : undefined;
          result.push(
            renderFn({
              item: { ...item, elementRef: Utils.Component.combineRefs(item.elementRef, itemState.elementRef) },
              type,
              key: item.key || i,
              marginLeft: i ? marginLeft : 0,
              width: itemState[type],
              itemState,
            }),
          );
        }
      });
      if (menuState) {
        let collapsedItemsSet = new Set(menuState.collapsedItems);
        let menuItems = items.filter(
          (it) =>
            it.collapsed !== COLLAPSED.NEVER &&
            (it.divider ||
              it.collapsed === COLLAPSED.DUPLICATED ||
              it.collapsed === COLLAPSED.ALWAYS ||
              collapsedItemsSet.has(it)),
        );

        // sort - `primary: true` items first, then others; also omit dividers at the start/end or successive dividers
        let primaryItems = [];
        let otherItems = [];
        menuItems.forEach((it) => (it.primary ? primaryItems : otherItems).push(it));
        let sortedMenuItems = [...primaryItems, { divider: true }, ...otherItems];
        while (sortedMenuItems.length > 0 && sortedMenuItems[0].divider) sortedMenuItems.shift();
        while (sortedMenuItems.length > 0 && sortedMenuItems[sortedMenuItems.length - 1].divider) sortedMenuItems.pop();
        for (let i = sortedMenuItems.length - 2; i >= 2; i--) {
          if (sortedMenuItems[i].divider && sortedMenuItems[i - 1].divider) sortedMenuItems.splice(i, 1);
        }

        // menu items which were Dropdown-s with onLabelClick (+itemList) should be inlined into the main level
        for (let i = sortedMenuItems.length - 1; i >= 0; i--) {
          const { onLabelClick, itemList, onClick, component, ...otherProps } = sortedMenuItems[i];
          if (!component && onLabelClick && Array.isArray(itemList)) {
            let extraItem = { ...otherProps, onClick: Tools.combineListeners(onLabelClick, onClick) };
            sortedMenuItems.splice(i, 1, extraItem, ...itemList);
          }
        }

        menuLastItemListRef.current = sortedMenuItems;
        // eslint-disable-next-line testing-library/render-result-naming-convention
        let renderedMenu = renderDropdownMenu(sortedMenuItems, undefined, menuState?.marginLeft || 0, menuWidth);
        if (menuIndex != null) result.splice(menuIndex, 0, renderedMenu);
        else result.push(renderedMenu);
      } else {
        menuLastItemListRef.current = [];
      }

      return result;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return renderPhase === PHASE.RENDER_COMPUTED
      ? renderAsComputed(itemList)
      : renderPhase === PHASE.MEASURE_FULL
        ? renderAsMeasure(itemList, "full")
        : renderPhase === PHASE.MEASURE_ICON
          ? renderAsMeasure(itemList, "icon")
          : null;
    //@@viewOff:render
  },
});
ActionGroupItemList = Utils.Component.memo(ActionGroupItemList);

export { ActionGroupItemList, BUTTON_MARGIN, DIVIDER_MARGIN, MENU_SIGNIFICANCE, COLLAPSED, PHASE };
export default ActionGroupItemList;
