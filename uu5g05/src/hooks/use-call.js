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
import { useReducer, useMemo, useRef } from "./react-hooks.js";
import useUnmountedRef from "./use-unmounted-ref.js";

function callReducer(state, [type, payload]) {
  let result = state;
  switch (type) {
    case "callStart": {
      result = { id: payload.id, viewState: "pending", data: state.data, error: state.error };
      break;
    }
    case "callEnd": {
      let { id, success, data } = payload;
      if (id === state.id) {
        if (success) {
          result = { id, viewState: "ready", data: data === undefined ? null : data, error: null };
        } else {
          result = { id, viewState: "error", data: state.data ?? null, error: data === undefined ? null : data };
        }
      }
      break;
    }
  }
  return result;
}

const INIT_VALUE = { viewState: "ready", error: undefined, data: undefined };

function useCall(callFn) {
  // initialize state with processBus and state reducer(s)
  let [state, dispatchAction] = useReducer(callReducer, INIT_VALUE);
  let unmountedRef = useUnmountedRef();

  let currentValuesRef = useRef();
  currentValuesRef.current = { callFn };
  let call = useRef(async (...callArgs) => {
    let { callFn } = currentValuesRef.current;

    let result = null;
    if (typeof callFn === "function") {
      let id = "c" + useCall._idCounter++;
      dispatchAction(["callStart", { id }]);
      let data, success;
      try {
        data = await callFn(...callArgs);
        success = true;
      } catch (e) {
        data = e;
      }
      if (!unmountedRef.current) dispatchAction(["callEnd", { id, success, data }]);
      result = success ? data : Promise.reject(data);
    }
    return result;
  }).current;

  let { viewState, data, error } = state;
  let api = useMemo(
    () => ({
      state: data == null ? viewState + "NoData" : viewState,
      data,
      errorData: error === undefined ? undefined : error != null ? { error } : null,
      call,
    }),
    [call, viewState, data, error],
  );

  return api;
}

useCall._idCounter = 0;

export { useCall };
export default useCall;
