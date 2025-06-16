import { Utils, useRef } from "uu5g05";

function useStableMemo(fn, deps) {
  let prevDepsRef = useRef();
  let resultRef = useRef();
  if (!Utils.Object.shallowEqual(deps, prevDepsRef.current)) {
    resultRef.current = fn();
  }
  prevDepsRef.current = deps;
  return resultRef.current;
}

export { useStableMemo };
export default useStableMemo;
