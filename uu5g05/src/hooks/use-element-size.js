import { useState } from "./react-hooks.js";
import useElementSizeEvent from "./use-element-size-event.js";
import UtilsDom from "../utils/dom.js";
import UtilsObject from "../utils/object.js";

function useElementSize({ width, height, contentWidth, contentHeight, interval } = {}) {
  const [sizes, setSizes] = useState({ width, height, contentWidth, contentHeight });

  const [onObserve] = useState(() => {
    const updateSizes = (newSizes) => {
      setSizes((curSizes) => (UtilsObject.shallowEqual(curSizes, newSizes) ? curSizes : newSizes));
    };
    let updateAfterResize = (newSizes) => {
      // for React 18+ use flushSync so that there's no additional visual delay between resize event and our state update
      // https://github.com/facebook/react/issues/24331
      UtilsDom.flushSync(() => {
        updateSizes(newSizes);
      });
    };
    return (newSizes) => {
      const { initialSize, ...newSizesRest } = newSizes;
      if (initialSize) {
        updateSizes(newSizesRest); // without React flush (because we're likely in ref-setting phase)
      } else {
        updateAfterResize(newSizesRest);
      }
    };
  });

  const { ref } = useElementSizeEvent(onObserve, { interval });

  return { ref, ...sizes };
}

export { useElementSize };
export default useElementSize;
