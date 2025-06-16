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

import { useState, useLayoutEffect, useRef, useMemo } from "./react-hooks.js";
import { usePreviousValue } from "./use-previous-value.js";
import EventManager from "../utils/event-manager.js";
import { useDeviceContext } from "../contexts/device-context.js";
import DeviceProvider from "../providers/device-provider.js";

const INITIAL = {};

function useLazyProperty(obj, propName, accessor) {
  let firstAccessorRef = useRef(accessor);
  if (firstAccessorRef.current !== accessor) {
    throw new Error("Invalid usage of useLazyProperty hook - 'accessor' cannot be changed.");
  }
  let firstPropNameRef = useRef(propName);
  if (firstPropNameRef.current !== propName) {
    throw new Error("Invalid usage of useLazyProperty hook - 'propName' cannot be changed.");
  }

  let directValue = obj[propName];
  let [storedValue, setStoredValue] = useState(INITIAL);

  let accessedRef = useRef(false);
  let accessed = accessedRef.current;
  let prevAccessed = usePreviousValue(accessed);
  if (accessed) {
    if (storedValue === INITIAL && (!prevAccessed || directValue === undefined)) {
      setStoredValue(accessor.getImmediateValue());
    }
  }
  useLayoutEffect(() => {
    if (accessedRef.current) {
      let stopTrackingFn = accessor.startTracking((newValue) => setStoredValue(newValue));
      if (!stopTrackingFn) {
        throw new Error("Invalid usage of useLazyProperty hook. 'startTracking' function must return stopTracking fn.");
      }
      return stopTrackingFn;
    }
  });

  let immediateValueRef = useRef();
  let result = useMemo(() => {
    let directValue = obj[propName];

    let result;
    // NOTE If has directValue && !accessed then we still need to defineProperty so that we start tracking
    // the value if it gets accessed (and later directValue might disappear).
    if (accessed && directValue !== undefined) {
      result = obj;
    } else if (accessed) {
      result = Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
      result[propName] = storedValue;
    } else {
      result = Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
      delete result[propName];
      Object.defineProperty(result, propName, {
        get() {
          if (!accessedRef.current) {
            immediateValueRef.current = directValue !== undefined ? directValue : accessor.getImmediateValue();
          }
          accessedRef.current = true;
          return immediateValueRef.current;
        },
      });
    }
    return result;
  }, [accessed, accessor, obj, propName, storedValue]);
  return result;
}

const orientationAccessor = {
  getImmediateValue() {
    let type = (screen.orientation || {}).type || screen.mozOrientation || screen.msOrientation;
    if (typeof type !== "string") type = undefined;
    if (!type && window.matchMedia) {
      type = matchMedia("(orientation: portrait)").matches ? "portrait-primary" : "landscape-primary";
    } else if (!type) {
      type = screen.availHeight < screen.availWidth ? "landscape-primary" : "portrait-primary";
    }
    return type;
  },
  startTracking(onChange) {
    let listenerFn = (value) => onChange(value || orientationAccessor.getImmediateValue());
    EventManager.register("orientation", listenerFn);
    return () => EventManager.unregister("orientation", listenerFn);
  },
};

function useDevice() {
  let contextValue = useDeviceContext();
  let value = contextValue || DeviceProvider.device;
  let result = useLazyProperty(value, "orientation", orientationAccessor);
  return result;
}

export { useDevice };
export default useDevice;
