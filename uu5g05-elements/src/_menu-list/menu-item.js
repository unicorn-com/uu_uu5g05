//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useBackground, BackgroundProvider, useDevice } from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import Tools from "../_internal/tools.js";
import Link from "../link.js";
import withTooltip from "../with-tooltip.js";
import MenuListContentComponents from "../_internal/cyclic-components.js";
import Icon from "../icon.js";
//@@viewOff:imports

//@@viewOn:css
//@@viewOff:css

function getShapeStyles({ background, colorScheme, significance, onClick, hoverable, focused, isMobileOrTablet }) {
  const states = UuGds.getValue(["Shape", "interactiveItem", background, colorScheme, significance]);
  let gdsBackground = states.default.colors?.gdsBackground;

  let defaultStyles = UuGds.Shape.getStateStyles(states.default, true);
  let hoverStyles = UuGds.Shape.getStateStyles(states.accent, false);

  if (focused) {
    defaultStyles = { ...defaultStyles, ...hoverStyles };
    gdsBackground = states.accent.colors?.gdsBackground;
  }

  let styles = {
    ...defaultStyles,

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
    },

    // TODO just for demo
    "&.saving": UuGds.Shape.getStateStyles(states.saving),
  };

  if (onClick || hoverable) {
    styles.cursor = "default";
    if (!isMobileOrTablet) styles["&:hover"] = hoverStyles;
    styles["&:focus-visible"] = hoverStyles;

    // TODO just for demo
    styles["&.accent"] = hoverStyles;
  }

  if (onClick) {
    styles.cursor = "pointer";

    // focus-within is for nested active elements - if they are pressed, this component should not look like pressed
    // active:focus is because of focus-within, because if only this component is pressed, then this styles must be used
    styles["&:active:focus, &:active:not(:focus-within), &.marked"] = UuGds.Shape.getStateStyles(states.marked);
  }

  return [styles, gdsBackground];
}

function getItemStyles({ borderRadius, icon, iconRight, actionList, children, heading, containerSize, textType }) {
  const { height, borderRadius: radius } = UuGds.getSizes("spot", "basic", containerSize, borderRadius);

  let typoPath, paddingLeft, paddingRight, iconStyles;
  if (iconRight || actionList?.length) {
    paddingRight =
      (height - UuGds.getSizes("spot", "basic", MenuListContentComponents.MenuItemBody.ACTION_GROUP_SIZE).height) / 2;
  }
  if (heading === "cascade") {
    typoPath = ["title", "micro"];
    paddingLeft = UuGds.SpacingPalette.getValue(["relative", icon || children == null ? "a" : "d"], { height });
    paddingRight ??= UuGds.SpacingPalette.getValue(["relative", iconRight || children == null ? "a" : "d"], { height });
  } else {
    if (heading) {
      typoPath = ["highlight", "minor"];
    } else {
      typoPath = ["interactive", textType];
    }

    if ((icon || iconRight) && children == null) {
      iconStyles = {
        width: height,
        height: height,
        justifyContent: "center",
      };
    } else {
      paddingLeft = UuGds.SpacingPalette.getValue(["relative", icon || children == null ? "c" : "d"], { height });
      paddingRight ??= UuGds.SpacingPalette.getValue(["relative", children == null ? "c" : "d"], { height });
    }
  }

  const interactive = UuGds.getValue(["Typography", "interface", ...typoPath]);

  return {
    minHeight: height,
    borderRadius: radius,
    paddingLeft,
    paddingRight,
    paddingBlock: UuGds.SpacingPalette.getValue(["fixed", "b"]),
    ...interactive,
    ...iconStyles,
  };
}

const DEFAULT_STYLES = {
  display: "flex",
  alignItems: "center",
  outline: "none",
  textDecoration: "none!important",
  wordBreak: "break-word",
};

const DISABLED_STYLES = {
  "&&": { pointerEvents: "all" },
};

const CONTAINER_SIZE_MAP_MOBILE = Tools.CONTAINER_SIZE_MAP_MOBILE;
const TEXT_TYPE_MAP_MOBILE = Tools.TEXT_TYPE_MAP_MOBILE;
const TEXT_TYPE_MAP = Tools.TEXT_TYPE_MAP;

