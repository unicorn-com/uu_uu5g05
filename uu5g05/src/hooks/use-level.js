import { makeHookOverridable } from "../_internal/uu5g04-integration-helpers.js";
import { useLevelContext } from "../contexts/level-context.js";

let useLevel = () => {
  let contextValue = useLevelContext();
  let level = contextValue.level ?? null;
  let setLevel = contextValue.setLevel;

  // uu5g04 support
  if (useLevel._uu5g04Integrate) {
    [level, setLevel] = useLevel._uu5g04Integrate(contextValue, level, setLevel);
  }

  return [level, setLevel];
};

// TODO After releasing uu5g04 >= 1.58.13 and letting on-premises adopt it, we can remove `makeHookOverridable`
// as the newer uu5g04 no longer uses hook._override API.
// uu5g04 support; must be done here so that if g04 is loaded and does override, then other g05 hooks would use it too
useLevel = makeHookOverridable(useLevel);

export { useLevel };
export default useLevel;
