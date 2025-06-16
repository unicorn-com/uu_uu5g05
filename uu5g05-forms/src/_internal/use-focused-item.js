import { useRef, useState } from "uu5g05";

function useFocusedItem({ onChange, onFocus, onBlur, itemList, readOnly, disabled, elementAttrs }) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // handle key presses
  function handleKeyDown(e) {
    if (typeof elementAttrs?.onKeyDown === "function") elementAttrs.onKeyDown(e);

    if (!e.isDefaultPrevented?.()) {
      switch (e.key) {
        case " ":
        case "Enter":
        case "NumpadEnter":
          if (!readOnly) {
            onChange(itemList[focusedIndex])(e);
          }
          e.stopPropagation();
          e.preventDefault();
          break;

        case "ArrowUp":
        case "ArrowLeft":
          setFocusedIndex(focusedIndex - 1 < 0 ? itemList.length - 1 : focusedIndex - 1);
          e.stopPropagation();
          e.preventDefault();
          break;

        case "ArrowDown":
        case "ArrowRight":
          setFocusedIndex(focusedIndex + 1 > itemList.length - 1 ? 0 : focusedIndex + 1);
          e.stopPropagation();
          e.preventDefault();
          break;
      }
    }
  }

  const focusRef = useRef(false);

  const attrs = disabled
    ? null
    : {
        onFocus: (e) => {
          if (!focusRef.current) {
            focusRef.current = true;
            if (focusedIndex === -1 && !e.isDefaultPrevented?.()) {
              setFocusedIndex(0);
            }
            typeof onFocus === "function" && onFocus(e);
          }
        },
        onBlur: (e) => {
          if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
            focusRef.current = false;
            setFocusedIndex(-1);
            typeof onBlur === "function" && onBlur(e);
          }
        },
        onKeyDown: handleKeyDown,
      };

  return [focusedIndex, setFocusedIndex, attrs];
}

export default useFocusedItem;
