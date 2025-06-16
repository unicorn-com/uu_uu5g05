import { useLayoutEffect, useRef } from "uu5g05";

function useComplexState(formState, setFormState) {
  const isMountRef = useRef(true);
  const settersRef = useRef({});

  useLayoutEffect(() => {
    isMountRef.current = false;
  });

  function useNamedState(name, initialValue) {
    if (isMountRef.current && !(name in formState)) {
      formState[name] = typeof initialValue === "function" ? initialValue() : initialValue;
    }
    const value = formState[name];
    const setValue = (settersRef.current[name] ??= (value) => {
      setFormState((formState) => {
        let newValue = typeof value === "function" ? value(formState[name]) : value;
        return newValue !== formState[name] ? { ...formState, [name]: newValue } : formState;
      });
    });

    return [value, setValue];
  }

  return { useNamedState };
}

export { useComplexState };
export default useComplexState;
