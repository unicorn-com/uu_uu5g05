//@@viewOn:imports
import { createVisualComponent, PropTypes, useRef, useState, useEffect, useLayoutEffect, Utils } from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import MenuItem from "../menu-item.js";
import Line from "../line.js";
import ScrollableBox from "../scrollable-box.js";
import MenuListContentComponents from "../_internal/cyclic-components.js";
import MenuPropTypes from "./menu-prop-types.js";
import Tools from "../_internal/tools.js";
//@@viewOff:imports

const Css = {
  main: (props) =>
    Config.Css.css({
      display: "grid", // NOTE If changed, propagate to MenuPanel's collapsibleColorScheme Line wrapper too.
      gap: getGap(),
      alignContent: "start", // required for Safari 16.x, otherwise e.g. component catalogue stencil list is messed up (menu items 5x higher than they should be, etc.)

      borderRadius: "inherit",
    }),
};

function getGap() {
  return UuGds.getValue(["SpacingPalette", "fixed", "a"]);
}

function fillIconSpace(itemList, parentItemTree = false) {
  let groupIndex = 0;
  const groupList = [];

  return itemList
    .map((data) => {
      const { icon, component, collapsible, divider } = data;

      if (divider) {
        groupIndex++;
      } else if (parentItemTree || (icon && !component) || collapsible === "tree") {
        groupList[groupIndex] = true;
      }

      return {
        data,
        groupIndex,
      };
    })
    .map(({ data, groupIndex }) => {
      if (!data.divider) {
        const updated = {};
        if (
          groupList[groupIndex] &&
          !data.icon &&
          (!data.component || !data.component.defaultProps?.icon) &&
          !data.heading &&
          !data._hideIcon
        ) {
          updated.icon = "empty";
        }
        if (data.itemList) {
          updated.itemList = fillIconSpace(data.itemList, data.collapsible === "tree");
        }
        if (Object.keys(updated).length) data = { ...data, ...updated };
      }
      return data;
    });
}

