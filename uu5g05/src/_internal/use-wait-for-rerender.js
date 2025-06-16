import { useState, useEffect, useRef } from "../hooks/react-hooks.js";
import UtilsDom from "../utils/dom.js";
import useUnmountedRef from "../hooks/use-unmounted-ref.js";

/**
 * Waits for re-render and resolves afterwards. If the component gets unmounted at any time, the result gets
 * resolved immediately (it doesn't get stuck waiting for re-render that's never going to happen).
 *
 * @example
 * const waitForRerender = useWaitForRerender();
 * function handleClick() {
 *   await waitForRerender(() => {
 *     setState("pending");
 *   });
 *   // here the component has been already re-rendered (or is unmounted)
 *   ...
 * }
 */
function useWaitForRerender() {
  const promiseResolveListRef = useRef([]);
  const [state, setState] = useState(0);
  const unmountedRef = useUnmountedRef();

  function flush() {
    let list = promiseResolveListRef.current;
    promiseResolveListRef.current = [];
    Promise.resolve().then(() => list.forEach((resolve) => resolve()));
  }

  useEffect(() => {
    flush();
  }, [state]);

  useEffect(() => {
    return () => flush();
  }, []);

  const waitForRerender = useRef((callback) => {
    let resolve;
    let promise = new Promise((res, rej) => (resolve = res));
    promiseResolveListRef.current.push(resolve);
    if (!unmountedRef.current) {
      // Utils.Dom._batchedUpdates is for React < 18 (React 18 does auto-batching automatically)
      let _batchedUpdates = UtilsDom._batchedUpdates || ((fn) => fn());
      _batchedUpdates(() => {
        setState((v) => v + 1);
        callback?.();
      });
    } else {
      callback?.();
      flush();
    }
    return promise;
  }).current;
  return waitForRerender;
}

export { useWaitForRerender };
export default useWaitForRerender;
