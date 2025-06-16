//@@viewOn:imports
import { useState, useLayoutEffect } from "uu5g05";
//@@viewOff:imports

function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(window.visualViewport.height);

  useLayoutEffect(() => {
    function handleResize() {
      setViewportHeight(window.visualViewport.height);
    }

    window.visualViewport.addEventListener("resize", handleResize);

    return () => {
      window.visualViewport.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    viewportHeight,
    bottomOffset: Math.ceil(window.innerHeight - viewportHeight - visualViewport.offsetTop),
  };
}

export { useViewportHeight };
export default useViewportHeight;
