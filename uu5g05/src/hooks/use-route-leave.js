import { useCallback, useState, useEffect } from "./react-hooks.js";
import { useRouteLeaveContext } from "../contexts/route-leave-context.js";
import UtilsString from "../utils/string.js";

function useRouteLeave({ initialPrevented = true } = {}) {
  let { id: ctxId, nextRoute, prevent: ctxPrevent, allow: ctxAllow, refuse: ctxRefuse } = useRouteLeaveContext();
  let [id] = useState(() => UtilsString.generateId());

  let prevent = useCallback(() => ctxPrevent?.(id), [id, ctxPrevent]);
  let allow = useCallback(() => ctxAllow?.(id), [id, ctxAllow]);
  let refuse = useCallback(() => ctxRefuse?.(id), [id, ctxRefuse]);

  useEffect(() => {
    if (initialPrevented) prevent();
    return () => allow();
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, []);

  let result = { prevent, allow };
  if (ctxId === id && nextRoute) {
    Object.assign(result, { nextRoute, refuse });
  }
  return result;
}

export { useRouteLeave };
export default useRouteLeave;
