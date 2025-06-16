//@@viewOn:imports
import { useCallback, useDevice, useEffect, useRef, useState, Utils } from "uu5g05";
import useOpenPicker from "./use-open-picker";
import useFocusWithType from "./use-focus-with-type";
//@@viewOff:imports
const DEFAULT_EQUAL_FUNCTION = (item1, item2) => {
  if (typeof item1 !== typeof item2) return false;
  return typeof item1 === "object" ? Utils.Object.deepEqual(item1, item2) : item1 === item2;
};

function usePicker(props, type, equal, opts = {}) {
  const toggleOnEnter = opts.toggleOnEnter ?? true;
  const preserveInputFocus = opts.preserveInputFocus ?? true;
  const openOnArrowDown = opts.openOnArrowDown ?? toggleOnEnter;
  equal = equal || DEFAULT_EQUAL_FUNCTION; // set default comparison function
  const { onFocus, onBlur, disabled, readOnly, pending, onChange, elementRef, value } = props;
  const [focus, handleFocus, handleBlur] = useFocusWithType({
    onFocus,
    onBlur: (e) => {
      if (preserveInputFocus && displayPicker) setDisplayPicker(false);
      if (typeof onBlur === "function") onBlur(e);
    },
    disabled: disabled || readOnly,
    type,
  });
  const [input, setInput] = useState(null);

  const { browserName } = useDevice();
  const [displayPicker, setDisplayPicker] = useOpenPicker(false, props.displayPicker, props.onDisplayPickerChange);

  const [id] = useState(() => Utils.String.generateId());
  const pickerId = (props.id || id) + "-picker";

  const isActive = !pending && !readOnly && !disabled;

  let propsIconRightList = props.iconRightList;

  let iconRightList = props.iconRightList || [];
  if (!propsIconRightList?.length && props.iconRight) {
    // Use iconRight only if iconRightList isnt defined (same behavior as withExtensionInput)
    iconRightList = [{ icon: props.iconRight, onClick: props.onIconRightClick }];
  }

  if (props.value && isActive && !props.required && props.clearIcon !== null) {
    iconRightList =
      type === "time" && browserName === "firefox" && !props.iconRight && !props.onIconRightClick
        ? undefined
        : [
            {
              icon: props.clearIcon || "uugds-close",
              onClick: (e) => {
                if (typeof onChange === "function" && isActive) {
                  input.focus();
                  onChange(new Utils.Event({ value: undefined }, e));
                }
              },
            },
            ...iconRightList,
          ];
  }

  const onKeyDown = (e) => {
    if (displayPicker && e.code === "Tab") {
      setDisplayPicker(false);
    } else if (
      (toggleOnEnter && (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter")) ||
      (openOnArrowDown && !displayPicker && e.code === "ArrowDown")
    ) {
      e.preventDefault();
      if (isActive) {
        setDisplayPicker((prev) => !prev);
      }
    }
  };

  // optimization, esp. for DateInput with Calendar in Popover, to not re-render Calendar several times
  // during opening of Popover (e.g. due to focus loss on main input, element size observing, ...)
  const currentValuesRef = useRef();
  useEffect(() => {
    currentValuesRef.current = { equal, value, onChange };
  });
  const pickerOnSelect = useCallback(
    (e) => {
      const { equal, value, onChange } = currentValuesRef.current;
      if (typeof onChange === "function" && !equal(value, e.data.value)) {
        onChange(e);
      }
      if (opts.rangeSelection) {
        if (Array.isArray(e.data.value) && e.data.value.length > 1) setDisplayPicker(false);
        return;
      }
      setDisplayPicker(false);
    },
    [setDisplayPicker, opts.rangeSelection],
  );

  return {
    input,
    focus,
    displayPicker,
    setDisplayPicker,
    inputProps: {
      iconRightList,
      onFocus: handleFocus,
      onBlur: handleBlur,
      elementRef: Utils.Component.combineRefs(elementRef, setInput),
      elementAttrs: {
        "aria-live": "polite",
        "aria-haspopup": "listbox",
        "aria-expanded": displayPicker,
        "aria-controls": pickerId,
        "aria-labelledby": props.id ? [props.id, props.id + "-label"].join(" ") : undefined,
        onKeyDown,
      },
    },
    popoverProps: {
      initialState: "full",
      element: input,
      elementAttrs: {
        onMouseDown: preserveInputFocus ? (e) => e.preventDefault() : undefined, // prevent invocation of onBlur
      },
      elementOffset: 4,
      onClose: () => setDisplayPicker(false),
    },
    pickerProps: {
      id: pickerId,
      onSelect: pickerOnSelect,
    },
  };
}

export { usePicker };
export default usePicker;
