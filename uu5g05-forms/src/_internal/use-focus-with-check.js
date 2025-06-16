import useFocus from "./use-focus.js";

function useFocusWithCheck(params) {
  let [isFocused, handleFocus, handleBlur] = useFocus(params);

  function usedHandleFocus(e) {
    if (!isFocused) handleFocus(e);
  }

  function usedHandleBlur(e) {
    if (isFocused) handleBlur(e);
  }

  return [isFocused, usedHandleFocus, usedHandleBlur];
}

export default useFocusWithCheck;
