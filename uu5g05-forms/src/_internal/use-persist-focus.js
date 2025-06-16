import { useState, useRef } from "uu5g05";

function usePersistFocus({ onFocus, onBlur, disabled }) {
  let [focus, setFocus] = useState(false);
  if (disabled && focus) {
    setFocus(false);
    focus = false;
  }

  const blurTimeoutRef = useRef(undefined);

  function handleBlur(e) {
    clearTimeout(blurTimeoutRef.current);
    e.persist();
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = undefined;
      if (typeof onBlur === "function") {
        onBlur(e);
      }
      if (!e.defaultPrevented) {
        setFocus(false);
      }
    }, 0);
  }

  function handleFocus(e) {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = undefined;
      return;
    }
    if (typeof onFocus === "function") {
      onFocus(e);
    }

    if (!e.defaultPrevented) {
      setFocus(true);
    }
  }

  return [focus, handleFocus, handleBlur, setFocus];
}

export default usePersistFocus;
