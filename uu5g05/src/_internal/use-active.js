import { useState, useRef, useLayoutEffect } from "../hooks/react-hooks.js";
import useEvent from "../hooks/use-event.js";
import UtilsEvent from "../utils/event.js";
import UtilsDom from "../utils/dom.js";

function _combineListeners(...listeners) {
  let fns = listeners.filter((it) => typeof it === "function");
  if (fns.length <= 1) return fns[0];
  return function (...args) {
    for (let fn of fns) fn.call(this, ...args);
  };
}

function _clearPlan(cleanup) {
  cleanup?.();
}

let plannedFns = [];
function _flushPlannedFns() {
  let list = plannedFns;
  plannedFns = [];
  UtilsDom._batchedUpdates(() => {
    list.forEach((fn) => fn());
  });
}
function _planAfterEvent(nextEventList, callback) {
  // NOTE We're collecting all planned callbacks (even from other subscribers) so that we can execute
  // them in single React batch. Without this, e.g. in uuEcc when user clicked outside of richtext,
  // both section and richtext got deactivated, but section deactivation got executed first and in separate
  // batch than richtext's, leading to section saving old data (because richtext didn't fire onBlur yet).
  //   => by executing callbacks in single batch it's faster and also the effects reacting to "active" state
  //      changes will be firing in a standard way, i.e. from most nested subscriber outwards, and therefore
  //      richtext will fire its effect (with onBlur) sooner than uuEcc section.
  plannedFns.push(callback);
  let cleanupList = [];
  let cleanup = () => {
    cleanupList.forEach((fn) => fn());
    cleanupList = [];
  };
  let timeout = setTimeout(() => {
    cleanup();
    _flushPlannedFns();
  }, 0);
  cleanupList.push(() => clearTimeout(timeout));
  for (let eventName of nextEventList) {
    let handler = (e) => (cleanup(), _flushPlannedFns());
    window.addEventListener(eventName, handler, true);
    cleanupList.push(() => window.removeEventListener(eventName, handler, true));
  }
  return () => {
    plannedFns = plannedFns.filter((it) => it !== callback);
    cleanup();
  };
}

