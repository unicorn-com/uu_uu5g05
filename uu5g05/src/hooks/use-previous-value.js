import { useRef, useEffect } from "./react-hooks.js";

export function usePreviousValue(curValue, initialValue = undefined) {
  let curValueRef = useRef(initialValue);
  useEffect(() => {
    curValueRef.current = curValue;
  }, [curValue]);
  return curValueRef.current;
}
export default usePreviousValue;
