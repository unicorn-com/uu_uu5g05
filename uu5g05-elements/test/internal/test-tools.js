import { act } from "uu5g05-test";

function clickOnElement(element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  });
  act(() => {
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
  });
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

// https://w3c.github.io/uievents/#fixed-virtual-key-codes
const KEYS = {
  8: "Backspace",
  9: "Tab",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  46: "Delete",
};

function pressKey(element, keyCode) {
  act(() => {
    element.dispatchEvent(
      new KeyboardEvent("keydown", {
        keyCode,
        which: keyCode,
        key: KEYS[keyCode] ?? String.fromCharCode(keyCode),
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  act(() => {
    element.dispatchEvent(
      new KeyboardEvent("keyup", {
        keyCode,
        which: keyCode,
        key: KEYS[keyCode] ?? String.fromCharCode(keyCode),
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

function resetTimers() {
  // NOTE We need to run registered timers (if any) if fake timers were used, otherwise React/ReactDOM/Enzyme? gets
  // into weird state where it pretty much works except for timeouts/requestAnimationFrame occasionally (something about
  // scheduling react updates gets changed). But calling runOnlyPendingTimers() logs warning into console if timers
  // are not faked, but there is no method like "isUsingFakeTimers()" -> switch to fake timers (even if we might already
  // be using them) and then run the pending timers.
  jest.useFakeTimers();
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
}

export { clickOnElement, pressKey, resetTimers };