// "active":
// - gained when user mouseup-s or focuses without mouse into element / React subtree
// - lost if user mouseup-s elsewhere or blurs using Tab key
// NOTE "mouseup" is used instead of "mousedown" so that we can check whether there is a selection
// (in which case we do not activate).
function useActive(opts) {
  const [active, setActive] = useState(false);
  const elementRef = useRef();
  const deactivateTimeoutRef = useRef();

  function onReactMouseUpCapture(e) {
    // console.log(opts?.id + " onReactMouseUpCapture (clear deactivate)", e);
    _clearPlan(deactivateTimeoutRef.current);
  }
  function onReactMouseUp(e) {
    // console.log(opts?.id + " onReactMouseUp (maybe activate)", e);
    let allowActivate = opts?.skipSelection === true || !getSelection().toString();
    if (allowActivate) {
      plannedFns.push(() => {
        if (typeof opts?.onActivation === "function") {
          let event = new UtilsEvent({ activatedOnElement: e.target, currentElement: e.currentTarget });
          opts.onActivation(event);
          allowActivate = !event.defaultPrevented;
        }
        if (allowActivate) {
          // console.log(opts?.id + " onReactMouseUp (activate)", e);
          setActive(true);
        }
      });
      _flushPlannedFns();
    }
  }
  function onReactFocus(e) {
    // console.log(opts?.id + " onReactFocus (maybe activate)", e);

    // eslint-disable-next-line no-use-before-define
    if (lastFocusSourceRef.current === "mouse") return; // wait for mouseup so that we can check that selection is empty

    let allowActivate = true;
    plannedFns.push(() => {
      if (typeof opts?.onActivation === "function") {
        let event = new UtilsEvent({ activatedOnElement: e.target, currentElement: e.currentTarget });
        opts.onActivation(event);
        allowActivate = !event.defaultPrevented;
      }
      if (allowActivate) {
        // console.log(opts?.id + " onReactFocus (activate)", e);
        elementRef.current = e.currentTarget;
        setActive(true);
      }
    });
    _flushPlannedFns();
  }

  // NOTE If user mousedown-ed a button, e.g. a richtext-opening button in edited cell in Uu5TilesBricks.Table in uuEcc,
  // which opens a Modal (directly in mousedown, not after mouseup), the mouseup might then happen on top of Modal overlay layer
  // which is rendered by ModalBus and therefore considered outside of the React subtree of Uu5TilesBricks.Table, so component
  // would deactive on mouse up (effectively ending edit mode and closing Modal).
  //   => remember whether mousedown happenned inside of React tree and if it did then skip deactivation in mouseup.
  const wasMouseDownInsideRef = useRef(false);
  function onReactMouseDownCapture(e) {
    wasMouseDownInsideRef.current = true;
  }
  function onWindowMouseDownCapture(e) {
    wasMouseDownInsideRef.current = false;
  }
  function onWindowMouseUpCapture(e) {
    let allowDeactivate = opts?.skipSelection === true || !getSelection().toString();
    if (allowDeactivate && !wasMouseDownInsideRef.current) {
      // console.log(opts?.id + " onWindowMouseUpCapture (clear deactivate timeout)", e);
      _clearPlan(deactivateTimeoutRef.current);
      if (active) {
        // console.log(opts?.id + " onWindowMouseUpCapture (plan deactivate)");
        // NOTE We want to do deactivation right after this event (mouseup) finishes. Unfortunately there doesn't seem
        // to be a way (API) to do that.
        // => wait for either timeout 0ms or for mousemove/other events (whatever happens sooner)
        deactivateTimeoutRef.current = _planAfterEvent(["click", "mousemove"], () => {
          let isFocusOutside = !elementRef.current?.contains(document.activeElement);
          // console.log(opts?.id + ` onWindowMouseUpCapture (deactivate${!isFocusOutside ? " skipped" : ""})`);
          if (isFocusOutside) {
            opts?.onDeactivation?.();
            setActive(false);
          }
        });
      }
    }
  }
  useEvent("mouseup", active ? onWindowMouseUpCapture : null, window, { capture: true });
  useEvent("mousedown", active ? onWindowMouseDownCapture : null, window, { capture: true });

  // additionally, if we're in the component and hit Tab, we should deactivate too
  const deactivateByKeyboardTimeoutRef = useRef();
  const lastFocusSourceRef = useRef();
  useEvent("mousedown", () => (lastFocusSourceRef.current = "mouse"), window, { capture: true });
  useEvent("mouseup", () => (lastFocusSourceRef.current = undefined), window, { capture: true });
  useEvent("keydown", (e) => e.keyCode === 9 && (lastFocusSourceRef.current = "keyboard"), window, {
    capture: true,
  });
  useEvent("keyup", () => (lastFocusSourceRef.current = undefined), window, { capture: true });
  function onWindowFocusInCapture(e) {
    if (
      active &&
      lastFocusSourceRef.current === "keyboard" &&
      e.relatedTarget &&
      elementRef.current &&
      elementRef.current.contains(e.relatedTarget)
    ) {
      _clearPlan(deactivateByKeyboardTimeoutRef.current);
      // NOTE We want to do deactivation right after this event (focusin) finishes. Unfortunately there doesn't seem
      // to be a way (API) to do that.
      // => wait for either timeout 0ms or for one of common events (whatever happens sooner)
      deactivateByKeyboardTimeoutRef.current = _planAfterEvent(["focusin", "focusout", "mousedown", "keydown"], () => {
        // console.log(opts?.id + ` onWindowFocusInCapture (deactivate)`);
        opts?.onDeactivation?.();
        setActive(false);
      });
    }
  }
  function onReactFocus2(e) {
    _clearPlan(deactivateByKeyboardTimeoutRef.current);
  }
  useEvent("focusin", active ? onWindowFocusInCapture : null, window, { capture: true });

  useLayoutEffect(
    () => () => {
      // console.log(opts?.id + " unmount (deactivate)");
      _clearPlan(deactivateTimeoutRef.current);
      _clearPlan(deactivateByKeyboardTimeoutRef.current);
      plannedFns.push(() => opts?.onDeactivation?.());
      _flushPlannedFns();
    },
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
    [],
  );

  const setActiveRef = useRef((v) => {
    if (!v) {
      // console.log(opts?.id + " setActiveRef (deactivate)");
      _clearPlan(deactivateTimeoutRef.current);
      _clearPlan(deactivateByKeyboardTimeoutRef.current);
      plannedFns.push(() => opts?.onDeactivation?.());
      _flushPlannedFns();
    }
    setActive(v);
  });

  const elementAttrs = {
    onMouseUp: onReactMouseUp,
    onMouseUpCapture: onReactMouseUpCapture,
    onMouseDownCapture: onReactMouseDownCapture,
    onFocus: _combineListeners(onReactFocus, onReactFocus2),
  };
  return {
    elementAttrs,
    active,
    setActive: setActiveRef.current,
  };
}

export { useActive };
export default useActive;
