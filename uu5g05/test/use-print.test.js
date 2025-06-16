import { usePrint } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g04-hooks] usePrint with window", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => usePrint());
    expect(result.current).toEqual(expect.any(Boolean));
  });

  it("should report printing state", async () => {
    let { result } = Test.renderHook(() => usePrint());
    expect(result.current).toBe(false);

    Test.act(() => {
      window.dispatchEvent(new Event("beforeprint"));
    });
    expect(result.current).toBe(true);
    Test.act(() => {
      window.dispatchEvent(new Event("afterprint"));
    });
    expect(result.current).toBe(false);
  });
});