const _MenuItem = withTooltip(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "_MenuItem",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      icon: PropTypes.icon,
      iconNotification: PropTypes.bool,
      iconRight: PropTypes.oneOfType([PropTypes.bool, PropTypes.icon]),
      onClick: PropTypes.func,
      onLabelClick: PropTypes.func,
      size: PropTypes.oneOf(Object.keys(TEXT_TYPE_MAP)),
      borderRadius: PropTypes.borderRadius,
      colorScheme: PropTypes.colorScheme,
      significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
      hoverable: PropTypes.bool,
      focused: PropTypes.bool,
      heading: PropTypes.oneOf([true, false, "cascade"]),
      actionList: PropTypes.array, // itemList from ActionGroup cannot be inserted due to circular dependency
      role: PropTypes.string,
      contentRight: PropTypes.node,
      iconAnimation: Icon.propTypes.animation,
      iconRightAnimation: Icon.propTypes.animation,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      icon: undefined,
      iconNotification: false,
      iconRight: undefined,
      onClick: undefined,
      onLabelClick: undefined,
      size: "m",
      borderRadius: "moderate",

      colorScheme: "building",
      significance: "common",

      hoverable: false,
      focused: false,
      heading: false,
      actionList: undefined,
      role: "menuitem",
      contentRight: undefined,
      iconAnimation: undefined,
      iconRightAnimation: undefined,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      let { onClick, onLabelClick, href, target, role, ...otherProps } = props;
      const { size, disabled } = props;

      const { isMobileOrTablet } = useDevice();
      const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
      const textType = (isMobileOrTablet && TEXT_TYPE_MAP_MOBILE[size]) || TEXT_TYPE_MAP[size];

      const background = useBackground(props.background); // TODO Next major - remove props.background.
      const [shapeStyles, gdsBackground] = getShapeStyles({
        ...props,
        background,
        onClick: !disabled && (onLabelClick || onClick || href),
        isMobileOrTablet,
      });
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      const buttonStyles = getItemStyles({ ...props, containerSize, textType });

      // const styles = iconRight ? { paddingRight: 32 } : null;
      const disabledClassName = disabled ? DISABLED_STYLES : undefined;
      const linkClassNames = [DEFAULT_STYLES, buttonStyles, shapeStyles, disabledClassName]
        .filter(Boolean)
        .map((style) => Config.Css.css(style));

      const { elementProps } = Utils.VisualComponent.splitProps(otherProps, linkClassNames.join(" "));

      // a dropdown is inserted into the menuItem, due to the circular dependency content of component is in a different file
      return (
        <BackgroundProvider background={gdsBackground ?? background}>
          <Link
            {...elementProps}
            {...(!disabled && {
              href,
              target,
              onClick: Tools.combineListeners(onLabelClick, onClick),
            })}
            colorScheme={null}
            elementAttrs={{
              tabIndex: elementProps.elementAttrs?.tabIndex ?? (href ? undefined : 0),
              ...elementProps.elementAttrs,
              role,
              onKeyDown: (e) => {
                if (disabled) return;
                if (typeof elementProps.elementAttrs?.onKeyDown === "function") {
                  elementProps.elementAttrs.onKeyDown(e);
                }
                if (!e.isDefaultPrevented()) {
                  const keyWithModifiers = Tools.getKeyWithModifiers(e);
                  switch (keyWithModifiers) {
                    case "Enter":
                    case "NumpadEnter":
                    case " ":
                      if (typeof onLabelClick === "function") {
                        e.preventDefault();
                        onLabelClick(e);
                      }
                      if (typeof onClick === "function") {
                        e.preventDefault();
                        onClick(e);
                      }
                      break;
                  }
                }
              },
            }}
          >
            <MenuListContentComponents.MenuItemBody {...otherProps} />
          </Link>
        </BackgroundProvider>
      );
      //@@viewOff:render
    },
  }),
);

export { _MenuItem, CONTAINER_SIZE_MAP_MOBILE };
export default _MenuItem;
