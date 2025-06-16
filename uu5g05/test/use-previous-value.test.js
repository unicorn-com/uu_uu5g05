import { usePreviousValue } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g05] usePreviousValue", () => {
  it("should return previous value", () => {
    let { result, rerender } = Test.renderHook((props) => usePreviousValue(...props), { initialProps: [10] });
    expect(result.current).toBe(undefined);
    rerender([20]);
    expect(result.current).toBe(10);
    rerender([20]);
    expect(result.current).toBe(20);
    rerender([20]);
    expect(result.current).toBe(20);
    rerender([30]);
    expect(result.current).toBe(20);
    rerender([40]);
    expect(result.current).toBe(30);
  });

  it("should return previous value (initial value)", () => {
    let { result, rerender } = Test.renderHook((props) => usePreviousValue(...props), { initialProps: [10, -10] });
    expect(result.current).toBe(-10);
    rerender([20]);
    expect(result.current).toBe(10);
  });
});
