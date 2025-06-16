import { useLayoutEffect, useMemo, useState, useElementSize, useRef } from "uu5g05";

function useScrollbarWidth() {
  const [verticalWidth, setVerticalWidth] = useState(0);
  const [horizontalWidth, setHorizontalWidth] = useState(0);

  const { ref, width, height } = useElementSize();

  const elementRef = useRef();

  useLayoutEffect(() => {
    if (elementRef.current) {
      setVerticalWidth(elementRef.current.offsetWidth - elementRef.current.clientWidth);
      setHorizontalWidth(elementRef.current.offsetHeight - elementRef.current.clientHeight);
    }
  }, [height, horizontalWidth, verticalWidth, width]);

  let api = useMemo(
    () => ({ elementRef: elementRef, elementSizeRef: ref, verticalWidth, horizontalWidth }),
    [horizontalWidth, ref, verticalWidth],
  );

  return api;
}

export { useScrollbarWidth };
export default useScrollbarWidth;
