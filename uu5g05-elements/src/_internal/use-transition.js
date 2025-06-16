import { useEffect, useLayoutEffect, useRef, useState } from "uu5g05";

function useTransition(duration, rootRef) {
  // - states: end (initial) => init => run => end
  //   1. "init" is for setting CSS for before the transition runs and letting the browser paint it
  //      (after "init" there has to be async timeout, i.e. next step is in requestAnimationFrame).
  //   2. Switch to "run" step (re-render with CSS intended for transition itself).
  //   3. After "duration" millisecond switch to "end" step (re-render with CSS for after transition).
  let [state, setState] = useState("end");
  let timerKeyRef = useRef(0);
  let run = () => {
    let newState = state !== "run" ? "init" : state; // if already running then keep running, but reset timeout
    timerKeyRef.current++;
    if (state === newState) return;
    setState(newState);
  };

  useEffect(() => {
    if (state === "init") {
      let rafId = requestAnimationFrame(() => setState("run"));
      return () => cancelAnimationFrame(rafId);
    }
  }, [state]);
  useEffect(() => {
    if (state === "run") {
      let timeout = setTimeout(() => setState("end"), duration);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [duration, state, timerKeyRef.current]);

  // this forces browser to perform reflow; without this, the transition might not get animated
  // because of browser optimizations (i.e. requestAnimationFrame above wouldn't be sufficient - simulated
  // on doc/use-data-list/e00.html)
  useLayoutEffect(() => {
    if (rootRef?.current) rootRef.current.offsetWidth + rootRef.current.offsetHeight;
  }, [rootRef, state]);

  return [state, run];
}

export { useTransition };
export default useTransition;
