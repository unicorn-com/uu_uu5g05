import { useRef, useEffect } from "./react-hooks.js";

function useUnmountedRef(curValue, initialValue = undefined) {
  const unmountedRef = useRef(false);
  useEffect(() => () => (unmountedRef.current = true), []);
  return unmountedRef;
}

export { useUnmountedRef };
export default useUnmountedRef;
