import { useEffect, Utils } from "uu5g05";

function useEscEvent(fn) {
  useEffect(() => {
    if (typeof fn === "function") {
      const handleEvent = (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          e.preventDefault();
          fn(e);
        }
      };

      Utils.EventManager.register("keydown", handleEvent, window);
      return () => Utils.EventManager.unregister("keydown", handleEvent, window);
    }
  }, [!!fn]);
}

export { useEscEvent };
export default useEscEvent;
