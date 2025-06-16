//@@viewOn:imports
import { Utils } from "uu5g05";
//@@viewOff:imports

// TODO move to MenuList
function unselectItem(selectedItemList, item) {
  return selectedItemList.filter((selectedItem) => selectedItem.value !== item.value);
}

function selectItem(selectedItemList, item, multiple) {
  if (multiple) {
    if (isItemSelected(selectedItemList, item)) {
      return selectedItemList;
    } else {
      return [...selectedItemList, item];
    }
  } else {
    return [item];
  }
}

function toggleItem(selectedItemList, item, multiple) {
  if (isItemSelected(selectedItemList, item)) {
    return unselectItem(selectedItemList, item);
  } else {
    return selectItem(selectedItemList, item, multiple);
  }
}

function isItemSelected(selectedItemList, item) {
  return selectedItemList.some((selectedItem) => selectedItem.value === item.value);
}

function getInitialItemIndex(itemList, reverseSelectionOrder) {
  if (reverseSelectionOrder) return itemList.length + 1;
  else return -1;
}

function handleShiftKey(selectedItemList, focusedItem, newFocusedItem, multiple) {
  let newSelectedItemList = selectedItemList;

  if (!isItemSelected(selectedItemList, newFocusedItem)) {
    if (!isItemSelected(selectedItemList, focusedItem)) {
      newSelectedItemList = selectItem(newSelectedItemList, focusedItem, multiple);
    }
    newSelectedItemList = toggleItem(newSelectedItemList, newFocusedItem, multiple);
  } else {
    newSelectedItemList = toggleItem(newSelectedItemList, focusedItem, multiple);
  }

  return newSelectedItemList;
}

function useSelectKeyboardHandling(
  displayedItemList,
  selectedItemList,
  focusedItemValue,
  focusedItemChildren,
  onChangeFocus,
  onChangeSelection,
  options = {},
) {
  displayedItemList = displayedItemList || [];
  selectedItemList = selectedItemList || [];
  const { multiple, required, shouldHandleKey, reverseSelectionOrder, openPicker } = options;

  function handleKeyDown(e) {
    if (e.defaultPrevented || (typeof shouldHandleKey === "function" && !shouldHandleKey(e))) {
      return;
    }

    let focusedItem =
      focusedItemValue !== undefined || (focusedItemValue === undefined && focusedItemChildren !== undefined)
        ? displayedItemList.find((item) => item.value === focusedItemValue)
        : undefined;
    let focusedItemIndex = focusedItem ? displayedItemList.findIndex((item) => item.value === focusedItem.value) : -1;
    if (focusedItemIndex === -1) focusedItemIndex = getInitialItemIndex(displayedItemList, reverseSelectionOrder);

    switch (e.key) {
      case "Backspace":
      case "Delete":
        if (focusedItem) {
          e.preventDefault();
          onChangeSelection(new Utils.Event({ value: unselectItem(selectedItemList, focusedItem) }, e));
          onChangeFocus(new Utils.Event({ value: undefined }, e));
        }
        break;
      case "Escape":
        openPicker(false);
        break;
      case "Tab":
        openPicker(false); // close the picker and move focus to the next element/component
        break;
      case "Enter":
      case "NumpadEnter":
      case " ": // space
        if (focusedItem) {
          e.preventDefault();
          if (focusedItem.category) return;
          if (required && !multiple && isItemSelected(selectedItemList, focusedItem)) {
            onChangeSelection(new Utils.Event({ value: selectItem(selectedItemList, focusedItem) }, e));
          } else {
            onChangeSelection(new Utils.Event({ value: toggleItem(selectedItemList, focusedItem, multiple) }, e));
          }
        }
        break;
      case "End":
        e.preventDefault();
        if (e.shiftKey && e.ctrlKey) {
          let startIndex = focusedItemIndex;
          let endIndex = displayedItemList.length;
          let newSelectedItemList = displayedItemList
            .slice(startIndex, endIndex)
            .filter((item) => !item.disabled && !item.heading);
          onChangeSelection(new Utils.Event({ value: newSelectedItemList }, e));
        }
        onChangeFocus(new Utils.Event({ value: displayedItemList[displayedItemList.length - 1] }, e));
        break;
      case "Home":
        e.preventDefault();
        if (e.shiftKey && e.ctrlKey) {
          let startIndex = 0;
          let endIndex = focusedItemIndex + 1;
          let newSelectedItemList = displayedItemList
            .slice(startIndex, endIndex)
            .filter((item) => !item.disabled && !item.heading);
          onChangeSelection(new Utils.Event({ value: newSelectedItemList }, e));
        }
        onChangeFocus(new Utils.Event({ value: displayedItemList[0] }, e));
        break;
      case "ArrowLeft":
        if (multiple) {
          e.preventDefault();
          let index = Math.max(Math.min(focusedItemIndex - 1, displayedItemList.length - 1), 0);
          onChangeFocus(new Utils.Event({ value: displayedItemList[index] }, e));
        }
        break;
      case "ArrowUp": {
        e.preventDefault();
        let newFocusedItemIndex = Math.max(Math.min(focusedItemIndex - 1, displayedItemList.length - 1), 0);

        let newFocusedItem = displayedItemList[newFocusedItemIndex];
        if (newFocusedItem && (newFocusedItem.disabled || newFocusedItem.heading)) {
          newFocusedItemIndex = Math.max(Math.min(focusedItemIndex - 2, displayedItemList.length - 1), 0);
        }

        if (multiple && e.shiftKey && focusedItemIndex !== 0) {
          let newSelectedItemList = handleShiftKey(
            selectedItemList,
            displayedItemList[focusedItemIndex],
            displayedItemList[newFocusedItemIndex],
            multiple,
          );
          onChangeSelection(new Utils.Event({ value: newSelectedItemList }, e));
        }
        onChangeFocus(new Utils.Event({ value: displayedItemList[newFocusedItemIndex] }, e));
        break;
      }
      case "ArrowRight": {
        if (multiple) {
          e.preventDefault();
          let index = Math.max(Math.min(focusedItemIndex + 1, displayedItemList.length - 1), 0);
          onChangeFocus(new Utils.Event({ value: displayedItemList[index] }, e));
        }
        break;
      }
      case "ArrowDown": {
        e.preventDefault();
        let newFocusedItemIndex = Math.max(Math.min(focusedItemIndex + 1, displayedItemList.length - 1), 0);

        let newFocusedItem = displayedItemList[newFocusedItemIndex];
        if (newFocusedItem && (newFocusedItem.disabled || newFocusedItem.heading)) {
          newFocusedItemIndex = Math.max(Math.min(focusedItemIndex + 2, displayedItemList.length - 1), 0);
        }

        if (multiple && e.shiftKey && focusedItemIndex !== displayedItemList.length - 1) {
          let newSelectedItemList = handleShiftKey(
            selectedItemList,
            displayedItemList[focusedItemIndex],
            displayedItemList[newFocusedItemIndex],
            multiple,
          );
          onChangeSelection(new Utils.Event({ value: newSelectedItemList }, e));
        }
        onChangeFocus(new Utils.Event({ value: displayedItemList[newFocusedItemIndex] }, e));
        break;
      }
      case "a":
        if (multiple && e.ctrlKey) {
          e.preventDefault();
          let newSelectedItemList = [...selectedItemList, ...displayedItemList].filter(
            (item) => !item.disabled && !item.heading,
          );
          onChangeSelection(new Utils.Event({ value: newSelectedItemList }, e));
        }
        break;
    }
  }

  return handleKeyDown;
}

export { useSelectKeyboardHandling };
export default useSelectKeyboardHandling;
