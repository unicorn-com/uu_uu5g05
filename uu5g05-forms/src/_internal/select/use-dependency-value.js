//@@viewOn:imports
import { useState, useRef, useEffect } from "uu5g05";
//@@viewOff:imports

function useDependencyValue(value, deps) {
  const [dependencyValue, setDependencyValue] = useState(value);
  const valueRef = useRef();
  valueRef.current = value;

  useEffect(() => {
    // Update dependencyValue everytime when deps.open is true and deps is changed
    if (deps.open) setDependencyValue(valueRef.current);
  }, [deps]);

  return dependencyValue;
}

export { useDependencyValue };
export default useDependencyValue;
