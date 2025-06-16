import { useLayoutEffect, useRef, useState } from "./react-hooks.js";
import useEvent from "./use-event.js";

function useScrollDirection(refOrElementOrWindow = window) {
  let [scrollDirection, setScrollDirection] = useState();
  let lastScrollInfoRef = useRef();
  useEvent(
    "scroll",
    (e) => {
      let target = e.currentTarget || e.target;
      let scrollTop = target.scrollTop || target.scrollY || 0;
      let lastScrollInfo = lastScrollInfoRef.current;
      let prevScrollTop = lastScrollInfo?.scrollTop ?? scrollTop;
      lastScrollInfoRef.current = { scrollTop };
      if (scrollTop !== prevScrollTop) setScrollDirection(scrollTop < prevScrollTop ? "up" : "down");
    },
    refOrElementOrWindow,
  );
  useLayoutEffect(() => {
    let el =
      refOrElementOrWindow && "current" in refOrElementOrWindow ? refOrElementOrWindow.current : refOrElementOrWindow;
    lastScrollInfoRef.current = { scrollTop: el?.scrollTop || el?.scrollY || 0 };
  }, [refOrElementOrWindow]);

  return scrollDirection; // "up" || "down" || undefined
}

export { useScrollDirection };
export default useScrollDirection;
