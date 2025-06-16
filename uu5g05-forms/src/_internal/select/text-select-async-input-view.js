//@@viewOn:imports
import { createComponent, useEffect, useMemo, useState } from "uu5g05";
import Config from "../../config/config.js";
import TextSelectContext from "./text-select-context.js";
import TextSelectFieldView from "./text-select-field-view.js";
import useSelect from "./use-select.js";
import { useDependencyValue } from "./use-dependency-value.js";
import { sortByArray } from "./tools.js";
import SearchPlaceholder from "./search-placeholder.js";
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
function sortItemList(itemList, value) {
  const itemListWithoutValue = [];
  const itemListWithValue = [];

  itemList.forEach((item) => {
    if (item.value) {
      itemListWithValue.push(item);
      return;
    }
    itemListWithoutValue.push(item);
  });

  const sortedArray = sortByArray(itemListWithValue, value);

  return [...itemListWithoutValue, ...sortedArray];
}
//@@viewOff:helpers

const TextSelectAsyncInputView = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TextSelectAsyncInputView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: textSelectFieldViewPropTypes,
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: textSelectFieldViewDefaultProps,
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      children,
      itemList: itemListProp,
      optionList,
      searchPlaceholder,
      bottomSheetPlaceholder,
      internalPending,
      ...otherProps
    } = props;
    const { open, value, disableOptionReorder: propsDisableOptionReorder, isBottomSheet } = otherProps;
    const disableOptionReorder =
      typeof propsDisableOptionReorder === "boolean" ? propsDisableOptionReorder : itemListProp?.length < 9;

    const [internalFocus, setInternalFocus] = useState(false);

    const deps = useMemo(() => ({ open, itemListLength: itemListProp.length }), [open, itemListProp.length]);
    const dependencyValue = useDependencyValue(value, disableOptionReorder ? {} : deps);

    const sortedItemList = sortItemList(itemListProp, dependencyValue);

    // Focus is necessary handle here to maintain connection between input and options.
    const {
      picker: { itemList, focus: itemFocus },
      selected: { itemList: selectedItemList, focus: selectedItemFocus },
    } = useSelect([...sortedItemList, ...(Array.isArray(optionList) ? optionList : [])], value, open, internalFocus);

    useEffect(() => {
      const firstItem = itemList[0];
      if (firstItem) itemFocus.setByValue(firstItem);
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [deps]);

    function handleItemMouseDown(e) {
      itemFocus.setByValue(e.data.value?.value);
      itemFocus.setByChildren(e.data.value?.children);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const textSelectProps = {
      ...otherProps,
      itemList: itemList.map((item) => ({ ...item, onMouseDown: handleItemMouseDown })),
      itemFocus,
      selectedItemList,
      selectedItemFocus,
      onInternalFocus: (e) => setInternalFocus(e.data.value),
    };

    if (isBottomSheet) {
      textSelectProps.internalPending = internalPending;
      textSelectProps.searchPlaceholder = searchPlaceholder;
      if (bottomSheetPlaceholder) {
        textSelectProps.itemList = [
          { disabled: true, children: <SearchPlaceholder lsi={bottomSheetPlaceholder} /> },
          ...textSelectProps.itemList,
        ];
      }
    } else {
      if (internalPending) textSelectProps.pending = internalPending;
      if (searchPlaceholder) {
        textSelectProps.itemList = [
          { disabled: true, children: <SearchPlaceholder lsi={searchPlaceholder} /> },
          ...textSelectProps.itemList,
        ];
      }
    }

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

export { TextSelectAsyncInputView };
export default TextSelectAsyncInputView;
