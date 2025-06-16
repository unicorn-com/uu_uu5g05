//@@viewOn:imports
import { createVisualComponent, createComponent, useState, useRef, Utils, useUpdateEffect, Fragment } from "uu5g05";
import CollapsibleBox from "../collapsible-box.js";
import MenuListBody from "./menu-list-body.js";
import MenuItem from "../menu-item.js";
import Icon from "../icon.js";
import Config from "../config/config.js";
import UuGds from "../_internal/gds.js";
import Tools from "../_internal/tools.js";
import _MenuItem from "./menu-item.js";
import Line from "../line.js";
//@@viewOff:imports

const Css = {
  iconRightVisibleOnHover: () => {
    return Config.Css.css({
      "& [data-uu5-icon-right]": { opacity: 0 },
      "&:hover [data-uu5-icon-right]": { opacity: 1 },
    });
  },
};

const CustomComponent = createVisualComponent({
  uu5Tag: Config.TAG + "MenuPanel.Icon",
  render(props) {
    return (
      <Icon
        colorScheme="building"
        {...props}
        className={Utils.Css.joinClassName(
          Config.Css.css({ marginRight: UuGds.getValue(["SpacingPalette", "inline", "e"]) }),
          props.className,
        )}
      />
    );
  },
});

const withCollapsedBox = (Component) => {
  return createComponent({
    uu5Tag: `withCollapsedBox(${Component.uu5Tag})`,
    defaultProps: {
      initialCollapsed: true,
    },

    render(props) {
      //@@viewOn:private
      let {
        actionList,
        itemList,
        collapsible,
        collapsibleColorScheme,
        collapsibleIconVisibility,
        listGap,
        icon,
        iconRight,
        elementAttrs,
        elementRef,
        onLabelClick: propsOnLabelClick,
        initialCollapsed,
        ...otherProps
      } = props;
      const [collapsed, setCollapsed] = useState(initialCollapsed);
      const componentRef = useRef();
      const refs = useRef();
      const [id] = useState(() => Utils.String.generateId());
      const boxId = id + "-box";

      const collapsibleIcon = collapsed ? "uugds-chevron-down" : "uugds-chevron-up";
      const has2Segments = typeof propsOnLabelClick === "function" || otherProps.href;
      const elementAttrsAria = { "aria-expanded": !collapsed, "aria-controls": boxId };
      const isTree = collapsible === "tree";

      const toggleCollapsed = () => setCollapsed((value) => !value);
      if (collapsible && !isTree && (actionList || has2Segments)) {
        actionList = [
          {
            icon: collapsibleIcon,
            collapsed: false,
            colorScheme: props.colorScheme ?? _MenuItem.defaultProps.colorScheme,
            // we need to hide this icon e.g. when using collapsible menu item with collapsibleIconVisibility="onHover" (and the icon is not hovered),
            // and we need to be able to target it in CSS selector of whole menu-item (its root element) for that
            elementAttrs: { "data-uu5-icon-right": "", ...(has2Segments ? elementAttrsAria : undefined) },
            ...(has2Segments
              ? {
                  onClick: toggleCollapsed,
                }
              : {
                  component: CustomComponent,
                }),
          },
          ...(actionList || []),
        ];
      }

      let onClick = Tools.combineListeners(otherProps.onClick, toggleCollapsed);
      let onIconClick, onLabelClick;
      if (isTree) {
        icon = collapsed ? "uugds-chevron-right" : "uugds-chevron-down";
        if (has2Segments) {
          onIconClick = (e) => {
            e.stopPropagation();
            toggleCollapsed(e);
          };
          onLabelClick = propsOnLabelClick || onClick;
          onClick = null;
        }
      } else {
        // TODO: this is for collapsible local navigation - check other scenarios
        if (iconRight === false) {
          if (icon === undefined) icon = collapsibleIcon;
          iconRight = undefined;
        } else if (collapsible && !actionList && !has2Segments) {
          iconRight = collapsibleIcon;
        }

        if (collapsibleIconVisibility === "onHover") {
          otherProps.className = Utils.Css.joinClassName(otherProps.className, Css.iconRightVisibleOnHover());
        }

        if (has2Segments) {
          onClick = otherProps.onClick;
          onLabelClick = propsOnLabelClick;
        }
      }

      const [itemToFocus, setItemToFocus] = useState();
      useUpdateEffect(() => {
        refs.current?.childNodes?.[itemToFocus.index]?.focus();
      }, [itemToFocus]);

      function onKeyDown(e) {
        if (typeof elementAttrs?.onKeyDown === "function") elementAttrs.onKeyDown(e);
        const itemIndexToFocus = Tools.getItemIndexToFocus(itemList);

        const keyWithModifiers = Tools.getKeyWithModifiers(e);
        switch (keyWithModifiers) {
          case "Enter":
          case "NumpadEnter":
            if (isTree) {
              e.preventDefault();
              onLabelClick?.(e);
            } else {
              if (typeof propsOnLabelClick !== "function") {
                e.preventDefault();
                if (collapsed) {
                  setCollapsed(false);
                  setItemToFocus({ index: itemIndexToFocus });
                } else {
                  setCollapsed(true);
                }
              }
            }
            break;
          case " ":
            if (isTree) {
              e.preventDefault();
              toggleCollapsed();
            } else {
              if (typeof propsOnLabelClick !== "function") {
                e.preventDefault();
                toggleCollapsed();
                if (collapsed) {
                  setItemToFocus({ index: itemIndexToFocus });
                }
              }
            }
            break;
          case "ArrowRight":
            e.preventDefault();
            if (collapsed) {
              setCollapsed(false);
            }
            // focus the item (but wait for re-render as the item might not be mounted yet)
            setItemToFocus({ index: itemIndexToFocus });
            break;
          case "ArrowLeft":
            if (!collapsed) {
              e.preventDefault();
              setCollapsed(true);
            }
            break;
        }
      }

      useUpdateEffect(() => {
        if (collapsed) componentRef.current.focus();
      }, [collapsed]);

      const modifiedItemList = itemList.map((item) => ({
        ...item,
        elementAttrs: { ...item.elementAttrs, tabIndex: -1 }, // added tabIndex for correct functioning of Tab key in onKeyDown function
      }));
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      let Wrapper = Fragment;
      let wrapperProps;
      if (collapsibleColorScheme) {
        Wrapper = "div";
        wrapperProps = {
          className: Config.Css.css({
            // must inherit grid & gap (same styles as MenuListBody's main element) as we effectively render 2 items (wrapped into single element)
            display: "inherit",
            gap: "inherit",
            alignContent: "inherit",
            position: "relative",
          }),
        };
      }

      return (
        <Wrapper {...wrapperProps}>
          <Component
            {...otherProps}
            icon={icon}
            iconRight={iconRight}
            onClick={onClick}
            onIconClick={onIconClick}
            onLabelClick={onLabelClick}
            actionList={actionList}
            elementAttrs={{
              ...(has2Segments ? undefined : elementAttrsAria),
              ...elementAttrs,
              onKeyDown,
            }}
            elementRef={Utils.Component.combineRefs(componentRef, elementRef)}
          />
          <CollapsibleBox
            id={boxId}
            collapsed={collapsed}
            className={
              isTree
                ? Config.Css.css({
                    // paddingLeft: UuGds.SpacingPalette.getValue(["relative", "d"], {
                    //   height: UuGds.SizingPalette.getValue(["spot", "basic", props.size]).h + 18,
                    // }),
                    paddingLeft: "1.3em",
                  })
                : undefined
            }
            elementAttrs={{ inert: collapsed ? "" : undefined }} // to not be Tab-able when collapsed
          >
            <MenuListBody
              itemList={modifiedItemList}
              elementRef={refs}
              size={otherProps.size}
              onClick={otherProps.onClick}
              onCloseMenuPanel={(e) => componentRef.current.focus()}
              openSubmenuAction={otherProps.openSubmenuAction}
              collapsibleIconVisibility={collapsibleIconVisibility}
            />
          </CollapsibleBox>
          {collapsibleColorScheme ? (
            <Line
              direction="vertical"
              significance="highlighted"
              colorScheme={collapsibleColorScheme}
              className={Config.Css.css({
                position: "absolute",
                insetBlock: `0 ${listGap || 0}px`,
                insetInlineEnd: `calc(100% + ${UuGds.getValue(["SpacingPalette", "fixed", "b"])}px)`,
                '[data-uu5portaltype^="popover"] &': {
                  insetInlineEnd: `100%`, // no extra offset when in popover
                },
              })}
            />
          ) : null}
        </Wrapper>
      );
    },
    //@@viewOff:render
  });
};

const MenuPanel = withCollapsedBox(MenuItem);

export { MenuPanel };
export default MenuPanel;
