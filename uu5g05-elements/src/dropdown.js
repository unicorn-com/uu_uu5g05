//@@viewOn:imports
import { createVisualComponent, PropTypes, useState, useRef, Utils, useEffect } from "uu5g05";
import Config from "./config/config.js";
import UuGds from "./_internal/gds.js";
import Button, { ICON_FONT_SIZE, getButtonPaddingStyle, getIconRightLeftPadding } from "./button.js";
import CyclicComponents from "./_internal/cyclic-components.js";
import Popover from "./popover.js";
import MenuList from "./menu-list.js";
import Link from "./link";
import Icon from "./icon";
//@@viewOff:imports

//@@viewOn:css
const Css = {
  buttonGroup: (cssProps) => {
    const { open, label, pressed } = cssProps;
    if (cssProps.size === undefined) cssProps.size = Button.defaultProps?.size || "m";
    const withIconRightPaddingStyle = getButtonPaddingStyle({ ...cssProps, iconRight: "empty" });
    const leftButtonFinalPaddingRight = `calc(${getIconRightLeftPadding()} * ${parseFloat(ICON_FONT_SIZE)})`;
    const marginDelta = `calc(0px - ${withIconRightPaddingStyle.paddingRight})`;

    // left button is clipped iff: open || rightHover || (!pressed && !leftHover) (otherwise right button is clipped)
    return Config.Css.css({
      "--uu5g05-elements-ddmd-left": "0px",
      "--uu5g05-elements-ddmd-right": marginDelta,
      [open ? "&&" : "&:has(>:last-child:hover)>*" + (!pressed ? ",&:has(>:first-child:not(:hover))" : "")]: {
        "--uu5g05-elements-ddmd-left": marginDelta,
        "--uu5g05-elements-ddmd-right": "0px",
      },
      // for FF which doesn't yet support :has()
      // TODO Remove after all browsers support :has().
      ...(!open
        ? {
            "@supports (not (selector(:has(*))))": {
              "&:hover>:first-child:not(:hover), &>:last-child:hover": {
                "--uu5g05-elements-ddmd-left": marginDelta,
                "--uu5g05-elements-ddmd-right": "0px",
              },
            },
          }
        : undefined),

      "&>:first-child": {
        // if using icon only, paddings are not actually given (resp. they're 0px and icon is centered) => omit in such case
        paddingRight: label != null ? leftButtonFinalPaddingRight : undefined,

        marginRight: "var(--uu5g05-elements-ddmd-left)",
        clipPath: `inset(0 calc(0px - var(--uu5g05-elements-ddmd-left)) 0 0)`,
      },
      "&>:last-child": {
        paddingRight: withIconRightPaddingStyle.paddingRight,
        paddingLeft: withIconRightPaddingStyle.paddingRight, // intentionally .paddingRight
        minWidth: "auto",

        marginLeft: "var(--uu5g05-elements-ddmd-right)",
        clipPath: `inset(0 0 0 calc(0px - var(--uu5g05-elements-ddmd-right)))`,
      },
    });
  },
  iconRight: () => Config.Css.css({ marginLeft: UuGds.getValue(["SpacingPalette", "inline", "e"]) }),
};
//@@viewOff:css

//@@viewOn:helpers
function _combineListeners(...listeners) {
  let fns = listeners.filter((it) => typeof it === "function");
  if (fns.length <= 1) return fns[0];
  return function (...args) {
    for (let fn of fns) fn.call(this, ...args);
  };
}
//@@viewOff:helpers

