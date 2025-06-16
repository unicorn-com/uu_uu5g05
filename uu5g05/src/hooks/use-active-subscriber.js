import { useLayoutEffect, useRef, useState } from "./react-hooks.js";
import useEvent from "./use-event.js";
import { EVENT_ACTIVE_CHANGE } from "../_internal/use-active-publisher.js";
import useActive from "../_internal/use-active.js";
import UtilsEvent from "../utils/event.js";

// let counter = 0; // for debugging only

// "extended active" <=> like "active" but if activeness gets transferred into any of publishers then we remain "extended active"
// (and get deactivated if users ends up clicking / Tabbing out of all publishers && out of our component)
function _useExtendedActive(opts) {
  // // for debugging only
  // const [id] = window.Uu5.useState(() => "subscriber-" + counter++);
  // opts = { ...opts, id };

  const [activeViaPublishers, setActiveViaPublishers] = useState(false);
  if (typeof opts?.onActivation === "function") {
    let { onActivation } = opts;
    opts = {
      ...opts,
      onActivation: (e) => {
        e.data.activeViaPublishers = activeViaPublishers;
        return onActivation(e);
      },
    };
  }
  if (typeof opts?.onDeactivation === "function") {
    let { onDeactivation } = opts;
    opts = {
      ...opts,
      onDeactivation: (e) => {
        e.data.activeViaPublishers = activeViaPublishers;
        return onDeactivation(e);
      },
    };
  }
  const { elementAttrs, active: directlyActive, setActive } = useActive(opts);
  const active = directlyActive || activeViaPublishers;

  // // for debugging only
  // const debugRef = useRef();
  // let newInfo = { active, directlyActive, activeViaPublishers };
  // if (!window.Uu5.Utils.Object.shallowEqual(newInfo, debugRef.current)) {
  //   debugRef.current = newInfo;
  //   console.log(id, newInfo);
  // }

  useEvent(
    EVENT_ACTIVE_CHANGE,
    active
      ? (e) => {
          let activeViaPublishers = Object.values(e.data).some(Boolean);
          // console.log(opts?.id + " event", { activeViaPublishers, map: e.data });
          setActiveViaPublishers(activeViaPublishers);
        }
      : undefined,
  );

  const setActiveRef = useRef((v) => {
    if (!v) setActiveViaPublishers(false);
    setActive(v);
  });

  return {
    elementAttrs,
    active,
    setActive: setActiveRef.current,
  };
}

// trigger onFocus/Blur depending on "extended active" flag changes
function useActiveSubscriber({ onFocus, onBlur, onActivation } = {}) {
  const activeResult = _useExtendedActive({ onActivation });
  const { active } = activeResult;

  const currentValuesRef = useRef();
  useLayoutEffect(() => {
    currentValuesRef.current = {
      onFocus,
      onBlur,
      renderCount: (currentValuesRef.current?.renderCount || 0) + 1,
    };
  });

  useLayoutEffect(() => {
    const { onFocus, onBlur, renderCount } = currentValuesRef.current;
    if (renderCount === 1) return; // skip for mount

    if (active && typeof onFocus === "function") onFocus(new UtilsEvent());
    else if (!active && typeof onBlur === "function") onBlur(new UtilsEvent());
  }, [active]);

  return activeResult;
}

export { useActiveSubscriber };
export default useActiveSubscriber;
