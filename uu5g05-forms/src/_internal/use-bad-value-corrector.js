import { useState, useEvent, Utils } from "uu5g05";
import Config from "../config/config.js";
function useBadValueCorrector(elementRef, { value, onChange }) {
  // this fixes following scenario:
  // 1. User enters date into <input type="date"> (or other type="..." which uses el.validity.badInput).
  // 2. User deletes month - onChange gets triggerred with inputEl.value==="" (we propagate it as value:null).
  //    At this point inputEl.validity.badInput is true.
  // 3. User deletes year & day, i.e. input is empty - no event gets triggerred, browser silently changes
  //    inputEl.validity.badInput to false.
  // and we need to detect step 3 and trigger onChange
  const badValueClassName = useNativeInputValidityChange((valid) => {
    // if input became valid but empty then trigger onChange to change props.value from null (invalid) to undefined (empty value);
    // similarly if input became invalid (due to validity.badInput) then change from undefined/non-null to null (invalid)
    if (
      elementRef?.current &&
      elementRef.current.value === "" &&
      ((valid && value === null) || (!valid && elementRef.current.validity?.badInput && value !== null))
    ) {
      // NOTE We would optimally just dispatch new InputEvent("input", { bubbles: true }) but React won't process
      // it correctly (maybe because it's not trusted or it expects other events to precede it...).
      //   => for now it is sufficient to call props.onChange()
      if (typeof onChange === "function") {
        let event = new Utils.Event({ value: valid ? undefined : null });
        onChange(event);
      }
    }
  });
  return badValueClassName;
}

// inspired by https://github.com/csuwildcat/SelectorListener
let counter = 0;
function useNativeInputValidityChange(onValidityChangeCallback) {
  const [key] = useState(() => counter++);
  const animationNameValid = Config.Css.keyframes(`/*${key}v*/ to { outline-color: rgba(0,0,0,0) }`);
  const animationNameInvalid = Config.Css.keyframes(`/*${key}i*/ to { outline-color: rgba(0,0,0,0) }`);
  const className = Config.Css.css({
    ":valid::before": { content: '""', animation: `${animationNameValid} 0.01s` },
    ":invalid::before": { content: '""', animation: `${animationNameInvalid} 0.01s` },
  });
  useEvent(
    "animationstart",
    (e) => {
      if (e.animationName === animationNameValid) onValidityChangeCallback(true);
      else if (e.animationName === animationNameInvalid) onValidityChangeCallback(false);
    },
    window,
    { capturing: true },
  );
  return className;
}

export { useBadValueCorrector };
export default useBadValueCorrector;
