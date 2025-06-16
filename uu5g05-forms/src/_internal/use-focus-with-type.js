import useFocus from "./use-focus.js";

function useFocusWithType({ type, onFocus, onBlur, ...params }) {
  let [focus, handleF, handleB] = useFocus(params);

  function handleFocus(e) {
    handleF(e);
    if (!focus && typeof onFocus === "function") onFocus(e);
  }
  function handleBlur(e) {
    handleB(e);
    if (focus && typeof onBlur === "function") onBlur(e);
  }

  return [focus, handleFocus, handleBlur];
}

export default useFocusWithType;
