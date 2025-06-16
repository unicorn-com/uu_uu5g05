import { useLayoutEffect, useState } from "../hooks/react-hooks.js";
import useActive from "./use-active.js";
import useEvent from "../hooks/use-event.js";

const EVENT_ACTIVE_CHANGE = "Uu5.useActivePublisher.activeChange";

const activeAreaGlobalState = {};
let counter = 0;

// useActivePublisher - publishes information that toolbar / other component (which shouldn't cause onBlur for others such as richtext) is active
function useActivePublisher() {
  const [id] = useState(() => "publisher-" + counter++);
  const triggerActiveChange = useEvent(EVENT_ACTIVE_CHANGE);
  const { elementAttrs } = useActive({
    // id, // for debugging only
    onActivation: () => {
      activeAreaGlobalState[id] = true;
      // console.log(id + " onActivation", { ...activeAreaGlobalState });
      triggerActiveChange({ data: { ...activeAreaGlobalState } });
    },
    onDeactivation: () => {
      if (activeAreaGlobalState[id]) {
        delete activeAreaGlobalState[id];
        // console.log(id + " onDeactivation", { ...activeAreaGlobalState });
        triggerActiveChange({ data: { ...activeAreaGlobalState } });
      }
    },
  });
  useLayoutEffect(
    () => () => {
      if (activeAreaGlobalState[id]) {
        delete activeAreaGlobalState[id];
        triggerActiveChange({ data: { ...activeAreaGlobalState } });
      }
    },
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
    [],
  );

  return elementAttrs;
}

export { useActivePublisher, EVENT_ACTIVE_CHANGE };
export default useActivePublisher;
