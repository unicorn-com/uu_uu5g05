//@@viewOn:imports
import { useRef, useEffect, useState, useMemo } from "./react-hooks.js";
import Config from "../config/config.js";
import LoggerFactory from "../utils/logger-factory.js";
//@@viewOff:imports

let idCounter = 0;

let logger;
function getLogger() {
  if (!logger) logger = LoggerFactory.get(Config.TAG + "useWorker");
  return logger;
}

function createWorker(fn, initOptions) {
  let workerString = `
let fn = (${fn});
onmessage = async (e) => {
  let { args, initData, importList } = e.data;
  let operationPort = e.ports[0];
  let data, state, error;
  try {
    if (Array.isArray(importList)) importScripts(...importList);
    if (initData != null) {
      fn = await fn(initData);
      if (typeof fn !== "function") throw new Error("You're using useWorker(fn, { initData }), so 'fn' function must return executor function, but it returned type: " + (typeof fn));
    }
    let scope = {
      progress: (data) => operationPort.postMessage({ type: "progress", data }),
    };
    data = await fn.apply(scope, args);
    state = "ready";
  } catch (e) {
    state = "error";
    error = { ...e, message: e.message, stack: e.stack };
  }
  operationPort.postMessage({ type: "completed", data, state, error });
  operationPort.close();
};
`;
  let workerBlob = new Blob([workerString], { type: "application/javascript" });
  let workerUrl = URL.createObjectURL(workerBlob);
  return new Worker(workerUrl);
}

function initWorkerCall(fn, initOptions) {
  let { importList, initData } = initOptions;
  let worker = createWorker(fn);
  let isFirstCall = true;
  let callWithOptions = (options, ...args) => {
    let { onProgress } = options;
    let operationChannel = new MessageChannel();
    let workerDtoIn = isFirstCall ? { initData, importList, args } : { args };
    isFirstCall = false;
    worker.postMessage(workerDtoIn, [operationChannel.port2]);
    return new Promise((resolve, reject) => {
      operationChannel.port1.onmessage = (e) => {
        const { type, state, data, error } = e.data;
        if (type === "completed") {
          if (state === "error") {
            let finalError = new Error(error.message);
            Object.assign(finalError, error);
            reject(finalError);
          } else {
            resolve(data);
          }
          operationChannel.port1.close();
        } else if (type === "progress") {
          onProgress?.(data);
        }
      };
    });
  };
  return { worker, callWithOptions };
}

function toState(state, data) {
  return data == null ? state + "NoData" : state;
}

function useWorker(fn, initOptions = {}) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line uu5/hooks-rules
    let lastFnRef = useRef({ fn, warned: false });
    if (lastFnRef.current.fn !== fn && !lastFnRef.current.warned) {
      lastFnRef.current.warned = true;
      getLogger().error(
        "When using useWorker(fn), the 'fn' reference must not change. Define the 'fn' function in the outer scope, not directly in render method.",
        { fn },
      );
    }
  }

  let workerInfoRef = useRef();
  useEffect(() => {
    return () => workerInfoRef.current?.worker.terminate();
  }, []);

  let [callState, setCallState] = useState({ state: "readyNoData", data: null, errorData: null, pendingData: null });
  let call = useRef(async (...args) => {
    workerInfoRef.current ??= initWorkerCall(fn, initOptions);
    let { callWithOptions } = workerInfoRef.current;

    let id = idCounter++;
    let pendingData = { args, data: null };
    setCallState((v) => ({ ...v, id, state: toState("pending", v.data), pendingData }));
    try {
      let data = await callWithOptions(
        {
          onProgress: (data) =>
            setCallState((v) => (v.id === id ? { ...v, pendingData: { ...pendingData, data } } : v)),
        },
        ...args,
      );

      setCallState((v) =>
        v.id === id ? { id, state: toState("ready", data), data, errorData: null, pendingData: null } : v,
      );
      return data;
    } catch (e) {
      setCallState((v) =>
        v.id === id
          ? { id, state: toState("error", null), data: null, errorData: { error: e, args }, pendingData: null }
          : v,
      );
      throw e;
    }
  }).current;

  let { data, errorData, pendingData, state } = callState;
  let api = useMemo(() => ({ call, data, state, errorData, pendingData }), [call, data, errorData, pendingData, state]);
  return api;
}

export { useWorker };
export default useWorker;
