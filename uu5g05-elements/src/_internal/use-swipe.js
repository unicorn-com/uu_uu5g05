import { useEvent, useLayoutEffect, useRef, useState, Utils } from "uu5g05";

function useSwipe({ onSwipeStart, onSwipe, onSwipeEnd }, minSwipeLength = 40) {
  // TODO Simplify somehow. We cannot simply send `ref` to useEvent() because that would work only if
  // the component passes the ref onto an element during mount (if it shows it conditionally then useEvent
  // won't detect the attaching of DOM node). On the other hand we also don't want to need 2 renders
  // (which would happen if we sent setElement as ref).
  const ref = useRef();
  const [element, setElement] = useState();
  useLayoutEffect(() => {
    // if null gets set, it means that result ref wasn't mounted anywhere; this also signals to useEvent that it's intentional
    // (so that it doesn't show developer warning regarding `you forgot to pass object-like ref onto an element`)
    ref.current ??= null;
  }, []);
  const resultRef = useRef((element) => {
    if (ref.current === undefined) {
      ref.current = element ?? null;
    } else {
      ref.current = null;
      setElement(element ?? null);
    }
  }).current;

  const lastTouch = useRef(null);

  useEvent(
    "touchstart",
    (e) => {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (typeof onSwipeStart === "function") onSwipeStart(e);
    },
    element === undefined ? ref : element,
    { passive: false },
  );

  const eventData = useRef();

  useEvent(
    "touchmove",
    (e) => {
      if (lastTouch.current == null) return;

      let swipeXDiff = lastTouch.current.x - e.touches[0].clientX;
      let swipeYDiff = lastTouch.current.y - e.touches[0].clientY;

      if (Math.abs(swipeXDiff) > minSwipeLength || Math.abs(swipeYDiff) > minSwipeLength) {
        eventData.current = { xDifference: swipeXDiff, yDifference: swipeYDiff };

        let left = swipeXDiff >= minSwipeLength;
        let right = swipeXDiff <= -minSwipeLength;
        let up = swipeYDiff >= minSwipeLength;
        let down = swipeYDiff <= -minSwipeLength;

        if (up) eventData.current.yDirection = "up";
        else if (down) eventData.current.yDirection = "down";

        if (left) eventData.current.xDirection = "left";
        else if (right) eventData.current.xDirection = "right";
      } else {
        eventData.current = null;
      }

      if (typeof onSwipe === "function") onSwipe(new Utils.Event(eventData.current, e));
    },
    element === undefined ? ref : element,
  );

  useEvent(
    "touchend",
    (e) => {
      lastTouch.current = null;
      if (typeof onSwipeEnd === "function") onSwipeEnd(new Utils.Event(eventData.current, e));
      eventData.current = null;
    },
    element === undefined ? ref : element,
  );

  return resultRef;
}

export { useSwipe };
export default useSwipe;
