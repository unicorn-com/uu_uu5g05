import { useEffect, useRef } from "./react-hooks.js";

// call effect on updates (not on mount)
function useUpdateEffect(fn, deps) {
  let mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return fn();
    mountedRef.current = true;
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, deps);
}

export { useUpdateEffect };
export default useUpdateEffect;
