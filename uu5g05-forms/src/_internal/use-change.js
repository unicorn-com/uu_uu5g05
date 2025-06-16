//@@viewOn:imports
import { useValueChange } from "uu5g05";

//@@viewOff:imports

function useChange(propsValue, onChange) {
  const [value, setValue] = useValueChange(propsValue);

  function handleChange(e) {
    if (typeof onChange === "function") {
      onChange(e);
    } else {
      setValue(e.data.value);
    }
  }

  return [typeof onChange === "function" && propsValue !== undefined ? propsValue : value, handleChange];
}

export { useChange };
export default useChange;
