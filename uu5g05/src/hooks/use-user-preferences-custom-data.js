/**
 * Copyright (C) 2024 Unicorn a.s.
 *
 * This program is free software; you can use it under the terms of the UAF Open License v01 or
 * any later version. The text of the license is available in the file LICENSE or at www.unicorn.com.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See LICENSE for more details.
 *
 * You may contact Unicorn a.s. at address: V Kapslovne 2767/2, Praha 3, Czech Republic or
 * at the email: info@unicorn.com.
 */

//@@viewOn:imports
import Config from "../config/config.js";
import { useState, useRef, useCallback } from "../hooks/react-hooks.js";
import UtilsObject from "../utils/object.js";
import { isDataDeleteResult } from "./use-data-object.js";
//@@viewOff:imports

const LOCAL_STORAGE_HANDLER_MAP = {
  load({ key }) {
    try {
      let result = localStorage?.getItem(Config.USER_PREFERENCES_LOCAL_STORAGE_PREFIX + key);
      return result ? JSON.parse(result) : null;
    } catch (e) {
      // remove item in case that it had unparsable value
      localStorage?.removeItem(Config.USER_PREFERENCES_LOCAL_STORAGE_PREFIX + key);
    }
  },
  replace({ key, data }) {
    try {
      if (data == null) localStorage?.removeItem(Config.USER_PREFERENCES_LOCAL_STORAGE_PREFIX + key);
      else localStorage?.setItem(Config.USER_PREFERENCES_LOCAL_STORAGE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      // ignore (maybe the storage is full)
    }
    return data;
  },
};

function toState(state, data) {
  return data != null ? state : state + "NoData";
}

function useUserPreferencesCustomData(handlerMap = LOCAL_STORAGE_HANDLER_MAP) {
  const fullStateRef = useRef({}); // handlers need immediate data => read it from ref
  const [customData, setCustomData] = useState({});
  const handlerMapRef = useRef({});
  handlerMapRef.current = handlerMap;

  const initCustomDataKeyRef = useRef((key) => {
    // NOTE This function is called in render phase and can be called from multiple locations within single render.
    // We cannot use setState(...) here. Instead, we prepare initial dataObject in fullState[key] and call initial load()
    // as microtask.

    // NOTE Below, use fullState instead of fullStateRef.current so that if we do clearCustomData(),
    // the unfinished requests will modify the old instance instead of current (cleared) one.
    const fullState = fullStateRef.current;
    let fullKeyState = fullState[key];
    if (!fullKeyState) {
      function setPartialDataObject(newPartialDataObject) {
        let curPartialDataObject = fullState[key].partialDataObject; // without "handlerMap" key
        newPartialDataObject =
          typeof newPartialDataObject === "function"
            ? newPartialDataObject(curPartialDataObject)
            : newPartialDataObject;
        // fullState === fullStateRef.current <=> state was not cleared in the mean time
        if (fullState === fullStateRef.current && !UtilsObject.deepEqual(newPartialDataObject, curPartialDataObject)) {
          let dataObject = { ...newPartialDataObject, handlerMap: fullState[key].handlerMap };
          if (dataObject.pendingData) dataObject.handlerMap = {};

          Object.assign(fullState[key], {
            partialDataObject: newPartialDataObject,
            dataObject,
          });
          setCustomData((cur) => ({ ...cur, [key]: dataObject }));
        }
      }
      function getPartialDataObject() {
        return fullState[key].partialDataObject;
      }

      function createAsyncHandler(handlerName) {
        return async (handlerCallArgs, { optimisticData, fallbackHandler } = {}) => {
          if (optimisticData === undefined) {
            setPartialDataObject((curState) => ({
              ...curState,
              state: toState("pending", curState.data),
              pendingData: { operation: handlerName, dtoIn: handlerCallArgs[0] },
            }));
          } else {
            setPartialDataObject((curState) => ({
              state: toState("ready", optimisticData),
              data: optimisticData ?? null,
              pendingData: null,
              erorrData: null,
            }));
          }
          try {
            let handler = handlerMapRef.current?.[handlerName];
            let result;
            if (handler) result = handler(...handlerCallArgs);
            else if (fallbackHandler) result = fallbackHandler(...handlerCallArgs);
            let data = typeof result?.then === "function" ? await result : result;
            if (typeof data === "function") data = data(getPartialDataObject().data);
            if (isDataDeleteResult(data, false)) data = null;
            setPartialDataObject((curState) => ({
              state: toState("ready", data),
              data: data ?? null,
              pendingData: null,
              erorrData: null,
            }));
            return data;
          } catch (error) {
            setPartialDataObject((curState) => ({
              ...curState,
              state: toState("error", curState.data),
              pendingData: null,
              errorData: { error, data: error?.dtoOut },
            }));
            throw error;
          }
        };
      }

      const load = createAsyncHandler("load");
      const replace = createAsyncHandler("replace");
      const update = createAsyncHandler("update");
      fullKeyState = {
        // partial data object is without handlerMap
        partialDataObject: {
          state: "pendingNoData",
          data: null,
          pendingData: { operation: "load", dtoIn: { key } },
          errorData: null,
        },
        handlerMap: {
          load: (...args) => load([{ key }, ...args]),
          replace: (data, ...args) => {
            return replace([{ key, data }, ...args], {
              optimisticData: data,
              // fall back to update() if entry handlerMap doesn't have replace() call
              fallbackHandler: handlerMapRef.current?.["update"],
            });
          },
          update: (data, ...args) => {
            return update([{ key, data }, ...args], {
              optimisticData: data,
              // fall back to replace() if entry handlerMap doesn't have update() call
              fallbackHandler: ({ key, data }, ...otherArgs) =>
                handlerMapRef.current?.["replace"]?.(
                  {
                    key,
                    data: { ...fullState[key]?.partialDataObject?.data, ...data },
                  },
                  ...otherArgs,
                ),
            });
          },
          setData: (data) => {
            // setData is synchronous and merely updates state (handlerMap.setData can be given but must be synchronous too)
            setPartialDataObject((curState) => {
              let setData = handlerMapRef.current?.setData;
              data = setData ? setData(data) : data;
              return {
                state: toState("ready", data),
                data: data ?? null,
                pendingData: null,
                erorrData: null,
              };
            });
          },
        },
      };
      fullKeyState.dataObject = { ...fullKeyState.partialDataObject, handlerMap: {} };

      fullState[key] = fullKeyState;
    }

    let initialLoadCalled;
    queueMicrotask(() => {
      if (initialLoadCalled) return;
      initialLoadCalled = true;
      fullKeyState.handlerMap.load();
    });

    return fullKeyState.dataObject;
  });

  const clear = useRef(() => {
    if (Object.keys(fullStateRef.current).length > 0) {
      fullStateRef.current = {};
      setCustomData({});
    }
  }).current;

  const get = useCallback(
    (key) => {
      if (key in customData) return customData[key];
      return initCustomDataKeyRef.current(key);
    },
    [customData],
  );

  return { get, clear };
}
useUserPreferencesCustomData.LOCAL_STORAGE_HANDLER_MAP = LOCAL_STORAGE_HANDLER_MAP;

export { useUserPreferencesCustomData };
export default useUserPreferencesCustomData;
