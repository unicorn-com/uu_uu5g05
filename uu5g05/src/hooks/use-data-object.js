import { useState, useEffect, useRef, useLayoutEffect } from "./react-hooks.js";
import usePreviousValue from "./use-previous-value.js";
import useMemoObject from "./use-memo-object.js";
import UtilsObject from "../utils/object.js";
import Tools from "../_internal/tools.js";
import useWaitForRerender from "../_internal/use-wait-for-rerender.js";
import useAccessPolicyErrorRecovery from "../_internal/use-access-policy-error-recovery.js";

const PENDING = "pending";
const READY = "ready";
const ERROR = "error";
const PENDING_NO_DATA = "pendingNoData";
const READY_NO_DATA = "readyNoData";
const ERROR_NO_DATA = "errorNoData";

const SET_DATA_IDENTITY = (data) => data;
const FIRST_LOAD_FLAG = {};
const EMPTY_ARRAY = [];

function isDataDeleteResult(data, isEmptyDataSameAsDelete) {
  // treat data containing { uuAppErrorMap: { ...emptyOrNonError } } as "successful delete operation"
  let result = false;
  if (data && typeof data === "object" && !(data instanceof Error)) {
    let keyCount = Object.keys(data).length;
    if (keyCount === 0) {
      result = isEmptyDataSameAsDelete;
    } else if (keyCount === 1) {
      let { uuAppErrorMap } = data;
      if (
        uuAppErrorMap &&
        typeof uuAppErrorMap === "object" &&
        Object.keys(uuAppErrorMap).every((k) => uuAppErrorMap[k]?.type !== "error")
      ) {
        result = true;
      }
    }
  }
  return result;
}

function initHandler(operation, setFullState, currentValuesRef, waitForRerender) {
  // !!! Do not read anything in this scope (besides "operation"), otherwise handlerMap values (see below)
  // will have stale values. Read anything in handlerFn.
  let handlerFn;
  if (operation === "setData") {
    handlerFn = (newData) => {
      let onCall = currentValuesRef.current.paramHandlerMap[operation];
      if (typeof onCall !== "function") onCall = SET_DATA_IDENTITY;
      let newTransformedData = onCall(newData);
      let newFullState = {
        state: newTransformedData != null ? READY : READY_NO_DATA,
        data: newTransformedData,
        errorData: null,
        pendingData: null,
      };
      setFullState(newFullState);
      currentValuesRef.current.expectedStateForOperationCheck = newFullState;
    };
  } else {
    handlerFn = async (...callArgs) => {
      const onCall = currentValuesRef.current.paramHandlerMap[operation];
      let isFirstLoad = callArgs[0] === FIRST_LOAD_FLAG;
      if (isFirstLoad) callArgs = callArgs.slice(1);

      // NOTE We want the handler to properly start & finish even if running during/after unmount (to be consistent with useDataList
      // where it's used by uuEcc - when session logs out and app route gets unmounted, they want to store the content with fallback to localStorage,
      // i.e. awaiting handlerMap.xyz() must not get stuck).
      // NOTE We need to do preconditions check, i.e. to not do the operation if another operation is already running. But we want
      // that check to not be done as part of React batched setState(updaterFn) because that would postpone the start of the actual fetch() by another
      // render (which can take several hunderd milliseconds if e.g. rendering a complex Table with cell-based pending indicators). Therefore we
      // store expected (optimistic) fullState into a ref and do the check against this one.
      if (!isFirstLoad && currentValuesRef.current.rendered) {
        let { fullState, expectedStateForOperationCheck = fullState } = currentValuesRef.current;
        if (
          expectedStateForOperationCheck.state === PENDING ||
          expectedStateForOperationCheck.state === PENDING_NO_DATA
        ) {
          let callPreconditionsError = new Error(
            `Operation '${operation}' is not allowed when in '${PENDING}' or '${PENDING_NO_DATA}' state.`,
          );
          throw callPreconditionsError;
        }
        let reducer = (fullState) => {
          let result = fullState;
          let newPartialState = {
            state: fullState.data != null ? PENDING : PENDING_NO_DATA,
            pendingData: { operation, dtoIn: callArgs[0] },
          };
          result = { ...fullState, ...newPartialState };
          return result;
        };
        currentValuesRef.current.expectedStateForOperationCheck = reducer(expectedStateForOperationCheck);
        setFullState(reducer);
      }

      let data;
      try {
        let dataPromise = typeof onCall === "function" ? onCall(...callArgs) : null;
        currentValuesRef.current.abort = typeof dataPromise?.abort === "function" ? dataPromise.abort : null;
        data = dataPromise ? await dataPromise : null;
        if (typeof data === "function") {
          data = data(currentValuesRef.current.fullState.data);
        }
      } catch (error) {
        if (currentValuesRef.current.rendered) {
          error.dtoIn ??= callArgs[0];
          setFullState((fullState) => ({
            ...fullState,
            state: fullState.data != null ? ERROR : ERROR_NO_DATA,
            pendingData: null,
            errorData: { operation, dtoIn: callArgs[0], error, data: error?.dtoOut },
          }));
        }
        throw error;
      }
      // treat data containing { uuAppErrorMap: {} } as if it was null (e.g. delete was successful)
      if (isDataDeleteResult(data, false)) {
        data = null;
      }
      if (currentValuesRef.current.rendered) {
        await waitForRerender(() => {
          setFullState({ state: data != null ? READY : READY_NO_DATA, data, pendingData: null, errorData: null });
        });
      }
      return data;
    };
  }
  return handlerFn;
}

