import { useState } from "uu5g05";

function useItemFocus(itemList) {
  let [focusedItemValue, setFocusedItemValue] = useState();
  let [focusedItemChildren, setFocusedItemChildren] = useState();
  let focusedItemIndex =
    focusedItemValue !== undefined || (focusedItemValue === undefined && focusedItemChildren !== undefined)
      ? itemList.findIndex((item) => item.value === focusedItemValue)
      : -1;

  // Prevent focused index from being higher than items' length
  if (focusedItemIndex > -1 && !itemList.length) {
    focusedItemIndex = -1;
    focusedItemValue = undefined;
    focusedItemChildren = undefined;
    setFocusedItemValue(focusedItemValue);
    setFocusedItemChildren(focusedItemChildren);
  } else if (focusedItemIndex > itemList.length - 1) {
    focusedItemIndex = itemList.length - 1;
    focusedItemValue = itemList[focusedItemIndex]?.value;
    focusedItemChildren = itemList[focusedItemIndex]?.children;
    setFocusedItemValue(focusedItemValue);
    setFocusedItemChildren(focusedItemChildren);
  } else if (focusedItemValue && focusedItemIndex === -1 && itemList.length) {
    focusedItemIndex = 0;
    focusedItemValue = itemList[focusedItemIndex]?.value;
    focusedItemChildren = itemList[focusedItemIndex]?.children;
    setFocusedItemValue(focusedItemValue);
    setFocusedItemChildren(focusedItemChildren);
  }

  // Cancel focus if focused item is disabled or heading
  if (focusedItemIndex > -1 && (itemList[focusedItemIndex].disabled || itemList[focusedItemIndex].heading)) {
    focusedItemIndex = -1;
    focusedItemValue = undefined;
    focusedItemChildren = undefined;
    setFocusedItemValue(focusedItemValue);
    setFocusedItemChildren(focusedItemChildren);
  }

  return { focusedItemValue, setFocusedItemValue, focusedItemIndex, focusedItemChildren, setFocusedItemChildren };
}

export { useItemFocus };
export default useItemFocus;
