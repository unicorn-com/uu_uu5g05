import { useRef } from "../hooks/react-hooks.js";
import UtilsObject from "../utils/object.js";

// compares "obj" with previous and if deeply equal then returns previous instance (to keep object references from changing)
function useMemoObject(obj, equals = UtilsObject.deepEqual) {
  let lastResultRef = useRef(obj);
  let lastParamRef = useRef(obj);
  if (lastParamRef.current !== obj) {
    lastParamRef.current = obj;
    if (lastResultRef.current !== obj) {
      let same = equals(obj, lastResultRef.current);
      if (!same) lastResultRef.current = obj;
    }
  }
  return lastResultRef.current;
}

export { useMemoObject };
export default useMemoObject;
