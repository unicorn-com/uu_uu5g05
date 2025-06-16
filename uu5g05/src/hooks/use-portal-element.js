import Config from "../config/config.js";
import { usePortalElementContext } from "../contexts/portal-element-context.js";
import { useEffect, useRef, useState } from "../hooks/react-hooks.js";
import UtilsString from "../utils/string.js";

//@@viewOn:constants
// TODO Remove ID setting when uuEcc g04 no longer needs this (it is currently used there for focus handling).
const ID_PREFIX = "uu5-portal-";
//@@viewOff:constants

//@@viewOn:helpers
let portalsInUse = {};

function createPortalContainer(rootElement, type, onCreate) {
  portalsInUse[type] ??= 0;
  portalsInUse[type]++;
  let element;
  if (process.env.NODE_ENV !== "test") {
    element = rootElement.querySelector(`:scope>[data-uu5portaltype="${type}"]`);
  } else {
    // jsdom (nwsapi) has bug where it throws on some :scope selectors (which we are unable to simulate but we have
    // reports that for some developers it happens) => use alternative way
    // https://github.com/dperini/nwsapi/issues/4#issuecomment-778113101
    element = [...rootElement.childNodes].find((node) => node?.getAttribute?.("data-uu5portaltype") === type);
  }
  if (!element) {
    element = document.createElement("div");
    if (typeof onCreate === "function") {
      element = onCreate(element) ?? element;
    }
    if (!element.id.startsWith(ID_PREFIX)) {
      element.id = rootElement === document.body ? ID_PREFIX + type : ID_PREFIX + type + "-" + UtilsString.generateId();
    }
    element.classList.add(Config.Css.css({ position: "relative" }));
    element.dataset.uu5portaltype = type;
    element.dataset.testid = "portal";

    rootElement.appendChild(element);
  }
  return element;
}

function destroyPortalContainer(element) {
  let type = element.dataset.uu5portaltype;
  portalsInUse[type]--;
  if (portalsInUse[type] === 0) {
    element.parentNode.removeChild(element);
    delete portalsInUse[type];
  }
}
//@@viewOff:helpers

// type <=> portal type such as "alert", "modal" (only for convenience of orienting in DOM)
function usePortalElement({ type: initialType, onCreate } = {}) {
  const [type] = useState(initialType ?? (() => UtilsString.generateId()));
  let contextValue = usePortalElementContext();
  while (contextValue && contextValue.filter && !contextValue.filter({ type })) {
    contextValue = contextValue.parentValue;
  }
  let rootElement = contextValue?.element ?? document.body;
  const containerRef = useRef();
  if (!containerRef.current || containerRef.current.parentNode !== rootElement) {
    if (containerRef.current) destroyPortalContainer(containerRef.current);
    containerRef.current = createPortalContainer(rootElement, type, onCreate);
  }

  useEffect(() => {
    return () => {
      // cleanup container element with delay so that we don't interfere with portal unmounting
      // (React 16.x calls this when portal is still in DOM; React 17.x calls it later when it's not).
      setTimeout(() => destroyPortalContainer(containerRef.current), 0);
    };
  }, []);

  return containerRef.current;
}

export { usePortalElement };
export default usePortalElement;
