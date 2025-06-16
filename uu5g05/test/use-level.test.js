import { useLevel, LevelProvider } from "uu5g05";
import { Test } from "uu5g05-test";

function renderInProvider(providerProps, ...initialHookParams) {
  return Test.renderHook(() => useLevel(...initialHookParams), {
    wrapper: ({ children }) => <LevelProvider {...providerProps}>{children}</LevelProvider>,
  });
}

describe("[uu5g05] useLevel", () => {
  it("should return expected result API", () => {
    let { result } = renderInProvider({ level: 1 });
    expect(result.current).toEqual([expect.any(Number), expect.any(Function)]);
  });

  it("should return default level", async () => {
    let { result } = Test.renderHook(() => useLevel());
    expect(result.current?.[0]).toBe(null);
  });

  it("should return context level", async () => {
    let { result } = renderInProvider({ level: 2 });
    expect(result.current?.[0]).toBe(2);
  });

  it("result setLevel(newLevel); should change level", async () => {
    let { result } = renderInProvider({ level: 3 });

    expect(result.current?.[0]).toBe(3);
    Test.act(() => {
      result.current[1](5);
    });
    expect(result.current?.[0]).toBe(5);
  });

  it("LevelProvider prop onChange; should receive new level", async () => {
    let onChange = jest.fn();
    let { result } = renderInProvider({ level: 3, onChange });

    expect(result.current?.[0]).toBe(3);
    Test.act(() => {
      result.current[1](5);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith({ level: 5 });
    expect(result.current?.[0]).toBe(3); // not updated because we didn't propagate value from onChange to prop
  });
});
