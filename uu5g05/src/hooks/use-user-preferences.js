import { useUserPreferencesContext } from "../contexts/user-preferences-context.js";
import { useRef } from "./react-hooks.js";

function useUserPreferences(key = undefined) {
  const keyRef = useRef(key);
  if (key !== keyRef.current) {
    throw new Error("Invalid usage of useUserPreferences(key) - the `key` must be constant.");
  }

  // TODO React 19 - use 2 contexts with `use` API conditionally so that components changing customData do not cause
  // re-render of components reading standard preferences (timeZone, ...) and vice versa.
  const { userPreferences, setUserPreferences, getCustomData } = useUserPreferencesContext();
  return key ? getCustomData(key) : [userPreferences, setUserPreferences];
}

export { useUserPreferences };
export default useUserPreferences;
