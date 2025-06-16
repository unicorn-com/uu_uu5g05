import { useState } from "uu5g05";

function useFocus({ onFocus, onBlur, disabled }) {
  let [focus, setFocus] = useState(false);
  if (disabled && focus) {
    setFocus(false);
    focus = false;
  }

  function handleFocus(e) {
    setFocus(true);
    typeof onFocus === "function" && onFocus(e);
  }

  function handleBlur(e) {
    setFocus(false);
    typeof onBlur === "function" && onBlur(e);
  }

  return [focus, handleFocus, handleBlur, setFocus];
}

export default useFocus;
