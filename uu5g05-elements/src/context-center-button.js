//@@viewOn:imports
import { createVisualComponent, useRef, Utils, useState, PropTypes } from "uu5g05";

import Config from "./config/config";
import Button from "./button";
import MenuItem from "./menu-item";
import ContextCenterView from "./_context-center/context-center-view";
//@@viewOff:imports

const MAX_ITEM_LIST_LENGTH = 2;

const ContextCenterButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ContextCenterButton",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: ContextCenterView.propTypes.itemList,
    displayType: PropTypes.oneOf(["button", "button-compact", "menu-item"]),
    ...Button.propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: ContextCenterView.defaultProps.itemList,
    colorScheme: "dim",
    significance: "subdued",
    icon: Config.INFO_ICON,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, info, elementRef, displayType, children, ...otherProps } = props;

    const [contextCenterSettings, setContextCenterSettings] = useState(null);
    const buttonRef = useRef();

    function handleClick() {
      setContextCenterSettings({ element: buttonRef.current });
    }

    function handleContextCenterClose() {
      setContextCenterSettings(null);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const compProps = {
      ...otherProps,
      elementRef: Utils.Component.combineRefs(elementRef, buttonRef),
      onClick: handleClick,
    };

    let Component = Button;
    if (displayType === "menu-item") {
      Component = MenuItem;
      compProps.colorScheme = "building";
      compProps.significance = "common";
      compProps.children = children;
      compProps.focused = !!contextCenterSettings;
    } else {
      compProps.pressed = !!contextCenterSettings;
    }

    return (
      <>
        <Component {...compProps} />
        {contextCenterSettings && (
          <ContextCenterView
            {...contextCenterSettings}
            onClose={handleContextCenterClose}
            itemList={getItemList(info)}
            preferredPosition="bottom-left"
            displayArrow
          />
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function getItemList(info) {
  if (Array.isArray(info)) {
    return info.slice(0, MAX_ITEM_LIST_LENGTH);
  }

  return [{ children: info }];
}
//@@viewOff:helpers

export { ContextCenterButton };
export default ContextCenterButton;
