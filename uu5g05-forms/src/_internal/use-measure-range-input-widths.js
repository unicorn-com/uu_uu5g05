import { useEffect, useRef, useState } from "uu5g05";
import config from "../config/config.js";

//@@viewOn:css
const Css = {
  span: () =>
    config.Css.css({
      position: "absolute",
      visibility: "hidden",
      whiteSpace: "pre",
      fontSize: "inherit",
      fontFamily: "inherit",
      paddingInline: 2,
    }),
};
//@@viewOff:css

function useMeasureRangeInputWidths(inputRef, placeholder, formattedValue) {
  const [rangeValueAsText, setRangeValueAsText] = useState();
  const [rangeInputWidth, setRangeInputWidth] = useState();
  const rangeSpanRef = useRef();
  const currentValuesRef = useRef();
  currentValuesRef.current = { inputRef };

  useEffect(() => {
    function handleInput(e) {
      setRangeValueAsText(e.target.value);
    }

    let inputEl = inputRef.current;
    let origProperty = Object.getOwnPropertyDescriptor(inputEl, "value");
    Object.defineProperty(inputEl, "value", {
      configurable: true,
      enumerable: true,
      set: function (value) {
        origProperty.set.call(this, value);
        setRangeValueAsText(value);
      },
      get: function () {
        return origProperty.get.call(this);
      },
    });

    // NOTE must wait for the render, because NativeInput applies the new props.value only in effect
    inputEl.addEventListener("input", handleInput);
    setRangeValueAsText(inputEl.value);

    return () => {
      inputEl.removeEventListener("input", handleInput);
    };
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, []);

  useEffect(() => {
    const range = rangeSpanRef.current;
    if (range) setRangeInputWidth(range.offsetWidth);
  }, [rangeValueAsText]);

  let measureJsx = (
    <span ref={rangeSpanRef} className={Css.span()}>
      {rangeValueAsText || formattedValue || placeholder}
    </span>
  );

  return { width: rangeInputWidth, measureJsx };
}

export { useMeasureRangeInputWidths };
export default useMeasureRangeInputWidths;
