//@@viewOn:imports
import { createComponent, useMemo, useState, Utils } from "uu5g05";
import Config from "../../config/config.js";
import TextSelectContext from "./text-select-context.js";
import TextSelectFieldView from "./text-select-field-view.js";
import useSelect from "./use-select.js";
import { useDependencyValue } from "./use-dependency-value.js";
import { sortByArray } from "./tools.js";
import { getPath } from "./multi-level-tools.js";
//@@viewOff:imports

//@@viewOn:constants
const { itemFocus, selectedItemList, selectedItemFocus, onInternalFocus, ...textSelectFieldViewPropTypes } =
  TextSelectFieldView.propTypes;
const {
  itemFocus: _itemFocus,
  selectedItemList: _selectedItemList,
  selectedItemFocus: _selectedItemFocus,
  onInternalFocus: _onInternalFocus,
  ...textSelectFieldViewDefaultProps
} = TextSelectFieldView.defaultProps;
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

const TextSelectInputView = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TextSelectInputView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: textSelectFieldViewPropTypes,
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: textSelectFieldViewDefaultProps,
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, itemList: itemListProp, optionList, onSearch, ...otherProps } = props;
    const {
      open,
      onOpen,
      value,
      searchValue,
      multilevel,
      multiple,
      disableOptionReorder: propsDisableOptionReorder,
    } = otherProps;
    const disableOptionReorder =
      typeof propsDisableOptionReorder === "boolean" ? propsDisableOptionReorder : itemListProp?.length < 9;

    const [internalFocus, setInternalFocus] = useState(false);
    const [level, setLevel] = useState([]);

    // Sorting
    const deps = useMemo(() => {
      // Empty searchValue and undefined searchValue is same for sorting
      const _searchValue = searchValue === "" ? undefined : searchValue;
      return { open, searchValue: _searchValue, level };
    }, [open, searchValue, level]);
    const dependencyValue = useDependencyValue(disableOptionReorder ? [] : value, disableOptionReorder ? {} : deps);

    const sortedItemList = sortByArray(itemListProp, dependencyValue);

    // Focus is necessary handle here to maintain connection between input and options.
    const {
      picker: { itemList, focus: itemFocus },
      selected: { itemList: selectedItemList, focus: selectedItemFocus },
    } = useSelect([...sortedItemList, ...(Array.isArray(optionList) ? optionList : [])], value, open, internalFocus);

    function handleSearch(e) {
      if (level.length && (searchValue || e.data.value)) {
        // Clear level when onSearch is called
        setLevel((prevState) => {
          // If level is already empty, then do return prevState to prevent re-render
          if (Utils.Object.deepEqual(prevState, [])) return prevState;
          return [];
        });
      }
      // Call onSearch prop
      if (typeof onSearch === "function") onSearch(e);
    }

    function handleItemMouseDown(e) {
      itemFocus.setByValue(e.data.value?.value);
      itemFocus.setByChildren(e.data.value?.children);
    }

    function getItemFocus() {
      if (!multilevel) return itemFocus;

      return {
        ...itemFocus,
        setByValue: (e) => {
          const focusedItem = sortedItemList.find((item) => item.value === e);

          if (!level.length && !focusedItem?.parent) {
            itemFocus.setByValue(e);
            return;
          }
          if (level.length && focusedItem?.parent?.value === level[level.length - 1]) {
            itemFocus.setByValue(e);
          }
        },
      };
    }

    function handleChangeLevel(e) {
      setLevel((prevState) => {
        const currLevel = e.data.value;

        if (Utils.Object.deepEqual(prevState, currLevel)) return prevState;

        if (prevState.length > currLevel.length) {
          const prevLevel = prevState[prevState.length - 1];
          itemFocus.setByValue(prevLevel);
        } else {
          const nextLevel = currLevel[currLevel.length - 1];
          const focusedItem = sortedItemList.find((item) => item.parent?.value === nextLevel);
          itemFocus.setByValue(focusedItem?.value);
        }

        return e.data.value;
      });
    }

    function handleOpen(e) {
      onOpen(e);
      if (!multilevel) return;
      if (!e.data.value) return;

      let path = [];
      // For single selection there is always an array with one value, or it is empty
      if (!multiple && value[0]?.parent) path = getPath(value[0].parent);

      setLevel(path);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const textSelectProps = {
      ...otherProps,
      itemList: itemList.map((item) => ({ ...item, onMouseDown: handleItemMouseDown })),
      itemFocus: getItemFocus(),
      selectedItemList,
      selectedItemFocus,
      onInternalFocus: (e) => setInternalFocus(e.data.value),
      onChangeLevel: handleChangeLevel,
      level,
      onOpen: handleOpen,
      onSearch: handleSearch,
    };

    return children ? (
      <TextSelectContext.Provider value={textSelectProps}>
        {typeof children === "function" ? children(textSelectProps) : children}
      </TextSelectContext.Provider>
    ) : (
      <TextSelectFieldView {...textSelectProps} />
    );
    //@@viewOff:render
  },
});

export { TextSelectInputView };
export default TextSelectInputView;
