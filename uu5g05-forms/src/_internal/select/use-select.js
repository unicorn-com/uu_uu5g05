//@@viewOn:imports
import { useUpdateEffect, usePreviousValue } from "uu5g05";
import useItemFocus from "../use-item-focus";
import { getItemChildren } from "./tools";
//@@viewOff:imports

function getInitialSelectedItem(pickerItemList, selectedItemList) {
  let firstSelectedItem = pickerItemList.find(
    (item) =>
      (item.value !== undefined || item.children !== undefined) &&
      !item.disabled &&
      !item.heading &&
      selectedItemList.some((s) => {
        return s.value === item.value;
      }),
  );

  if (firstSelectedItem) return firstSelectedItem;

  return pickerItemList.find(
    (item) => (item.value !== undefined || item.children !== undefined) && !item.disabled && !item.heading,
  );
}

function getItemLists(itemList, value) {
  let selectedItemList = value.map((item) => {
    let { children, value: itemValue, size: _, ...restItemProps } = item;
    children = getItemChildren(item);
    return { ...restItemProps, value: itemValue, children };
  });

  let pickerItemList = itemList.map((item) => {
    let { children, value: itemValue, size: _, ...restItemProps } = item;
    children = getItemChildren(item);
    return { ...restItemProps, value: itemValue, children };
  });

  return { pickerItemList, selectedItemList };
}

function useSelect(itemList, value, isOpen, isFocused) {
  let { pickerItemList, selectedItemList } = getItemLists(itemList, value);

  const {
    focusedItemValue: focusedPickerItemValue,
    focusedItemIndex: focusedPickerItemIndex,
    setFocusedItemValue: setFocusedPickerItemValue,
    focusedItemChildren: focusedPickerItemChildren,
    setFocusedItemChildren: setFocusedPickerItemChildren,
  } = useItemFocus(pickerItemList);

  const {
    focusedItemValue: focusedSelectedItemValue,
    focusedItemIndex: focusedSelectedItemIndex,
    setFocusedItemValue: setFocusedSelectedItemValue,
    focusedItemChildren: focusedSelectedItemChildren,
    setFocusedItemChildren: setFocusedSelectedItemChildren,
  } = useItemFocus(selectedItemList, true);

  if (
    isFocused &&
    focusedPickerItemValue === undefined &&
    focusedPickerItemChildren === undefined &&
    focusedSelectedItemValue === undefined &&
    focusedSelectedItemChildren === undefined
  ) {
    let firstItemToSelect = getInitialSelectedItem(pickerItemList, selectedItemList);
    if (firstItemToSelect) {
      setFocusedPickerItemValue(firstItemToSelect.value);
      setFocusedPickerItemChildren(firstItemToSelect.children);
    }
  }

  pickerItemList =
    focusedPickerItemValue !== undefined || focusedPickerItemChildren !== undefined
      ? pickerItemList.map((item) => (item.value === focusedPickerItemValue ? { ...item, focused: true } : item))
      : pickerItemList;
  selectedItemList =
    focusedSelectedItemValue !== undefined || focusedSelectedItemChildren !== undefined
      ? selectedItemList.map((item) => (item.value === focusedSelectedItemValue ? { ...item, focused: true } : item))
      : selectedItemList;

  useUpdateEffect(() => {
    if (pickerItemList.length && isOpen) {
      setFocusedPickerItemValue(getInitialSelectedItem(pickerItemList, selectedItemList)?.value);
      setFocusedPickerItemChildren(getInitialSelectedItem(pickerItemList, selectedItemList)?.children);
    }
  }, [isOpen]);

  useUpdateEffect(() => {
    if (!isFocused) {
      setFocusedPickerItemValue();
      setFocusedPickerItemChildren();
      setFocusedSelectedItemValue();
      setFocusedSelectedItemChildren();
    }
  }, [isFocused]);

  const previousFocusedPickerItemValue = usePreviousValue(focusedPickerItemValue);
  const previousFocusedSelectedItemValue = usePreviousValue(focusedSelectedItemValue);
  useUpdateEffect(() => {
    // If both picker item and value item have a focus, we have to remove one of them
    if (
      (focusedPickerItemValue !== undefined || focusedPickerItemChildren !== undefined) &&
      (focusedSelectedItemValue !== undefined || focusedSelectedItemChildren === undefined)
    ) {
      if (previousFocusedPickerItemValue !== focusedPickerItemValue) {
        setFocusedSelectedItemValue(undefined);
        setFocusedSelectedItemChildren(undefined);
      } else if (previousFocusedSelectedItemValue !== focusedSelectedItemValue) {
        setFocusedPickerItemValue(undefined);
        setFocusedPickerItemChildren(undefined);
      }
    }
  }, [
    focusedPickerItemValue,
    focusedSelectedItemValue,
    previousFocusedPickerItemValue,
    previousFocusedSelectedItemValue,
    setFocusedPickerItemValue,
    setFocusedPickerItemChildren,
    setFocusedSelectedItemValue,
    setFocusedSelectedItemChildren,
  ]);

  return {
    picker: {
      itemList: pickerItemList,
      focus: {
        value: focusedPickerItemValue,
        children: focusedPickerItemChildren,
        index: focusedPickerItemIndex,
        setByValue: setFocusedPickerItemValue,
        setByChildren: setFocusedPickerItemChildren,
      },
    },
    selected: {
      itemList: selectedItemList,
      focus: {
        value: focusedSelectedItemValue,
        children: focusedSelectedItemChildren,
        index: focusedSelectedItemIndex,
        setByValue: setFocusedSelectedItemValue,
        setByChildren: setFocusedSelectedItemChildren,
      },
    },
  };
}

export { useSelect };
export default useSelect;