function useDataObject(
  {
    initialData,
    initialDtoIn,
    skipInitialLoad = false,
    handlerMap: paramHandlerMap = {},
    skipAbortOnUnmount = false,
  } = {},
  loadDependencies = undefined,
) {
  let waitForRerender = useWaitForRerender();
  let [fullState, setFullState] = useState(() => ({
    state:
      skipInitialLoad || initialData !== undefined
        ? initialData != null
          ? READY
          : READY_NO_DATA
        : typeof paramHandlerMap.load === "function"
          ? PENDING_NO_DATA
          : READY_NO_DATA,
    data: initialData !== undefined ? initialData : null,
    errorData: null,
    pendingData:
      skipInitialLoad || initialData !== undefined
        ? null
        : typeof paramHandlerMap.load === "function"
          ? { operation: "load", dtoIn: initialDtoIn }
          : null,
  }));

  let currentValuesRef = useRef({ rendered: true, abort: null });
  currentValuesRef.current = {
    ...currentValuesRef.current,
    paramHandlerMap,
    fullState,
    skipAbortOnUnmount,
    expectedStateForOperationCheck: fullState,
  };
  useLayoutEffect(
    () => () => {
      currentValuesRef.current.rendered = false;
    },
    [],
  );

  // NOTE The requirement is to change values in handlerMap as infrequently as possible. Therefore
  // initHandler(name, ...) is called only if there was no handler in "paramHandlerMap[name]" before
  // and the resulting fn will take paramHandlerMap[name] at the time of its execution, not during initHandler() call.
  // Thanks to that we can reuse the same resulting fn even if paramHandlerMap[name] changes between re-renders.
  let fullHandlerMap = {};
  let prevHandlerMap = usePreviousValue(fullHandlerMap, {});
  for (let k in paramHandlerMap) {
    fullHandlerMap[k] = prevHandlerMap[k] || initHandler(k, setFullState, currentValuesRef, waitForRerender);
  }
  if (!fullHandlerMap.setData) {
    fullHandlerMap.setData =
      prevHandlerMap["setData"] || initHandler("setData", setFullState, currentValuesRef, waitForRerender);
  }
  let handlerMap;
  if (fullState.state === PENDING || fullState.state === PENDING_NO_DATA) {
    handlerMap = {};
  } else {
    handlerMap = fullHandlerMap;
  }
  handlerMap = useMemoObject(handlerMap, UtilsObject.shallowEqual);

  loadDependencies ||= EMPTY_ARRAY;
  const committedLoadRef = useRef();
  if (committedLoadRef.current === undefined) {
    committedLoadRef.current = !skipInitialLoad && initialData === undefined ? null : loadDependencies;
  }
  let committedLoad = committedLoadRef.current;
  useEffect(() => {
    let needsReload = !committedLoad || !UtilsObject.shallowEqual(committedLoad, loadDependencies);
    let isFirstLoad = !committedLoad;
    if (
      needsReload &&
      typeof paramHandlerMap.load === "function" &&
      (isFirstLoad || (fullState.state !== PENDING && fullState.state !== PENDING_NO_DATA))
    ) {
      committedLoadRef.current = loadDependencies;
      let loadResult = isFirstLoad
        ? fullHandlerMap.load(FIRST_LOAD_FLAG, initialDtoIn)
        : fullHandlerMap.load(initialDtoIn);
      loadResult.catch((e) => Tools.error("Loading data failed:", e));
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [loadDependencies, committedLoad, fullState.state, paramHandlerMap.load]);

  useEffect(() => {
    return () => {
      let { abort, skipAbortOnUnmount } = currentValuesRef.current;
      if (!skipAbortOnUnmount && abort) abort();
    };
  }, []);

  useAccessPolicyErrorRecovery({ errorData: fullState.errorData, handlerMap });

  const result = useMemoObject({ ...fullState, handlerMap }, UtilsObject.shallowEqual);
  return result;
}

export { useDataObject, isDataDeleteResult };
export default useDataObject;
