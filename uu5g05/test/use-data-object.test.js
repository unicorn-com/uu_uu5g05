import { SessionProvider, useDataObject } from "uu5g05";
import { Test, Utils } from "uu5g05-test";
import { AuthenticationService } from "uu_appg01_oidc";
import { createRerenderableComponent } from "./internal/tools.js";

function expectedHandlerMap(handlerMap) {
  let r = {};
  for (let k in handlerMap) r[k] = handlerMap[k] ? expect.any(Function) : null;
  return r;
}

function expectedResult({
  data = expect.any(Object),
  state = expect.any(String),
  pendingData = expect.any(Object),
  errorData = expect.any(Object),
  handlerMap = expect.any(Object),
} = {}) {
  return { data, state, pendingData, errorData, handlerMap };
}

function createAccessPolicyError() {
  let error = new Error("Session is not trusted as it does not meet expected criteria.");
  Object.assign(error, {
    code: "uu-app-oidc/verifyAccessPolicy/untrustedSession",
    paramMap: {
      maxAuthenticationAge: 60,
      supportedAcrValues: ["high", "veryHigh"],
    },
  });
  return error;
}

const INITIAL_DATA1 = {
  key: "initial1",
};
const LOAD_DATA1 = {
  key: "load1",
};
const LOAD_DATA2 = {
  key: "load2",
};