const MenuListBody = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MenuListBody",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: MenuPropTypes.itemList,
    maxHeight: PropTypes.unit,
    role: PropTypes.string,
    collapsibleIconVisibility: PropTypes.oneOf(["onHover", "always"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: [],
    maxHeight: undefined,
    role: "menu",
    itemBorderRadius: "moderate",
    size: "m",
    collapsibleIconVisibility: "always",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      itemList,
      onClick,
      onClose,
      itemBorderRadius,
      background,
      colorScheme,
      size,
      significance,
      maxHeight,
      elementRef,
      elementAttrs,
      role,
      onCloseMenuPanel,
      openSubmenuAction,
      disabled,
      collapsibleIconVisibility,
      _isNestedMenu,
      ...otherProps
    } = props;

    const { itemList: usedItemList, initialScrollY, ref: menuRef } = useFocusedItemScrollPosition(itemList, maxHeight);
    const refs = useRef([]);
    const indexFirstItemToFocus = useRef(Tools.getItemIndexToFocus(usedItemList)); // focus on an item using the Tab key

    useEffect(() => {
      const i = usedItemList.findIndex((item) => item.autoFocus);
      if (i > -1) {
        let timeout = setTimeout(() => refs.current[i]?.focus(), 50);
        return () => clearTimeout(timeout);
      }
    }, []);

    function onKeyDown(e) {
      if (typeof elementAttrs?.onKeyDown === "function") elementAttrs.onKeyDown(e);
      let currentFocusIndex = refs.current.indexOf(e.target);
      // not checking whether focus is inside of one of menu items because menu item can contain input
      // (e.g tiles SearchButton collapsed inside of ActionGroup) and we don't want to proces keys in such case
      if (currentFocusIndex === -1) return;

      let keyProcessed = true;
      let keyWithModifiers = Tools.getKeyWithModifiers(e);
      switch (keyWithModifiers) {
        case "ArrowUp": {
          let newFocusIndex = currentFocusIndex - 1;
          while (newFocusIndex > 0 && !refs.current[newFocusIndex]) {
            newFocusIndex--;
          }
          if (refs.current[newFocusIndex]) {
            refs.current[Math.max(0, newFocusIndex)]?.focus();
          }
          break;
        }
        case "ArrowDown": {
          let newFocusIndex = currentFocusIndex + 1;
          while (newFocusIndex < usedItemList.length && !refs.current[newFocusIndex]) {
            newFocusIndex++;
          }
          if (refs.current[newFocusIndex]) {
            refs.current[Math.min(usedItemList.length - 1, newFocusIndex)]?.focus();
          }
          break;
        }
        case "Tab": {
          if (_isNestedMenu && currentFocusIndex === usedItemList.length - 1) {
            e.preventDefault();
            e.stopPropagation();
          }
          break;
        }
        case "Shift+Tab": {
          if (_isNestedMenu && currentFocusIndex === 0) {
            e.preventDefault();
            e.stopPropagation();
          }
          break;
        }
        case "Escape":
        case "ArrowLeft":
          if (!e.isDefaultPrevented()) {
            typeof onClose === "function" && onClose(new Utils.Event({ autoFocus: true }, e)); // set focus to parent MenuItem
            typeof onCloseMenuPanel === "function" && onCloseMenuPanel();
          }
          break;
        case "Home": {
          const itemIndexToFocus = Tools.getItemIndexToFocus(usedItemList);
          refs.current[itemIndexToFocus]?.focus();
          break;
        }
        case "End": {
          const itemIndexToFocus = Tools.getItemIndexToFocus(usedItemList, true) + 1;
          refs.current[usedItemList.length - itemIndexToFocus]?.focus();
          break;
        }
        default: {
          // check for key with length === 1, optionally using Shift
          if (/^(Shift\+)?.$/.test(keyWithModifiers) && e.key !== " ") {
            let char = e.key.toLowerCase();
            const firstSearchedItem = usedItemList.findIndex((item) => {
              const isFocusableItem =
                !item.heading || item.actionList || item.onLabelClick || item.itemList || item.onClick;
              const isCharSame = typeof item.children === "string" ? item.children[0]?.toLowerCase() === char : null;
              return !item.divider && isFocusableItem && isCharSame;
            });
            if (firstSearchedItem > -1) {
              refs.current[firstSearchedItem]?.focus();
            }

            break;
          } else {
            keyProcessed = false;
          }
        }
      }

      // do not block unprocessed keys such as F5, etc.
      if (keyProcessed && e.key !== "Tab") {
        e.preventDefault(); // because of scrolling whole window
        e.stopPropagation(); // because of repeated calling
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let Component;
    let componentProps;
    if (maxHeight !== undefined) {
      Component = ScrollableBox;
      componentProps = {
        ...otherProps,
        className: Utils.Css.joinClassName(otherProps.className, Css.main()),
        maxHeight,
        initialScrollY,
        disableOverscroll: true,
        elementRef: Utils.Component.combineRefs(elementRef, menuRef),
        elementAttrs: { role, ...elementAttrs, onKeyDown },
        disabled,
      };
    } else {
      Component = "div";
      componentProps = { role, ...Utils.VisualComponent.getAttrs(props, Css.main()), onKeyDown };
    }

    const filledItemList = fillIconSpace(usedItemList);

    return (
      <Component {...componentProps}>
        {filledItemList.map(
          (
            { heading, divider, active, borderRadius, elementRef, collapsible, elementAttrs, component, ...item },
            i,
            arr,
          ) => {
            let result;

            let createOnClick = (it) => {
              return (it.onClick || (!it.itemList && !heading)) && !divider && (it.onClick || onClick)
                ? (e) => {
                    typeof it.onClick === "function" && it.onClick(e);
                    if (!e.defaultPrevented) {
                      // call our own onClick (close whole menu)
                      typeof onClick === "function" && onClick(e);
                    }
                  }
                : it.onClick;
            };
            let addOnClickForItemList = (itemList) => {
              return itemList?.map((it) => ({
                ...it,
                onClick: createOnClick(it),
                itemList: addOnClickForItemList(it.itemList),
              }));
            };

            if (!component && divider) {
              const { b, c } = UuGds.getValue(["SpacingPalette", "fixed"]);
              result = (
                <Line
                  key={i}
                  background={background}
                  colorScheme="neutral"
                  significance="subdued"
                  margin={`${b}px 0px`}
                />
              ); // TODO gds nespecifikuje spacing okolo čáry
            } else {
              const ContentComponent = collapsible ? MenuListContentComponents.MenuPanel : (component ?? MenuItem);
              let propsToPass = {
                key: i,
                _itemKey: item.key, // This is necessary for proper pairing in MenuItem
                ...item,
                heading,
                collapsible,
                collapsibleIconVisibility,
                elementRef:
                  !collapsible && !item.onLabelClick && !item.itemList && !item.onClick
                    ? elementRef
                    : Utils.Component.combineRefs((ref) => (refs.current[i] = ref), elementRef),
                background: item.background || background,
                colorScheme: item.colorScheme || colorScheme,
                significance: item.significance || significance,
                size: item.size || size,
                borderRadius: borderRadius == null ? itemBorderRadius : borderRadius,
                onClick: createOnClick(item),
                onLabelClick: collapsible || item.itemList ? item.onLabelClick : undefined,
                itemList: typeof onClick === "function" ? addOnClickForItemList(item.itemList) : item.itemList,
                _isNestedMenu: _isNestedMenu ? _isNestedMenu : !!item.itemList,
                elementAttrs: {
                  "aria-selected": active,
                  "aria-posinset": i + 1,
                  "aria-setsize": usedItemList.length,
                  tabIndex: i === indexFirstItemToFocus.current ? 0 : -1,
                  ...elementAttrs,
                },
                openSubmenuAction: item.openSubmenuAction ?? openSubmenuAction,
                disabled: item.disabled ?? disabled,
              };
              if (collapsible) {
                propsToPass.listGap = getGap();
              }

              result = Tools.getElement(ContentComponent, propsToPass);
            }

            return result;
          },
        )}
      </Component>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function useFocusedItemScrollPosition(itemList, maxHeight) {
  const [initialScrollY, setInitialScrollY] = useState();

  const menuRef = useRef();
  const focusedItemRef = useRef();

  let focusedItemIndex = itemList.findIndex((item) => item.focused);

  if (maxHeight && focusedItemIndex > -1) {
    itemList = [...itemList];
    itemList[focusedItemIndex] = { ...itemList[focusedItemIndex] };
    itemList[focusedItemIndex].elementRef = Utils.Component.combineRefs(
      focusedItemRef,
      itemList[focusedItemIndex].elementRef,
    );
  }

  useLayoutEffect(() => {
    if (maxHeight && focusedItemIndex > -1 && focusedItemRef.current && menuRef.current) {
      let scrollMenuRect = menuRef.current.getBoundingClientRect();
      let focusedItemRect = focusedItemRef.current.getBoundingClientRect();

      let centerMenu = scrollMenuRect.height / 2 - focusedItemRect.height / 2;
      // calculating the top of the item for each item in the menu
      let itemTop = focusedItemRect.height * (focusedItemIndex + 1) - focusedItemRect.height;
      let scrollSize = itemTop - centerMenu;

      setInitialScrollY(scrollSize);
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [focusedItemIndex]);

  return { ref: menuRef, itemList, initialScrollY };
}

//@@viewOff:helpers

export { MenuListBody };
export default MenuListBody;
