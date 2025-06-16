//@@viewOn:imports
import { createVisualComponent, useRef, useState, Utils, useLayoutEffect, useCallback, PropTypes } from "uu5g05";
import Popover from "../popover.js";
import Config from "../config/config.js";
import MenuPropTypes from "./menu-prop-types.js";
import _MenuItem from "./menu-item.js";
import MenuListContentComponents from "../_internal/cyclic-components.js";
import { useMenuListContext } from "./menu-list-context.js";
import Tools from "../_internal/tools.js";
//@@viewOff:imports

//@@viewOn:constants
const TIMEOUT = 100;
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const _SubmenuItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "_SubmenuItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: MenuPropTypes.itemList,
    onLabelClick: PropTypes.func,
    openSubmenuAction: PropTypes.oneOf(["click", "hover"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: undefined, // don't change to [] (or fix MenuItem defaultProps afterwards)
    onLabelClick: undefined,
    openSubmenuAction: "hover",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      itemList,
      iconRight,
      elementRef,
      hoverable,
      elementAttrs,
      onClick: propsOnClick,
      onLabelClick,
      openSubmenuAction,
      collapsibleIconVisibility,
      _isNestedMenu,
      ...otherProps
    } = props;
    const { disabled } = otherProps;
    const { size = _MenuItem.defaultProps.size } = props;

    const menuRef = useRef();
    const [openParams, setOpenParams] = useState(false);
    const [openPopover, setOpenPopover] = useState(false);

    const { openSubmenu: openSubmenu } = useMenuListContext();
    const currentValuesRef = useRef();
    currentValuesRef.current = { openSubmenu: openSubmenu, props };

    const doOpen = useCallback((autoFocus, e) => {
      const { openSubmenu, props } = currentValuesRef.current;
      const openParams = { autoFocus };
      if (openSubmenu) openSubmenu(props, e, openParams);
      else setOpenParams(openParams);
    }, []);

    const close = useCallback(() => {
      setOpenParams(false);
      setOpenPopover(false);
    }, []);

    const handleSubmenuClose = (e) => {
      close();
      if (e.data.autoFocus) menuRef.current?.focus();
    };

    const openViaParent = !!openSubmenu;
    const openOnHover = !openViaParent && openSubmenuAction === "hover";
    const openByClick = openViaParent;

    const [id] = useState(() => Utils.String.generateId());

    const openingTimeoutRef = useRef();
    const closingTimeoutRef = useRef();

    const handleMouseEnter = useCallback(() => {
      clearTimeout(closingTimeoutRef.current);
      closingTimeoutRef.current = undefined;
      if (!openingTimeoutRef.current) {
        openingTimeoutRef.current = setTimeout(() => !openParams && doOpen(false), TIMEOUT);
      }
    }, [doOpen, openParams]);

    const handleMouseLeave = useCallback(() => {
      clearTimeout(openingTimeoutRef.current);
      openingTimeoutRef.current = undefined;
      if (!closingTimeoutRef.current) {
        closingTimeoutRef.current = setTimeout(() => openParams && close(), TIMEOUT);
      }
    }, [close, openParams]);

    useLayoutEffect(() => {
      return () => {
        clearTimeout(openingTimeoutRef.current);
        clearTimeout(closingTimeoutRef.current);
      };
    }, []);

    const hasLabelClick = typeof onLabelClick === "function" || otherProps.href;
    const has2Segments = hasLabelClick && openByClick;
    const handleOpenSubmenu = (e) =>
      doOpen(e.key === "Enter" || e.key === "NumpadEnter" || e.key === " " || e.key === "ArrowRight", e);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let popover, elementAttrsAria;

    if (
      !disabled &&
      ((openSubmenuAction === "hover" && openOnHover) || (openSubmenuAction === "click" && openPopover))
    ) {
      elementAttrsAria = { "aria-haspopup": "menu", "aria-expanded": !!openParams, "aria-controls": id + "-popover" };
      if (openParams) {
        itemList = [...itemList];
        const itemIndexToFocus = Tools.getItemIndexToFocus(itemList);
        itemList[itemIndexToFocus] = { ...itemList[itemIndexToFocus], autoFocus: openParams.autoFocus };

        popover = (
          <Popover
            id={id + "-popover"}
            className={Config.Css.css(Config.POPOVER_MENU_STYLES)}
            element={menuRef.current}
            preferredPosition="right-bottom"
            elementAttrs={
              openSubmenuAction === "hover"
                ? {
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                  }
                : undefined
            }
            testId="popover"
            onClose={openSubmenuAction === "click" ? () => close() : undefined}
          >
            <MenuListContentComponents.MenuListBody
              itemList={itemList}
              onClose={handleSubmenuClose}
              compactSubmenu={false}
              size={size}
              openSubmenuAction={openSubmenuAction}
              collapsibleIconVisibility={collapsibleIconVisibility}
              _isNestedMenu={_isNestedMenu}
            />
          </Popover>
        );
      }
    }

    iconRight = iconRight === false ? undefined : iconRight || true;
    hoverable = hoverable ?? true;
    Object.assign(otherProps, { hoverable });

    return (
      <>
        <_MenuItem
          {...otherProps}
          iconRight={has2Segments ? undefined : iconRight}
          focused={openPopover || otherProps.focused}
          onClick={
            has2Segments
              ? otherProps.onClick
              : openSubmenuAction === "click"
                ? (e) => {
                    setOpenPopover(true);
                    handleOpenSubmenu(e);
                  }
                : Tools.combineListeners(otherProps.onClick, (e) => !e.defaultPrevented && handleOpenSubmenu(e))
          }
          onLabelClick={has2Segments ? onLabelClick : undefined}
          actionList={
            has2Segments
              ? [
                  ...(otherProps.actionList || []),
                  {
                    icon:
                      iconRight === true ? MenuListContentComponents.MenuItemBody.ICON_RIGHT : (iconRight ?? "empty"),
                    collapsed: false,
                    order: 100,
                    onClick: handleOpenSubmenu,
                    elementAttrs: {
                      ...elementAttrsAria,
                      onKeyDown: (e) => {
                        const keyWithModifiers = Tools.getKeyWithModifiers(e);
                        switch (keyWithModifiers) {
                          case "Enter":
                          case "NumpadEnter":
                          case " ":
                            e.preventDefault();
                            !openParams && doOpen(true);
                            break;
                        }
                      },
                    },
                    colorScheme: props.colorScheme,
                    testId: "submenu-arrow",
                  },
                ]
              : otherProps.actionList
          }
          elementRef={Utils.Component.combineRefs(menuRef, elementRef)}
          elementAttrs={{
            ...(has2Segments ? undefined : elementAttrsAria),
            ...elementAttrs,
            onKeyDown: (e) => {
              if (typeof elementAttrs?.onKeyDown === "function") elementAttrs.onKeyDown(e);
              if (!e.defaultPrevented) {
                const keyWithModifiers = Tools.getKeyWithModifiers(e);
                switch (keyWithModifiers) {
                  case "ArrowRight":
                  case "Enter":
                  case "NumpadEnter":
                  case " ": // space
                    if (keyWithModifiers === "ArrowRight" || !hasLabelClick) {
                      e.preventDefault();
                      if (!openParams) {
                        doOpen(true);
                        if (openSubmenuAction === "click") setOpenPopover(true);
                      }
                    }
                    break;
                }
              }
            },
            onMouseEnter: Tools.combineListeners(
              elementAttrs?.onMouseEnter,
              openOnHover ? handleMouseEnter : undefined,
            ),
            onMouseLeave: Tools.combineListeners(
              elementAttrs?.onMouseLeave,
              openOnHover ? handleMouseLeave : undefined,
            ),
          }}
        />
        {popover}
      </>
    );
    //@@viewOff:render
  },
});

export { _SubmenuItem };
export default _SubmenuItem;
