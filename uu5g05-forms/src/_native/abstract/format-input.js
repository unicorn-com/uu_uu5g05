import { Utils, useRef, useState, useUpdateLayoutEffect, usePreviousValue, useEffect, useLayoutEffect } from "uu5g05";
import { useDevice } from "uu5g05";
import useFocus from "../../_internal/use-focus";

function updateValueProps(valueInst, prevValueProps, valueProps) {
  for (let key in valueProps) {
    if (valueProps[key] !== prevValueProps[key]) {
      const fnName = "set" + key[0].toUpperCase() + key.slice(1);
      if (valueInst[fnName]) valueInst[fnName](valueProps[key]);
      else {
        console.warn(`Class ${valueInst.constructor.name} does not support function ${fnName} to set changed value`);
      }
    }
  }
}

const FormatInput = Utils.Component.forwardRef((props, ref) => {
  const { FormatValue, format, clipboardKey, valueProps, _valueInstRef, ...restProps } = props;
  const { value, onChange, min, max, step, lang, formatValueProps = {}, ...propsToPass } = restProps;
  const { disabled, readOnly } = propsToPass;

  const { browserName } = useDevice();

  const inputRef = useRef();
  const [valueInst] = useState(
    () =>
      new FormatValue(
        value,
        format,
        inputRef,
        { ...formatValueProps, ...valueProps, min, max, step, lang },
        browserName,
      ),
  );

  const prevValueProps = usePreviousValue(valueProps, valueProps);
  updateValueProps(valueInst, prevValueProps, valueProps);

  const [focus, handleFocus, handleBlur] = useFocus({
    onFocus: props.onFocus,
    onBlur: (e) => {
      valueInst.blur();
      props.onBlur?.(e);
    },
    disabled,
  });

  const [formattedValue, _setFormattedValue] = useState(() => valueInst.format(focus));

  function setFormattedValue() {
    _setFormattedValue(valueInst.format(focus));
  }

  useEffect(() => {
    // timeout because click must be done before focus, without this timeout focus set cursor to start of the field and
    // click event gets index 0 and wrongly select the slot
    if (focus) setTimeout(() => valueInst.select(), 0);
  }, [formattedValue, focus, valueInst]);

  function callOnChange(e) {
    const error = valueInst.validate();
    const data = {};
    if (error) data.error = error;

    if (error === "badValue") {
      data.value = null;
      setFormattedValue();
    } else {
      data.value = valueInst.toIsoString();
    }

    onChange(new Utils.Event(data, e));
  }

  function setValueObject(e) {
    if (valueInst.isCompleted()) {
      callOnChange(e);
    } else if (valueInst.isEmpty()) {
      setFormattedValue();
      onChange(new Utils.Event({ value: undefined }, e));
    } else if (value != null) {
      onChange(new Utils.Event({ value: null, error: "badValue" }, e));
    } else {
      setFormattedValue();
    }
  }

  useUpdateLayoutEffect(() => {
    if (value !== null) valueInst.setValue(value);
    setFormattedValue();
  }, [value]);

  useUpdateLayoutEffect(() => {
    valueInst.setMin(min);
    if (valueInst.isCompleted()) callOnChange();
  }, [min]);

  useUpdateLayoutEffect(() => {
    valueInst.setMax(max);
    if (valueInst.isCompleted()) callOnChange();
  }, [max]);

  useUpdateLayoutEffect(() => {
    valueInst.setStep(step);
    if (valueInst.isCompleted()) callOnChange();
  }, [step]);

  useUpdateLayoutEffect(() => {
    valueInst.setLang(lang);
    setFormattedValue();
  }, [lang]);

  // NOTE This must be called *after* the effect which synchronizes props.value into valueInst, not before.
  // Otherwise, if developer changes props.value to entirely different date+time, we would call onChange() sooner
  // than valueInst.setValue(props.value) was called (but after valueInst.setDate(date)) so end result would be
  // that fired event would contain our old "time" so DateTime component would show "date" part from new value but
  // "time" part from old value.
  useUpdateLayoutEffect(
    () => {
      if (valueProps && value !== valueInst.toIsoString()) callOnChange();
    },
    valueProps ? Object.values(valueProps) : [],
  );

  useLayoutEffect(() => {
    // This is only for internal logic. In some cases we need to access valueInst from the parent.
    // E.g. DateRange component
    if (_valueInstRef) _valueInstRef.current = { valueInst };
  });

  function handleChange(e) {
    console.warn("onChange should not happen", e.target.value);
  }

  function handleClick(e) {
    // timeout because click event for selected slot show just cursor
    setTimeout(() => valueInst.focus(), 0);
    props.onClick?.(e);
  }

  function writeChar(char, e) {
    if (isNaN(+char) || char === " ") {
      valueInst.checkSeparator(char);
    } else {
      const valueObject = valueInst.write(char);
      // if value is invalid (e.g. 38 for day) it returns undefined -> nothing is happened, but selection must be set
      valueObject ? setValueObject(e) : setTimeout(() => valueInst.select(), 0);
    }
  }

  function handleKeyDown(e) {
    props.onKeyDown?.(e);

    if (!e.defaultPrevented) {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          valueInst.selectPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          valueInst.selectNext();
          break;
        case "ArrowUp":
          e.preventDefault();
          valueInst.increase();
          setValueObject(e);
          break;
        case "ArrowDown":
          e.preventDefault();
          valueInst.decrease();
          setValueObject(e);
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          valueInst.clear();
          setValueObject(e);
          break;
        case "a":
        case "c":
        case "v":
          if (!e.ctrlKey && !e.metaKey) e.preventDefault();
          break;
        case "Control":
          break;
        default:
          if (e.key.length === 1) {
            e.preventDefault();
            writeChar(e.key, e);
          }
      }
    }
  }

  function handleCopy(e) {
    props.onCopy?.(e);

    if (!e.defaultPrevented) {
      if (value) {
        Utils.Clipboard.write({ ["x-formatinput_" + clipboardKey]: value, text: formattedValue }, e);
      }
    }
  }

  function handlePaste(e) {
    props.onPaste?.(e);

    if (!e.defaultPrevented) {
      const pastedValue = Utils.Clipboard.read(e, "x-formatinput_" + clipboardKey);
      if (pastedValue) {
        valueInst.setValue(pastedValue);
        callOnChange(e);
      } else {
        const pastedValueString = (Utils.Clipboard.read(e) || "").trim();
        if (pastedValueString) {
          const pastedValue = FormatValue.parseValue(pastedValueString, format);
          if (pastedValue) {
            valueInst.setValue(pastedValue);
            callOnChange(e);
          }
        }
      }
      e.preventDefault();
    }
  }

  // for mobile
  function handleInput(e) {
    e.preventDefault();
    writeChar(e.nativeEvent.data, e);
  }

  const isValueVisible = focus || (value && valueInst.isCompleted());

  return (
    <input
      {...propsToPass}
      ref={Utils.Component.combineRefs(ref, inputRef)}
      value={isValueVisible ? formattedValue : ""}
      inputMode="numeric" // for mobile
      onCopy={handleCopy}
      {...(disabled || readOnly
        ? null
        : {
            onChange: handleChange,
            onFocus: handleFocus,
            onBlur: handleBlur,
            onClick: handleClick,
            onKeyDown: handleKeyDown,
            onPaste: handlePaste,
            onInput: handleInput,
          })}
    />
  );
});

export default FormatInput;
