/**
 * Copyright (C) 2021 Unicorn a.s.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License at
 * <https://gnu.org/licenses/> for more details.
 *
 * You may obtain additional information at <https://unicorn.com> or contact Unicorn a.s. at address: V Kapslovne 2767/2,
 * Praha 3, Czech Republic or at the email: info@unicorn.com.
 */
import { useLayoutEffect, useRef } from "./react-hooks.js";
import Tools from "../_internal/tools.js";
import EventManager from "../utils/event-manager.js";

// TODO maybe eventName, handler, deps, { element, ...opts }
function useEvent(eventName, handler, element, opts) {
  const handlerRef = useRef();

  let partialStack;
  if (process.env.NODE_ENV === "development") partialStack = new Error().stack.split("\n").slice(1, 5).join("\n");

  useLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  if (opts != null && typeof opts !== "object") {
    if (process.env.NODE_ENV !== "production") {
      Tools.warning(
        "You have passed non-object as options into useEvent(name, fn, ref, options) - that is not supported. Options will be ignored.",
      );
    }
    opts = undefined;
  }
  let optsStr = opts ? JSON.stringify(opts) : undefined;
  useLayoutEffect(() => {
    let usedElement = element;
    if (usedElement && !(usedElement instanceof Element)) {
      // NOTE Support for ref-s is actually only for cases when React doesn't recognize onXyz prop.
      // For other cases with ref-s developers should just define onXyz on the element with ref instead of using useEvent.
      if (typeof usedElement === "object" && "current" in usedElement) {
        usedElement = usedElement.current;
        if (process.env.NODE_ENV === "development" && usedElement === undefined) {
          Tools.warning(
            `You have passed element ref to useEvent(name, fn, ref) but the ref remained unset. This is supported only if ref is filled up during mount, not later. You either forgot to pass the ref onto a DOM element or you're passing a ref from parent component (this isn't supported due to React's ordering of mount operations). Call stack:\n${partialStack}`,
          );
        }
      }
      if (!usedElement) return;
      if (typeof usedElement.addEventListener !== "function") {
        if (process.env.NODE_ENV === "development") {
          Tools.warning(
            `You have passed unsupported element '${element}' to useEvent(name, fn, element). You can use DOM object (e.g. window), React ref or leave element out (for custom events). Call stack:\n${partialStack}`,
          );
        }
        return;
      }
    }

    const opts = optsStr ? JSON.parse(optsStr) : undefined;
    const eventListener = (...args) => handlerRef.current?.(...args);
    EventManager.register(eventName, eventListener, usedElement, opts);
    return () => EventManager.unregister(eventName, eventListener, usedElement, opts);
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [eventName, element, optsStr]);

  if (!element) {
    return (...args) => EventManager.trigger(eventName, ...args);
  }
}

export { useEvent };
export default useEvent;
