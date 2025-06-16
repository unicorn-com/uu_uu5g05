import { useLayoutEffect, useRef } from "./react-hooks.js";

// call effect on updates (not on mount)
function useUpdateLayoutEffect(fn, deps) {
  let mountedRef = useRef(false);
  useLayoutEffect(() => {
    if (mountedRef.current) return fn();
    mountedRef.current = true;
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, deps);
}

export { useUpdateLayoutEffect };
export default useUpdateLayoutEffect;
