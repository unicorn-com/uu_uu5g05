//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice } from "uu5g05";
import Config from "./config/config.js";
import MenuListBody from "./_menu-list/menu-list-body.js";
import MenuListCompact from "./_menu-list/menu-list-compact.js";
//@@viewOff:imports

const MenuList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MenuList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...MenuListCompact.propTypes,
    compactSubmenu: PropTypes.bool,
    openSubmenuAction: PropTypes.oneOf(["click", "hover"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...MenuListCompact.defaultProps,
    compactSubmenu: undefined,
    openSubmenuAction: "hover",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { compactSubmenu, value, onChange, openSubmenuAction, ...otherProps } = props;

    const { isMobileOrTablet } = useDevice();
    compactSubmenu = typeof compactSubmenu === "boolean" ? compactSubmenu : isMobileOrTablet;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let Component;
    let compProps;

    if (compactSubmenu) {
      Component = MenuListCompact;
      compProps = { ...otherProps, value, onChange };
    } else {
      Component = MenuListBody;
      compProps = { ...otherProps, openSubmenuAction };
    }

    return <Component {...compProps} />;
    //@@viewOff:render
  },
});

export { MenuList };
export default MenuList;
