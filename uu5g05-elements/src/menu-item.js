//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import _SubmenuItem from "./_menu-list/submenu-item.js";
import _MenuItem from "./_menu-list/menu-item.js";

//@@viewOff:imports
const MenuItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MenuItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ..._SubmenuItem.propTypes,
    ..._MenuItem.propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ..._SubmenuItem.defaultProps,
    ..._MenuItem.defaultProps,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, ...otherProps } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return Array.isArray(itemList) ? <_SubmenuItem {...props} /> : <_MenuItem {...otherProps} />;
    //@@viewOff:render
  },
});

export { MenuItem };
export default MenuItem;
