//@@viewOn:imports
import { createVisualComponent, useState } from "uu5g05";
import Config from "../config/config.js";
import ActionGroup from "../action-group.js";
import Icon from "../icon.js";
import { TEXT_TYPE_MAP as BUTTON_TEXT_TYPE_MAP, getButtonPaddingStyle } from "../button.js";
import Text from "../text.js";
import MenuItem from "../menu-item.js";
import IconWithNotification from "../_internal/icon-with-notification.js";
import UuGds from "../_internal/gds.js";
//@@viewOff:imports

const ICON_RIGHT = "uugds-chevron-right";
const ACTION_GROUP_SIZE = "xs";

const Css = {
  contentRight: ({ actionList }) => {
    let styles = { marginLeft: "auto", paddingLeft: UuGds.SpacingPalette.getValue(["fixed", "c"]) };
    if (actionList) {
      styles = {
        marginRight: UuGds.getValue(["SpacingPalette", "inline", "e"]),
        marginLeft: UuGds.SpacingPalette.getValue(["fixed", "c"]),
      };
    }
    return Config.Css.css(styles);
  },
  iconRight: ({ actionList, size, borderRadius }, inWrapper) => {
    const { height } = UuGds.getSizes("spot", "basic", size, borderRadius);
    let stylesIconRight;
    if (actionList) {
      stylesIconRight = {
        marginRight: UuGds.getValue(["SpacingPalette", "inline", "e"]),
        marginLeft: UuGds.getValue(["SpacingPalette", "inline", "e"]),
      };
    } else {
      stylesIconRight = {
        marginLeft: inWrapper ? undefined : "auto",
        paddingLeft: UuGds.getValue(["SpacingPalette", "relative", "a"]) * height,
        // make icon on the right be same size as it is when it's collapsible item and the `collapse icon` is as ActionGroup's button
        fontSize: UuGds.SizingPalette.getValue(["inline", "emphasized"]),
        // ...interactive[buttonTextType],
        // paddingRight: getButtonPaddingStyle({ size: ACTION_GROUP_SIZE, borderRadius, icon: "empty" }).paddingRight,
      };
      // if (typeof stylesIconRight.fontSize === "number") {
      //   stylesIconRight.fontSize *= parseFloat(BUTTON_ICON_FONT_SIZE);
      // } else {
      //   stylesIconRight.fontSize = `calc(${stylesIconRight.fontSize} * ${parseFloat(BUTTON_ICON_FONT_SIZE)})`;
      // }
    }

    return Config.Css.css(stylesIconRight);
  },
  iconRightWrapper: ({ borderRadius, contentRight }) => {
    const buttonTextType = BUTTON_TEXT_TYPE_MAP[ACTION_GROUP_SIZE];
    const interactive = UuGds.getValue(["Typography", "interface", "interactive"]);
    return Config.Css.css({
      ...interactive[buttonTextType],
      marginLeft: contentRight ? undefined : "auto",
      paddingRight: getButtonPaddingStyle({ size: ACTION_GROUP_SIZE, borderRadius, icon: "empty" }).paddingRight,
    });
  },
  icon: ({ children }) =>
    Config.Css.css({
      fontSize: "1.5em",
      marginRight: children != null ? UuGds.getValue(["SpacingPalette", "inline", "e"]) : undefined,
    }),
  actionGroup: ({ maxWidth }) => {
    return Config.Css.css({
      maxWidth,
      flexGrow: 10000,
      marginLeft: "auto",
    });
  },
};

const MenuItemBody = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MenuItemBody",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...MenuItem.propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...MenuItem.defaultProps,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      icon,
      iconRight,
      children,
      actionList,
      heading,
      colorScheme,
      onIconClick,
      iconNotification,
      contentRight,
      iconAnimation,
      iconRightAnimation,
    } = props;
    if (iconRight === true) iconRight = ICON_RIGHT;

    const [actionGroupMeasure, setActionGroupMeasure] = useState({});
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let IconComponent, iconProps;
    const styles = {
      marginRight: children != null ? UuGds.getValue(["SpacingPalette", "inline", "e"]) : undefined,
    };
    if (heading === "cascade" || onIconClick) {
      IconComponent = Icon;
      iconProps = {
        onClick: onIconClick,
        colorScheme: "building",
        significance: "subdued",
        className: Config.Css.css({
          fontSize: UuGds.SizingPalette.getValue(["inline", "emphasized"]),
          height: "100%",
          display: "inline-flex",
          alignItems: "center",
          paddingInline: "0.4em",
          marginLeft: "-0.4em",
        }),
      };
    } else {
      IconComponent = iconNotification ? IconWithNotification : Icon;
      styles.fontSize = UuGds.SizingPalette.getValue(["inline", "emphasized"]);
    }

    if (heading && children != null) {
      children = (
        <Text colorScheme="building" significance="subdued">
          {children}
        </Text>
      );
    }

    function renderIconRight() {
      let inWrapper = !actionList;
      let result = (
        <Icon
          icon={iconRight}
          animation={iconRightAnimation}
          colorScheme={colorScheme}
          significance={colorScheme === "building" ? "subdued" : undefined}
          className={Css.iconRight(props, inWrapper)}
          testId="icon-right"
          // we need to hide this icon e.g. when using collapsible menu item with collapsibleIconVisibility="onHover" (and the icon is not hovered),
          // and we need to be able to target it in CSS selector of whole menu-item (its root element) for that
          elementAttrs={{ "data-uu5-icon-right": "" }}
        />
      );
      if (inWrapper) {
        result = <span className={Css.iconRightWrapper(props)}>{result}</span>;
      }
      return result;
    }

    return (
      <>
        {icon && (
          <IconComponent
            icon={icon}
            animation={iconAnimation}
            colorScheme={colorScheme}
            significance={colorScheme === "building" ? "subdued" : undefined}
            className={Config.Css.css(styles)}
            {...iconProps}
            testId="icon"
          />
        )}
        {children}
        {contentRight && <div className={Css.contentRight(props)}>{contentRight}</div>}
        {iconRight && renderIconRight()}
        {actionList && (
          <ActionGroup
            itemList={actionList}
            // stop propagation if it originated on children of ActionGroup (not its root element)
            elementAttrs={{ onClick: (e) => e.target !== e.currentTarget && e.stopPropagation() }}
            size={ACTION_GROUP_SIZE}
            className={Css.actionGroup(actionGroupMeasure)}
            onMeasure={(e) => setActionGroupMeasure(e.data)}
          />
        )}
      </>
    );
    //@@viewOff:render
  },
});

MenuItemBody.ICON_RIGHT = ICON_RIGHT;
MenuItemBody.ACTION_GROUP_SIZE = ACTION_GROUP_SIZE;

export { MenuItemBody };
export default MenuItemBody;