describe("[uu5g04-hooks] useData behaviour", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useDataObject());
    expect(result.current).toEqual({
      data: null,
      state: "readyNoData",
      pendingData: null,
      errorData: null,
      handlerMap: expectedHandlerMap({ setData: true }),
    });
  });

  it("prop initialData; should use initial data", () => {
    let { result } = Test.renderHook(() => useDataObject({ initialData: INITIAL_DATA1 }));
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1,
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
  });

  it("prop initialData; should use initial data without calling onLoad", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataObject({ initialData: INITIAL_DATA1, handlerMap }));
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1,
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);
  });

  it("prop initialDtoIn; should pass initialDtoIn to initial load", async () => {
    let initialDtoIn = { a: "b" };
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    Test.renderHook(() => useDataObject({ initialDtoIn, handlerMap }));
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    expect(handlerMap.load.mock.calls[0][0]).toBe(initialDtoIn);
  });

  it("prop skipInitialLoad; should skip calling initial load", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataObject({ skipInitialLoad: true, handlerMap }));
    expect(result.current).toEqual(
      expectedResult({
        data: null,
        state: "readyNoData",
        pendingData: null,
        errorData: null,
      }),
    );
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);
  });

  it("prop handlerMap.load; should be used for initial load & update state (success)", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap }));
    expect(result.current).toEqual(
      expectedResult({
        data: null,
        state: "pendingNoData",
        errorData: null,
        pendingData: { operation: "load", dtoIn: undefined },
      }),
    );
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1,
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
  });

  it("prop handlerMap.load; should be used for initial load & update state (error)", async () => {
    let error = 123;
    let handlerMap = {
      load: jest.fn(async () => {
        error = new Error("Test error.");
        error.dtoOut = { key: "value" };
        throw error;
      }),
    };
    Utils.omitConsoleLogs("Test error.");

    let { result } = Test.renderHook(() => useDataObject({ handlerMap }));
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: null,
        state: "errorNoData",
        pendingData: null,
        errorData: { operation: "load", dtoIn: undefined, error, data: error.dtoOut },
      }),
    );
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
  });

  it("prop handlerMap.*; should have all handlers in hook result", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
      custom: jest.fn(async () => LOAD_DATA2),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, initialData: INITIAL_DATA1 }));
    expect(result.current).toEqual(
      expectedResult({
        handlerMap: expectedHandlerMap({ load: true, custom: true, setData: true }),
      }),
    );
  });

  it("prop loadDependencies; should reload if dependencies changed", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    let { rerender } = Test.renderHook((args) => useDataObject(...args), {
      initialProps: [{ handlerMap, initialDtoIn: { foo: "bar" } }, ["key1"]],
    });
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    handlerMap.load.mockClear();

    rerender([{ handlerMap, initialDtoIn: { foo: "bar2" } }, ["key1"]]);
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);

    rerender([{ handlerMap, initialDtoIn: { foo: "bar2" } }, ["key2"]]);
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    expect(handlerMap.load).lastCalledWith({ foo: "bar2" });
    handlerMap.load.mockClear();

    // similar but with skipInitialLoad => should skip 1st load
    ({ rerender } = Test.renderHook((args) => useDataObject(...args), {
      initialProps: [{ handlerMap, skipInitialLoad: true, initialDtoIn: { foo: "bar" } }, ["key1"]],
    }));
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);

    rerender([{ handlerMap, initialDtoIn: { foo: "bar2" } }, ["key1"]]);
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);

    rerender([{ handlerMap, initialDtoIn: { foo: "bar2" } }, ["key2"]]);
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    expect(handlerMap.load).lastCalledWith({ foo: "bar2" });
    handlerMap.load.mockClear();

    // changing dependencies during ongoing load should end up doing another load afterwards
    handlerMap = {
      load: jest.fn(async ({ promiseToWaitFor, ...data }) => {
        await promiseToWaitFor;
        return { ...data, result: true };
      }),
    };
    let result;
    let promiseToWaitForResolve;
    let promiseToWaitFor = new Promise((res, rej) => (promiseToWaitForResolve = res));
    ({ result, rerender } = Test.renderHook((args) => useDataObject(...args), {
      initialProps: [{ handlerMap, initialDtoIn: { foo: "bar", promiseToWaitFor } }, ["key1"]],
    }));
    await Utils.wait();
    expect(result.current).toMatchObject({ state: "pendingNoData" });
    rerender([{ handlerMap, initialDtoIn: { foo: "bar2" } }, ["key2"]]);
    promiseToWaitForResolve();
    await Test.waitFor(
      async () => {
        expect(result.current).toMatchObject({ data: { foo: "bar2", result: true } });
      },
      { timeout: 500 },
    );
    expect(handlerMap.load).lastCalledWith({ foo: "bar2" });
  });

  it("result should be referentially stable", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
      custom: jest.fn(async () => LOAD_DATA2),
    };
    let { result, rerender } = Test.renderHook(() => useDataObject({ handlerMap, initialData: INITIAL_DATA1 }));
    let result1 = result.current;
    rerender({ handlerMap, initialData: INITIAL_DATA1 });
    expect(result.current).toBe(result1);
  });

  it("handlerMap.load(); should update data & state (success)", async () => {
    let CALL_PARAMS = { key: "value" };
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, initialData: INITIAL_DATA1 }));
    let callResult, callResultResolved;
    Test.act(() => {
      callResult = result.current.handlerMap.load(CALL_PARAMS);
    });
    expect(callResult instanceof Promise).toBe(true);
    callResult.then((v) => (callResultResolved = v));
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1,
        state: "pending",
        errorData: null,
        pendingData: { operation: "load", dtoIn: CALL_PARAMS },
      }),
    );
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1,
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    expect(handlerMap.load.mock.calls[0][0]).toBe(CALL_PARAMS);
    expect(callResultResolved).toBe(LOAD_DATA1);
  });

  it("handlerMap.load(); should update data & state (error)", async () => {
    const CALL_PARAMS = { key: "value" };
    let error = 123;
    let handlerMap = {
      load: jest.fn(async () => {
        error = new Error("Test error.");
        error.dtoOut = { key: "value" };
        throw error;
      }),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, initialData: INITIAL_DATA1 }));
    let caughtError;
    Test.act(() => {
      result.current.handlerMap.load(CALL_PARAMS).catch((e) => (caughtError = e));
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1,
        state: "error",
        errorData: { operation: "load", dtoIn: CALL_PARAMS, error, data: error.dtoOut },
        pendingData: null,
      }),
    );
    expect(caughtError).toBe(error);
  });

  it("handlerMap.<custom>(); should update data & state (success)", async () => {
    let CALL_PARAMS = { key: "value" };
    let handlerMap = {
      custom: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, initialData: INITIAL_DATA1 }));
    let callResult, callResultResolved;
    Test.act(() => {
      callResult = result.current.handlerMap.custom(CALL_PARAMS);
    });
    expect(callResult instanceof Promise).toBe(true);
    callResult.then((v) => (callResultResolved = v));
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1,
        state: "pending",
        errorData: null,
        pendingData: { operation: "custom", dtoIn: CALL_PARAMS },
      }),
    );
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1,
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
    expect(handlerMap.custom).toHaveBeenCalledTimes(1);
    expect(handlerMap.custom.mock.calls[0][0]).toBe(CALL_PARAMS);
    expect(callResultResolved).toBe(LOAD_DATA1);
  });

  it("handlerMap.<custom>(); should update data & state (error)", async () => {
    const CALL_PARAMS = { key: "value" };
    let error = 123;
    let handlerMap = {
      custom: jest.fn(async () => {
        error = new Error("Test error.");
        error.dtoOut = { key: "value" };
        throw error;
      }),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, initialData: INITIAL_DATA1 }));
    let caughtError;
    Test.act(() => {
      result.current.handlerMap.custom(CALL_PARAMS).catch((e) => (caughtError = e));
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1,
        state: "error",
        errorData: { operation: "custom", dtoIn: CALL_PARAMS, error, data: error.dtoOut },
        pendingData: null,
      }),
    );
    expect(caughtError).toBe(error);
  });

  it("handlerMap.setData(); should set new data", async () => {
    let { result } = Test.renderHook(() => useDataObject({ initialData: INITIAL_DATA1 }));
    Test.act(() => {
      result.current.handlerMap.setData(LOAD_DATA1);
    });
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1,
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
  });

  it("handlerMap.*(); should pass extra call args to handlers", async () => {
    let CALL_ARGS = [{ key: "value" }, 123, null, true];
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
      custom: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, initialData: INITIAL_DATA1 }));
    for (let op in handlerMap) {
      Test.act(() => {
        result.current.handlerMap[op](...CALL_ARGS);
      });
      await Utils.wait();
      expect(handlerMap[op]).lastCalledWith(...CALL_ARGS);
    }
  });

  it("handlerMap.*(); should merge data if handler returns function (success)", async () => {
    let mergeLoadFn = jest.fn(() => LOAD_DATA1);
    let mergeCustomFn = jest.fn(() => LOAD_DATA2);
    let handlerMap = {
      load: jest.fn(async () => mergeLoadFn),
      custom: jest.fn(async () => mergeCustomFn),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, initialData: INITIAL_DATA1 }));
    Test.act(() => {
      result.current.handlerMap.load();
    });
    await Utils.wait();
    expect(mergeLoadFn).toHaveBeenCalledTimes(1);
    expect(mergeLoadFn).lastCalledWith(INITIAL_DATA1);
    expect(result.current).toMatchObject({ data: LOAD_DATA1 });

    Test.act(() => {
      result.current.handlerMap.custom();
    });
    await Utils.wait();
    expect(mergeCustomFn).toHaveBeenCalledTimes(1);
    expect(mergeCustomFn).lastCalledWith(LOAD_DATA1);
    expect(result.current).toMatchObject({ data: LOAD_DATA2 });
  });

  it("handlerMap.*(); should merge data if handler returns function (failure)", async () => {
    let error = 123;
    let mergeLoadFn = jest.fn(() => {
      error = new Error("Test error.");
      error.dtoOut = { key: "value" };
      throw error;
    });
    let handlerMap = { load: jest.fn(async () => mergeLoadFn) };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, initialData: INITIAL_DATA1 }));
    let caughtError;
    Test.act(() => {
      result.current.handlerMap.load().catch((e) => (caughtError = e));
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1,
        state: "error",
        errorData: { operation: "load", dtoIn: undefined, error, data: error.dtoOut },
        pendingData: null,
      }),
    );
    expect(caughtError).toBe(error);
  });

  it("handlerMap.*(); should not be available if load/custom operation is in progress", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
      custom: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap }));

    // initial load
    expect(result.current).toEqual(expectedResult({ handlerMap: expectedHandlerMap({}) }));
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({ handlerMap: expectedHandlerMap({ setData: true, load: true, custom: true }) }),
    );

    // load
    Test.act(() => {
      result.current.handlerMap.load();
    });
    expect(result.current).toEqual(expectedResult({ handlerMap: expectedHandlerMap({}) }));
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({ handlerMap: expectedHandlerMap({ setData: true, load: true, custom: true }) }),
    );

    // custom operation
    Test.act(() => {
      result.current.handlerMap.custom();
    });
    expect(result.current).toEqual(expectedResult({ handlerMap: expectedHandlerMap({}) }));
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({ handlerMap: expectedHandlerMap({ setData: true, load: true, custom: true }) }),
    );
  });

  it("handlerMap.*(); should reset error state on success", async () => {
    let handlerMap = {
      load: jest.fn(async () => {
        throw new Error("Test error.");
      }),
      custom: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, initialData: INITIAL_DATA1 }));
    Test.act(() => {
      result.current.handlerMap.load().catch((e) => null);
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1,
        state: "error",
        errorData: expect.objectContaining({ operation: "load" }),
      }),
    );
    Test.act(() => {
      result.current.handlerMap.custom();
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1,
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
  });

  it("should call abort() on abortable ongoing calls during unmount", async () => {
    let abortMock = jest.fn();
    let handlerMap = {
      load: jest.fn(() => {
        let result = new Promise(() => {});
        result.abort = abortMock;
        return result;
      }),
    };

    // initial load
    let { result, unmount } = Test.renderHook(() => useDataObject({ handlerMap }));
    await Utils.wait();
    expect(abortMock).toHaveBeenCalledTimes(0);
    unmount();
    expect(abortMock).toHaveBeenCalledTimes(1);

    // explicit load
    abortMock.mockClear();
    ({ result, unmount } = Test.renderHook(() => useDataObject({ handlerMap, initialData: {} })));
    await Utils.wait();
    expect(abortMock).toHaveBeenCalledTimes(0);
    Test.act(() => {
      result.current.handlerMap.load();
    });
    await Utils.wait();
    expect(abortMock).toHaveBeenCalledTimes(0);
    unmount();
    expect(abortMock).toHaveBeenCalledTimes(1);
  });

  it("skipAbortOnUnmount; should start & finish the call (settle the Promise) even if component is going to be / got unmounted", async () => {
    let lastCallResolve;
    let handlerMap = {
      load: jest.fn(() => {
        let result = new Promise((resolve) => {
          lastCallResolve = resolve;
        });
        return result;
      }),
    };

    let { result, unmount } = Test.renderHook(() =>
      useDataObject({ handlerMap, skipInitialLoad: true, skipAbortOnUnmount: true }),
    );
    await Utils.wait();
    let loadPromise;
    Test.act(() => {
      loadPromise = result.current.handlerMap.load();
      unmount();
    });
    await Test.waitFor(() => expect(handlerMap.load).toHaveBeenCalled(), { timeout: 100 });
    lastCallResolve({ itemList: [{ id: "a" }] });
    await expect(loadPromise).resolves.toEqual({ itemList: [{ id: "a" }] });
  });

  it("should re-invoke handler on access policy error recovery", async () => {
    let accessPolicyError = createAccessPolicyError();
    let sessionMatchesAccessPolicy = false;
    AuthenticationService.getCurrentSession().matches = () => sessionMatchesAccessPolicy;

    let handlerMap = {
      load: jest.fn(async () => {
        if (!sessionMatchesAccessPolicy) throw accessPolicyError;
        return LOAD_DATA1;
      }),
    };
    let lastSessionCtxValue;
    let { rerender, Component } = createRerenderableComponent((props) => (
      <SessionProvider authenticationService={AuthenticationService}>
        {(ctxValue) => {
          lastSessionCtxValue = ctxValue;
          return props.children;
        }}
      </SessionProvider>
    ));
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, skipInitialLoad: true }), {
      wrapper: Component,
    });

    Test.act(() => {
      result.current.handlerMap.load().catch((e) => null);
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: null,
        state: "errorNoData",
        errorData: expect.objectContaining({ operation: "load", error: accessPolicyError }),
      }),
    );

    // force updating of oidc session and then re-rendering of SessionProvider
    sessionMatchesAccessPolicy = true;
    await lastSessionCtxValue.login();
    rerender();
    await Utils.wait();

    // expect that the hook automatically called handlerMap.load() because session got updated and
    // it now matches the access policy error data
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1,
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
  });

  it("handlerMap.*(); should throw if another operation is already running", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA2),
      update: jest.fn(async () => null),
    };
    let { result } = Test.renderHook(() => useDataObject({ handlerMap, initialData: LOAD_DATA1 }));
    await Utils.wait();

    // explicit load
    handlerMap.load.mockClear();
    let call1Promise, call2Promise, call2Error, call3Promise, call3Error;
    Test.act(() => {
      call1Promise = result.current.handlerMap.load();
      call2Promise = result.current.handlerMap.load({ pageInfo: { pageIndex: 1 } }).catch((e) => (call2Error = e));
      call3Promise = result.current.handlerMap.update({ foo: "bar" }).catch((e) => (call3Error = e));
    });
    await Utils.wait();
    await expect(call1Promise).resolves.toEqual(LOAD_DATA2);
    await call2Promise;
    expect(call2Error + "").toMatch(/not allow/);
    await call3Promise;
    expect(call3Error + "").toMatch(/not allow/);

    handlerMap.update.mockClear();
    Test.act(() => {
      call1Promise = result.current.handlerMap.update({ foo: "bar" });
      call2Promise = result.current.handlerMap.update({ foo: "bar2" }).catch((e) => (call2Error = e));
    });
    await Utils.wait();
    await expect(call1Promise).resolves.toEqual(null);
    await call2Promise;
    expect(call2Error + "").toMatch(/not allow/);
  });
});
