//@@viewOn:imports
import { useDevice } from "uu5g05";
import usePicker from "./use-picker";
//@@viewOff:imports

function useNativePicker(props, type, equal, opts = {}) {
  const { disabled, readOnly, pending, pickerType, onClick, onIconLeftClick, elementAttrs } = props;
  const { browserName, isMobileOrTablet } = useDevice();

  const isActive = !pending && !readOnly && !disabled;

  const { input, displayPicker, setDisplayPicker, inputProps, popoverProps, ...other } = usePicker(
    {
      ...props,
      onOpen: openPicker,
    },
    type,
    equal,
    {
      ...opts,
      toggleOnEnter: opts?.toggleOnEnter ?? pickerType !== "native",
    },
  );

  // Delete onClose from popover props to prevent automatic popover close.
  // Close is handled manually on blur effect, keyboard actions, etc.
  delete popoverProps.onClose;

  function openPicker(e) {
    if (e) e.preventDefault();

    input.focus();
    if (pickerType === "native") {
      // On icon click - show native picker on Firefox
      if (browserName === "firefox") input.showPicker();
    } else {
      setDisplayPicker(true);
    }
  }

  function onInputClick(e) {
    if (isActive) {
      if (typeof onClick === "function") {
        onClick(e);
      }
      if (pickerType !== "native") openPicker();
    }
  }

  function handleIconLeftClick(e) {
    if (typeof onIconLeftClick === "function") onIconLeftClick(e);
    input.focus();
    if (pickerType !== "native") setDisplayPicker((prevState) => !prevState);
  }

  return {
    ...other,
    popoverProps,
    input,
    displayPicker,
    setDisplayPicker,
    inputProps: {
      ...inputProps,
      onIconLeftClick: handleIconLeftClick,
      elementAttrs: {
        ...elementAttrs,
        ...inputProps.elementAttrs,
        onClick: onInputClick,
        inputMode: pickerType !== "native" && isMobileOrTablet ? "none" : undefined,
      },
    },
  };
}

export { useNativePicker };
export default useNativePicker;
