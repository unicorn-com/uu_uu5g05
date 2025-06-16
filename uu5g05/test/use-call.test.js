import { useCall } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g05] useCall", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useCall());
    expect(result.current).toMatchObject({
      state: "readyNoData",
      data: undefined,
      errorData: undefined,
      call: expect.any(Function),
    });
  });

  it("call; should perform call and update state (success)", async () => {
    let { result } = Test.renderHook(() => useCall(async () => 123));
    let callPromise;
    Test.act(() => {
      callPromise = result.current.call();
    });
    expect(result.current).toMatchObject({ state: "pendingNoData", data: undefined, errorData: undefined });
    await Test.act(() => callPromise);
    expect(result.current).toMatchObject({ state: "ready", data: 123, errorData: null });
  });

  it("call; should perform call and update state (error)", async () => {
    let error;
    let { result } = Test.renderHook(() =>
      useCall(async () => {
        throw (error = new Error("Test error"));
      }),
    );
    let callPromise;
    Test.act(() => {
      callPromise = result.current.call();
    });
    expect(result.current).toMatchObject({ state: "pendingNoData", data: undefined, errorData: undefined });
    await Test.act(() => callPromise.catch((e) => null));
    expect(result.current).toMatchObject({ state: "errorNoData", data: null, errorData: { error } });
  });

  it("call; should preserve previous result while new call is running", async () => {
    let error, callPromise;
    let { result } = Test.renderHook(() => useCall(async (value) => value));
    await Test.act(() => result.current.call(123));
    expect(result.current).toMatchObject({ state: "ready", data: 123, errorData: null });

    Test.act(() => {
      callPromise = result.current.call(Promise.reject((error = new Error("Test error"))));
    });
    expect(result.current).toMatchObject({ state: "pending", data: 123, errorData: null });
    await Test.act(() => callPromise.catch((e) => null));
    expect(result.current).toMatchObject({ state: "error", data: 123, errorData: { error } });

    Test.act(() => {
      callPromise = result.current.call(234);
    });
    expect(result.current).toMatchObject({ state: "pending", data: 123, errorData: { error } });
    await Test.act(() => callPromise);
    expect(result.current).toMatchObject({ state: "ready", data: 234, errorData: null });
  });

  it("call; should pass args to call function", async () => {
    let callFn = jest.fn(async () => null);
    let { result } = Test.renderHook(() => useCall(callFn));
    await Test.act(() => result.current.call("a", 123));
    expect(callFn).toHaveBeenLastCalledWith("a", 123);
  });
});
