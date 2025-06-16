//@@viewOn:imports
import { useValueChange } from "uu5g05";
import useEscEvent from "./use-esc-event";
//@@viewOff:imports

function useOpenPicker(initialValue = false, value, onChange) {
  const [isOpen, setIsOpen] = useValueChange(value || initialValue, onChange);
  useEscEvent(isOpen ? () => setIsOpen(false) : null);
  return [isOpen, setIsOpen];
}

export { useOpenPicker };
export default useOpenPicker;
