import { useState, useRef } from "../hooks/react-hooks.js";

function useValueChange(value, onChange, controlled) {
  let [v, setV] = useState(value);

  // make "setValue" fn instance constant (i.e. we must pass onChange via ref to the setValue fn)
  const valueRef = useRef();
  let currentValuesRef = useRef();
  currentValuesRef.current = { controlled, onChange };

  let setValueRef = useRef((newValue) => {
    let { controlled, onChange } = currentValuesRef.current;

    let finalNewValue = newValue;
    if (typeof finalNewValue === "function") {
      finalNewValue = finalNewValue(valueRef.current);
    }

    if (finalNewValue !== valueRef.current) {
      valueRef.current = finalNewValue;
      onChange?.(valueRef.current);
      if (!controlled) setV(finalNewValue);
    }
  });

  if (controlled && v !== value) setV((v = value));
  valueRef.current = v;

  return [v, setValueRef.current];
}

export { useValueChange };
export default useValueChange;
