import { useRef, useMemo } from "./react-hooks.js";
import UtilsFunction from "../utils/function.js";

const INTERVAL_DEBOUNCE = 150;

function getContentBoxSize(el, rect = el.getBoundingClientRect()) {
  let computedStyle = getComputedStyle(el);
  let paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  let paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  let paddingTop = parseFloat(computedStyle.paddingTop) || 0;
  let paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
  let borderLeft = parseFloat(computedStyle.borderLeft) || 0;
  let borderRight = parseFloat(computedStyle.borderRight) || 0;
  let borderTop = parseFloat(computedStyle.borderTop) || 0;
  let borderBottom = parseFloat(computedStyle.borderBottom) || 0;
  // NOTE Must fall back to boundingClientRect because el is sometimes inline element (and clientWidth returns 0 on those).
  let paddingBoxWidth = el.clientWidth || rect.width - borderLeft - borderRight; // clientWidth is preferred to account for scrollbars automatically
  let paddingBoxHeight = el.clientHeight || rect.height - borderTop - borderBottom; // clientHeight is preferred to account for scrollbars automatically
  return {
    width: paddingBoxWidth - paddingLeft - paddingRight,
    height: paddingBoxHeight - paddingTop - paddingBottom,
  };
}

function useElementSizeEvent(onObserve, { interval = INTERVAL_DEBOUNCE } = {}) {
  const currentValuesRef = useRef();

  const onObserveMaybeDebounced = useMemo(
    () => {
      let fn = (...args) => currentValuesRef.current.onObserve?.(...args);
      // "interval" is initial only
      return interval > 0 ? UtilsFunction.debounce(fn, interval) : fn;
    },
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
    [],
  );

  currentValuesRef.current = { onObserve, onObserveMaybeDebounced };

  let observerRef = useRef();
  let ref = useRef((el) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = undefined;
      currentValuesRef.current.onObserveMaybeDebounced.clear?.();
    }
    if (el) {
      if (el instanceof HTMLElement) {
        if (typeof ResizeObserver !== "undefined") {
          observerRef.current = new ResizeObserver((entries) => {
            let { borderBoxSize, contentBoxSize } = entries[entries.length - 1] || {};
            if (!borderBoxSize?.length) return;
            const { onObserveMaybeDebounced } = currentValuesRef.current;
            onObserveMaybeDebounced({
              width: borderBoxSize[0].inlineSize,
              height: borderBoxSize[0].blockSize,
              contentWidth: contentBoxSize[0].inlineSize,
              contentHeight: contentBoxSize[0].blockSize,
            });
          });
          observerRef.current.observe(el, { box: "border-box" }); // observe changes in border-box size
        }

        // initial setting of element => observe immediately, not debounced
        let rect = el.getBoundingClientRect();
        let contentRect = getContentBoxSize(el, rect);
        currentValuesRef.current.onObserve?.({
          width: rect.width,
          height: rect.height,
          contentWidth: contentRect.width,
          contentHeight: contentRect.height,
          initialSize: true,
        });
      } else if (process.env.NODE_ENV !== "production") {
        console.warn(
          "Hook useElementSize/useElementSizeEvent returns 'ref' which must be passed to a DOM element, not to a component. " +
            "The hook won't work correctly.",
        );
      }
    }
  }).current;
  return { ref };
}

export { useElementSizeEvent };
export default useElementSizeEvent;
