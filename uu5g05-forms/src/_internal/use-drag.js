import Config from "../config/config.js";

const { Utils, useEffect, useRef, useLayoutEffect } = require("uu5g05");

function useDrag({ onDragStart, onDragging, onDragEnd }) {
  const dragInfoRef = useRef({});

  const currentValuesRef = useRef();
  useLayoutEffect(() => {
    currentValuesRef.current = { onDragStart, onDragging, onDragEnd };
  });

  const listenersRef = useRef([]);
  function cleanupListeners() {
    for (let cleanupFn of listenersRef.current) cleanupFn();
    listenersRef.current = [];
  }
  useEffect(() => () => cleanupListeners(), []);

  function handlePointerDown(e) {
    const element = e.currentTarget;

    function getPosition(e) {
      return { pageX: e.pageX, pageY: e.pageY };
    }
    function callCallback(callback, e) {
      const curPosition = getPosition(e);
      let dx = curPosition.pageX - dragInfoRef.current.startPosition.pageX;
      let dy = curPosition.pageY - dragInfoRef.current.startPosition.pageY;
      callback?.(new Utils.Event({ dx, dy, startPosition: dragInfoRef.current.startPosition, element }, e));
    }
    function handlePointerMove(e) {
      const { onDragging } = currentValuesRef.current;
      callCallback(onDragging, e);
    }
    function handlePointerUp(e) {
      e.preventDefault();
      e.stopPropagation();
      const { onDragEnd } = currentValuesRef.current;
      callCallback(onDragEnd, e);
      cleanupListeners();
    }
    e.preventDefault();
    e.stopPropagation();

    dragInfoRef.current = { startPosition: getPosition(e) };
    const { onDragStart } = currentValuesRef.current;
    callCallback(onDragStart, e);

    window.addEventListener("pointermove", handlePointerMove);
    listenersRef.current.push(() => window.removeEventListener("pointermove", handlePointerMove));
    window.addEventListener("pointerup", handlePointerUp);
    listenersRef.current.push(() => window.removeEventListener("pointerup", handlePointerUp));
  }

  const elementAttrs = {
    onPointerDown: handlePointerDown,
  };
  return {
    elementAttrs,
    className: Config.Css.css({ touchAction: "none" }),
  };
}

export { useDrag };
export default useDrag;
