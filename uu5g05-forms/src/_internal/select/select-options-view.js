//@@viewOn:imports
import { createVisualComponent, PropTypes, useRef, useViewportVisibility, Utils } from "uu5g05";
import { MenuList } from "uu5g05-elements";
import Config from "../../config/config.js";
import { useScrollToFocusedItem } from "./use-scroll-to-focused-item.js";
import { getMenuItem, getOnMenuItemSelect, countHeight } from "./tools.js";
import SelectOptionViewItem from "./select-option-view-item.js";
import { getInputComponentColorScheme } from "../tools.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ height, displayCheckboxes }) => {
    return Config.Css.css({
      width: "100%",
      height,
      flex: 1,
      alignContent: "start",
      position: "relative",
      zIndex: 20,
      ...(displayCheckboxes && {
        "[role=option]": {
          padding: 0,
        },
      }),
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getMenuList(itemList, value, getOnItemSelect, itemsRef, { displayCheckboxes, size, colorScheme }) {
  const menuList = [];
  const settingsList = [];

  itemList.forEach(({ insertCandidate, ...item }, index) => {
    if (insertCandidate) {
      settingsList.push(item);
      return;
    }
    const newItem = getMenuItem(item, value, getOnItemSelect, (ref) => (itemsRef.current[index] = ref), colorScheme);
    menuList.push(displayCheckboxes ? withCheckbox(newItem, { size, colorScheme }) : newItem);
  });

  if (settingsList.length) {
    if (menuList.length) return [...menuList, { divider: true }, ...settingsList];
    return [...menuList, ...settingsList];
  }

  return menuList;
}

function withCheckbox(item, opts) {
  return {
    ...item,
    children: (
      <SelectOptionViewItem
        {...opts}
        selected={item.selected}
        readOnly={item.readOnly}
        disabled={item.disabled}
        borderRadius={item.borderRadius}
        hideCheckbox={item.heading}
      >
        {item.children}
      </SelectOptionViewItem>
    ),
  };
}
//@@viewOff:helpers

const SelectOptionsView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SelectOptionsView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    maxHeight: MenuList.propTypes.maxHeight,
    height: PropTypes.unit,
    multiple: PropTypes.bool,
    itemList: PropTypes.array,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    onSearch: PropTypes.func,
    displayCheckboxes: PropTypes.bool,
    colorScheme: PropTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    maxHeight: MenuList.defaultProps.maxHeight,
    height: undefined,
    multiple: false,
    itemList: [],
    value: [],
    onChange: undefined,
    onSearch: undefined,
    displayCheckboxes: false,
    colorScheme: "primary",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      className,
      multiple,
      value,
      itemList,
      onChange,
      onSearch,
      height: heightProp,
      maxHeight,
      elementRef,
      displayCheckboxes: displayCheckboxesProp,
      colorScheme: colorSchemeProp,
      ...otherProps
    } = props;

    const colorScheme = getInputComponentColorScheme(colorSchemeProp);

    const initialItemListLength = useRef(itemList.length);
    const { visible, ref } = useViewportVisibility();
    const { refs: itemsRef } = useScrollToFocusedItem(itemList, visible);
    const displayCheckboxes = multiple && displayCheckboxesProp;

    let menuList = getMenuList(itemList, value, getOnItemSelect, itemsRef, {
      displayCheckboxes,
      size: otherProps.size,
      colorScheme,
    });

    function getOnItemSelect(item) {
      return getOnMenuItemSelect(item, value, multiple, (e) => {
        onChange(e);
        // Clear searchValue if it's possible
        if (typeof onSearch === "function") onSearch(new Utils.Event({ value: undefined }));
      });
    }

    function getHeight() {
      if (heightProp === null) return countHeight(initialItemListLength.current);

      return heightProp;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const height = getHeight();
    const menuListProps = {
      ...otherProps,
      className: Utils.Css.joinClassName(className, Css.main({ height, displayCheckboxes })),
      elementRef: Utils.Component.combineRefs(elementRef, ref),
      itemList: menuList,
      role: "listbox",
      compactSubmenu: false,
      maxHeight: height ?? maxHeight,
    };

    return <MenuList {...menuListProps} />;
    //@@viewOff:render
  },
});

export { SelectOptionsView };
export default SelectOptionsView;
