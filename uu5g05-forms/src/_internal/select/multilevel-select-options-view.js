//@@viewOn:imports
import { createVisualComponent, PropTypes, useRef, useState, useUpdateEffect, Utils } from "uu5g05";
import { MenuList } from "uu5g05-elements";
import Config from "../../config/config.js";
import { useScrollToFocusedItem } from "./use-scroll-to-focused-item.js";
import { getMenuItem, getOnMenuItemSelect, countHeight } from "./tools.js";
import { getMultilevelList } from "./multi-level-tools.js";
import NestedSelectOption from "./nested-select-option.js";
import MultilevelSelectOptionsViewItem from "./multilevel-select-options-view-item.js";
import SelectOptionViewItem from "./select-option-view-item.js";
import { getInputComponentColorScheme } from "../tools.js";
//@@viewOff:imports

//@@viewOn:constants
const SELECT_OPTION_VIEW_ITEM_ID = `category-${Utils.String.generateId(8)}`;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ height, displayCheckboxes }) => {
    return Config.Css.css({
      width: "100%",
      flex: 1,
      height,
      alignContent: "start",
      ...(displayCheckboxes && {
        "[role=option]": {
          padding: 0,
        },
        "[role=menuitem]": {
          [`#${SELECT_OPTION_VIEW_ITEM_ID}`]: {
            padding: 0,
            [`#checkbox-${SELECT_OPTION_VIEW_ITEM_ID}`]: {
              display: "none",
            },
          },
        },
      }),
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function compareValue(selectedValue, itemValue) {
  if (selectedValue.value === itemValue) return true;
  if (selectedValue.parent) return compareValue(selectedValue.parent, itemValue);
  return false;
}

function selectedValuesCount(selectedValues, itemValue, level) {
  let count = 0;

  const currLevel = level[level.length - 1];
  if (currLevel && itemValue === currLevel) return count;

  selectedValues.forEach((selectedValue) => {
    if (selectedValue?.parent && compareValue(selectedValue.parent, itemValue)) count++;
  });

  return count;
}

function getMultilevelMenuList(itemList, value, getOnItemSelect, itemsRef, { displayCheckboxes, size, colorScheme }) {
  const menuList = [];
  const settingsList = [];

  itemList.forEach(({ order, insertCandidate, ...item }) => {
    if (insertCandidate) {
      settingsList.push(item);
      return;
    }

    if (item.itemList) {
      item.itemList = getMultilevelMenuList(item.itemList, value, getOnItemSelect, itemsRef, {
        displayCheckboxes,
        size,
        colorScheme,
      });
    }

    const newItem = getMenuItem(
      { ...item, _hideIcon: displayCheckboxes },
      value,
      getOnItemSelect,
      (ref) => (itemsRef.current[order] = ref),
      colorScheme,
    );
    menuList.push(displayCheckboxes ? withCheckbox(newItem, { size, colorScheme }) : newItem);
  });

  if (settingsList.length) {
    if (menuList.length) return [...menuList, { divider: true }, ...settingsList];
    return [...menuList, ...settingsList];
  }

  return menuList;
}

function findMultipleInParent(parent) {
  if (!parent) return;
  if (parent.multiple === false) return true;
  if (parent.parent) return findMultipleInParent(parent.parent);
}

function withCheckbox({ parent, ...item }, opts) {
  return {
    ...item,
    children: (
      <SelectOptionViewItem
        {...opts}
        id={SELECT_OPTION_VIEW_ITEM_ID}
        selected={item.selected}
        readOnly={item.readOnly}
        disabled={item.disabled}
        borderRadius={item.borderRadius}
        hideCheckbox={!!(item.heading || item.itemList)}
        single={findMultipleInParent(parent)}
      >
        {item.children}
      </SelectOptionViewItem>
    ),
  };
}
//@@viewOff:helpers

const MultilevelSelectOptionsView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MultilevelSelectOptionsView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    maxHeight: MenuList.propTypes.maxHeight,
    height: PropTypes.unit,
    multiple: PropTypes.bool,
    itemList: PropTypes.array,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    searchValue: PropTypes.string,
    onSearch: PropTypes.func,
    level: MenuList.propTypes.value,
    onChangeLevel: MenuList.propTypes.onChange,
    displayCheckboxes: PropTypes.bool,
    colorScheme: PropTypes.colorScheme,
    onReposition: PropTypes.func,
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
    searchValue: undefined,
    onSearch: undefined,
    level: MenuList.defaultProps.value,
    onChangeLevel: MenuList.defaultProps.onChange,
    displayCheckboxes: false,
    colorScheme: "primary",
    onReposition: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      className,
      multiple,
      value,
      itemList: itemListProp,
      onChange,
      searchValue,
      onSearch,
      height: heightProp,
      maxHeight,
      level,
      onChangeLevel,
      displayCheckboxes: displayCheckboxesProp,
      colorScheme: colorSchemeProp,
      onReposition,
      ...otherProps
    } = props;

    useUpdateEffect(() => {
      if (typeof onReposition === "function") onReposition();
    }, [level]);

    const colorScheme = getInputComponentColorScheme(colorSchemeProp);

    const [menuKey, setMenuKey] = useState(() => Utils.String.generateId());
    const displayCheckboxes = multiple && displayCheckboxesProp;

    const itemList = itemListProp.map((item, index) => {
      return {
        ...item,
        originalChildren: item.children,
        children: (
          <MultilevelSelectOptionsViewItem
            itemsCount={selectedValuesCount(value, item.value, level)}
            colorScheme={colorScheme}
          >
            {item.root ? <NestedSelectOption path={item.parent}>{item.children}</NestedSelectOption> : item.children}
          </MultilevelSelectOptionsViewItem>
        ),
        order: index,
      };
    });

    const transformList = getMultilevelList(itemList);

    const initialItemListLength = useRef(transformList.length);
    const { refs: itemsRef } = useScrollToFocusedItem(itemListProp);

    const menuList = getMultilevelMenuList(transformList, value, getOnItemSelect, itemsRef, {
      displayCheckboxes,
      size: otherProps.size,
      colorScheme,
    });

    function getOnItemSelect(item) {
      if (item.itemList) return;

      return getOnMenuItemSelect(item, value, multiple, (e) => {
        onChange(e);
        if (searchValue) setMenuKey(Utils.String.generateId());
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
      key: menuKey,
      className: Utils.Css.joinClassName(className, Css.main({ height, displayCheckboxes })),
      itemList: menuList,
      itemBorderRadius: "elementary",
      role: "listbox",
      compactSubmenu: true,
      maxHeight: height ?? maxHeight,
      value: level,
      onChange: onChangeLevel,
      _onBackClick: onChangeLevel,
    };

    return <MenuList {...menuListProps} />;
    //@@viewOff:render
  },
});

export { MultilevelSelectOptionsView };
export default MultilevelSelectOptionsView;
