import { useEffect, useState } from "./react-hooks.js";
import UtilsString from "../utils/string.js";
import usePreviousValue from "./use-previous-value";

function getDiff(object1, object2) {
  const restObject1 = { ...object1 };
  const diff = Object.entries(object2).reduce((res, [k, v]) => {
    if (object1[k] !== v) {
      res[k] = { previous: object1[k], current: v };
    }
    delete restObject1[k];
    return res;
  }, {});

  for (let k in restObject1) diff[k] = { previous: restObject1[k], current: undefined };

  return diff;
}

function useTraceUpdate(name, props) {
  if (process.env.NODE_ENV !== "production") {
    const [id] = useState(() => UtilsString.generateId(8));
    if (!props && typeof name === "object") {
      props = name;
      name = id;
    }

    function log(eventName, ...args) {
      console.log(`[useTraceUpdate] ${name} - ${eventName}`, ...args);
    }

    const prevProps = usePreviousValue(props, props);

    useEffect(() => {
      const changedProps = getDiff(prevProps, props);

      if (Object.keys(changedProps).length > 0) {
        log("effect", { previousProps: prevProps, currentProps: props });
        log("effect - changed props:");
        console.table(changedProps);
      }
    });

    useEffect(() => {
      log("mount", props);
      return () => {
        log("unmount", props);
      };
    }, []);
  }
}

export { useTraceUpdate };
export default useTraceUpdate;
