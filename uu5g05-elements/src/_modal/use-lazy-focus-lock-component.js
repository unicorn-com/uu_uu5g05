//@@viewOn:imports
import { useState, usePreviousValue, useEffect } from "uu5g05";
//@@viewOff:imports

let FocusLockComponent;
let focusLockComponentPromise;

function EmptyFocusLockComponent(props) {
  return props.children({});
}

function useLazyFocusLockComponent(open) {
  // lazy-load internal FocusLock component
  // NOTE It's possible that if developer opens 1st Modal very fast, focus locking won't be loaded yet and thus
  // won't work, but that is fine for us.
  // NOTE We also don't want to change the component reference while Modal is open (i.e. if at the beggining
  // it wasn't available then after becoming available don't re-mount the modal content) => store it in state
  // and update it only when open changes from false to true.
  let [UsedFocusLockComponent, setUsedFocusLockComponent] = useState(() => FocusLockComponent);
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line uu5/hooks-rules
    useEffect(() => {
      if (!focusLockComponentPromise) {
        focusLockComponentPromise = (async () => {
          FocusLockComponent = (await import("./focus-lock.js")).default;
        })();
      }
    }, []);
    // eslint-disable-next-line uu5/hooks-rules
    const prevOpen = usePreviousValue(open, false);
    if (open && !prevOpen && FocusLockComponent !== UsedFocusLockComponent) {
      UsedFocusLockComponent = FocusLockComponent;
      setUsedFocusLockComponent(() => UsedFocusLockComponent);
    }
  }
  return UsedFocusLockComponent || EmptyFocusLockComponent;
}

export default useLazyFocusLockComponent;
