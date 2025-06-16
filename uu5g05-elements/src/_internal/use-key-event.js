import { useEffect, useEvent, useRef } from "uu5g05";

function useKeyEvent(type, keys, handler, element = window) {
  const eventListenerRef = useRef();
  useEffect(() => {
    eventListenerRef.current = (event) => {
      if (Array.isArray(keys) ? keys.includes(event.key) : keys === event.key) {
        handler(event);
      }
    };
  }, [keys, handler]);

  useEvent(type, eventListenerRef.current, element);
}

export default useKeyEvent;
