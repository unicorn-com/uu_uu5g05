import { useValueChange } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g05] useValueChange", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useValueChange());
    expect(result.current).toEqual([undefined, expect.any(Function)]);
  });

  it("useValueChange(value) should behave as initial value", async () => {
    let { result, rerender } = Test.renderHook((props) => useValueChange(...props), { initialProps: [1] });
    expect(result.current).toEqual([1, expect.any(Function)]);
    let setter = result.current[1];
    rerender([2]);
    expect(result.current).toEqual([1, setter]); // value unchanged; setter shouldn't change either

    // calling setter should change the value
    Test.act(() => {
      setter(3);
    });
    expect(result.current).toEqual([3, setter]);
  });

  it("useValueChange(value, onChange) should behave as controlled value", async () => {
    let onChange = jest.fn();
    let { result, rerender } = Test.renderHook((props) => useValueChange(...props), { initialProps: [1, onChange] });
    expect(result.current).toEqual([1, expect.any(Function)]);
    expect(onChange).toHaveBeenCalledTimes(0);
    let setter = result.current[1];
    rerender([2, onChange]);
    expect(result.current).toEqual([2, setter]); // value changed; setter shouldn't change
    expect(onChange).toHaveBeenCalledTimes(0);

    // calling setter should change the value
    Test.act(() => {
      setter(3);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith(3);
    expect(result.current).toEqual([2, setter]); // value shouldn't have changed (we don't do anything in onChange)
  });

  it("useValueChange(value, onChange) should retain last state if switching between controlled/uncontrolled", async () => {
    // onChange1 -> onChange2
    let onChange1 = jest.fn();
    let onChange2 = jest.fn();
    let { result, rerender } = Test.renderHook((props) => useValueChange(...props), { initialProps: [1, onChange1] });
    expect(result.current).toEqual([1, expect.any(Function)]);
    let setter = result.current[1];
    Test.act(() => {
      setter(2);
    });
    expect(result.current).toEqual([1, setter]); // we don't do anything in onChange
    expect(onChange1).toHaveBeenCalledTimes(1);
    expect(onChange2).toHaveBeenCalledTimes(0);
    onChange1.mockClear();
    rerender([2, onChange2]);
    expect(result.current).toEqual([2, setter]);
    Test.act(() => {
      setter(3);
    });
    expect(result.current).toEqual([2, setter]); // we don't do anything in onChange
    expect(onChange1).toHaveBeenCalledTimes(0);
    expect(onChange2).toHaveBeenCalledTimes(1);
    onChange2.mockClear();

    // don't pass onChange anymore
    rerender([4]);
    expect(result.current).toEqual([2, setter]); // we already processed initial value so we stay at 2
    Test.act(() => {
      setter(5);
    });
    expect(result.current).toEqual([5, setter]); // value shouldn't have changed (we don't do anything in onChange)
    expect(onChange1).toHaveBeenCalledTimes(0);
    expect(onChange2).toHaveBeenCalledTimes(0);

    // pass onChange again
    rerender([6, onChange1]);
    expect(result.current).toEqual([6, setter]); // it's controlled again - should use the new value
    Test.act(() => {
      setter(7);
    });
    expect(result.current).toEqual([6, setter]); // value shouldn't have changed (we don't do anything in onChange)
    expect(onChange1).toHaveBeenCalledTimes(1);
    expect(onChange2).toHaveBeenCalledTimes(0);
  });
});
