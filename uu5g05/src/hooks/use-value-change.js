import _useValueChange from "../_internal/use-value-change.js";

function useValueChange(value, onChange) {
  return _useValueChange(value, onChange, typeof onChange === "function");
}

export { useValueChange };
export default useValueChange;
