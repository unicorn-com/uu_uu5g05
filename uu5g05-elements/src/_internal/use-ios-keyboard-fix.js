import { useLayoutEffect, useState, useRef, useDevice } from "uu5g05";

function useIosKeyboardFix({ disabled } = {}) {
  const { browserName, platform } = useDevice();

  const bottomElementRef = useRef();
  const forbidReserveSafeArea = browserName === "safari" && platform === "ios" && !disabled;

  const [bottomValue, setBottomValue] = useState(0);

  useLayoutEffect(() => {
    if (forbidReserveSafeArea) {
      let timeout;
      const resizeHandler = (e) => {
        let bottomElement = bottomElementRef.current;
        if (
          bottomElement &&
          Math.round(bottomElement.getBoundingClientRect().bottom !== Math.round(window.visualViewport.height))
        ) {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            setBottomValue((prevBottomValue) => {
              return prevBottomValue + (bottomElement.getBoundingClientRect().bottom - window.visualViewport.height);
            });
          }, 400);
        }
      };

      window.visualViewport.addEventListener("resize", resizeHandler, true);
      window.addEventListener("animationend", resizeHandler, true);
      return () => {
        window.visualViewport.removeEventListener("resize", resizeHandler, true);
        window.removeEventListener("animationend", resizeHandler, true);
        clearTimeout(timeout);
      };
    }
  }, [forbidReserveSafeArea]);

  return { bottomValue, forbidReserveSafeArea, ref: bottomElementRef };
}

export { useIosKeyboardFix };
export default useIosKeyboardFix;