const Dropdown = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Dropdown",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Button.propTypes,
    label: PropTypes.node,
    itemList: MenuList.propTypes.itemList,
    openPosition: Popover.propTypes.preferredPosition,
    iconOpen: PropTypes.oneOfType([PropTypes.bool, PropTypes.icon]),
    iconClosed: PropTypes.oneOfType([PropTypes.bool, PropTypes.icon]),
    compactSubmenu: MenuList.propTypes.compactSubmenu,
    closeOnScroll: PropTypes.bool,
    onClick: PropTypes.func,
    onLabelClick: PropTypes.func,
    openSubmenuAction: PropTypes.oneOf(["click", "hover"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...Button.defaultProps,
    label: undefined,
    itemList: undefined,
    openPosition: Popover.defaultProps.preferredPosition,
    iconOpen: "uugds-menu-up",
    iconClosed: "uugds-menu-down",
    compactSubmenu: MenuList.defaultProps.compactSubmenu,
    closeOnScroll: false,
    onClick: undefined,
    onLabelClick: undefined,
    openSubmenuAction: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      type,
      iconRight: _,
      pressed, // not passed to Button when without onClick
      label,
      children,
      itemList,
      openPosition,
      toggleOnHover,
      compactSubmenu,
      elementAttrs,
      iconOpen,
      iconClosed,
      closeOnScroll,
      elementRef,
      onClick,
      onLabelClick,
      openSubmenuAction,
      ...buttonProps
    } = props;

    const [open, setOpen] = useState(false);
    const toggleRef = useRef({
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((prevValue) => !prevValue),
    });

    const [id] = useState(() => Utils.String.generateId());

    const buttonRef = useRef();
    const menuListRef = useRef();

    const popoverId = id + "-popover";

    useEffect(() => {
      if (open && itemList && menuListRef.current) {
        // focus on the first MenuItem
        let items = menuListRef.current.children;
        items[0].focus();
      }
    }, [open, itemList]);

    function onKeyDownMenuList(e) {
      if (e.key === "Escape") toggleRef.current.close();
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let popover;
    if (open) {
      let childProps = { onClick: toggleRef.current.close };

      const btnWidth = buttonRef.current?.getBoundingClientRect().width || 0;
      const itemListClassName = Config.Css.css({
        ...Config.POPOVER_MENU_STYLES,
        minWidth: Math.max(Config.POPOVER_MENU_STYLES.minWidth, btnWidth),
      });

      popover = (
        <Popover
          id={popoverId}
          className={itemList ? undefined : itemListClassName}
          element={buttonRef.current}
          elementOffset={4}
          onClose={toggleRef.current.close}
          preferredPosition={openPosition}
          closeOnScroll={closeOnScroll}
          testId="popover"
        >
          {itemList && (
            <MenuList
              className={itemListClassName}
              itemList={itemList}
              onClick={toggleRef.current.close}
              compactSubmenu={compactSubmenu}
              scrollIndicator="disappear"
              openSubmenuAction={openSubmenuAction}
              elementRef={menuListRef}
              elementAttrs={{ onKeyDown: onKeyDownMenuList }}
            />
          )}
          {typeof children === "function"
            ? children(childProps)
            : Utils.Element.isValid(children)
              ? Utils.Element.clone(children, childProps)
              : children}
        </Popover>
      );
    }

    let iconRight;
    if ((!popover && iconClosed !== null) || (popover && iconOpen !== null))
      iconRight = popover ? iconOpen : iconClosed;

    let elementAttrsAria = { "aria-haspopup": "menu", "aria-expanded": open, "aria-controls": popoverId };

    let Comp = Button;

    const isButtonGroup = typeof onLabelClick === "function" || buttonProps.href;
    let buttonGroupProps;
    if (isButtonGroup) {
      let { colorScheme, significance, size, borderRadius, effect, ...otherProps } = buttonProps;
      let { elementProps, componentProps } = Utils.VisualComponent.splitProps(otherProps);
      buttonProps = componentProps;
      let usedElementAttrs = {
        ...elementAttrs,
        onClick: _combineListeners(elementAttrs?.onClick, onClick),
      };
      buttonGroupProps = {
        ...elementProps,
        elementAttrs: usedElementAttrs,
        colorScheme,
        significance,
        size,
        borderRadius,
        effect,
      };
    } else {
      if (buttonProps.size === null) {
        Comp = Link;
        if (iconRight) {
          let rightIcon = <Icon icon={iconRight} />;
          label =
            label != null ? (
              <>
                {label} {rightIcon}
              </>
            ) : (
              rightIcon
            );
        }
      } else {
        buttonProps.iconRight = iconRight || undefined;
      }
    }

    return (
      <>
        {isButtonGroup ? (
          <CyclicComponents.ButtonGroup
            {...buttonGroupProps}
            elementRef={Utils.Component.combineRefs(elementRef, buttonRef)}
            className={Utils.Css.joinClassName(
              props.size !== null ? Css.buttonGroup({ ...props, open }) : undefined,
              buttonGroupProps.className,
            )}
            itemList={[
              {
                ...buttonProps,
                pressed,
                children: label,
                onClick: onLabelClick,
              },
              {
                icon: (iconRight ?? "empty") || undefined,
                pressed: open,
                onClick: toggleRef.current.toggle,
                ...(buttonGroupProps.significance === "distinct" ? { significance: "subdued" } : undefined),
                elementAttrs: elementAttrsAria,
                className: props.size === null ? Css.iconRight() : undefined,
              },
            ]}
            _displaySeparators={false}
          />
        ) : (
          <Comp
            {...buttonProps}
            pressed={open || pressed}
            elementRef={Utils.Component.combineRefs(elementRef, buttonRef)}
            elementAttrs={{ ...elementAttrsAria, ...elementAttrs }}
            onClick={(e) => {
              if (typeof onClick === "function") onClick(e);
              toggleRef.current.toggle();
            }}
          >
            {label}
          </Comp>
        )}
        {popover}
      </>
    );
    //@@viewOff:render
  },
});

export { Dropdown };
export default Dropdown;
