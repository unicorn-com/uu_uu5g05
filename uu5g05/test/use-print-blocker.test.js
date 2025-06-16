import { usePrintBlocker } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g05] usePrintBlocker", () => {
  it("should isPrintRequested inform about print", () => {
    const { result } = Test.renderHook(() => usePrintBlocker());

    expect(result.current.isPrintRequested).toBe(false);
    Test.act(() => {
      window.alert = () => {}; // it would otherwise crash
      window.dispatchEvent(new Event("beforeprint"));
    });
    expect(result.current.isPrintRequested).toBe(true);
  });

  it("should show alert until ready", () => {
    const { result } = Test.renderHook(() => usePrintBlocker());

    const mockFn = jest.fn();
    Test.act(() => {
      window.alert = mockFn;
      window.dispatchEvent(new Event("beforeprint"));
    });
    expect(mockFn).toBeCalledTimes(1); // alert should be shown

    result.current.printReady();

    const newMockFn = jest.fn();
    Test.act(() => {
      window.alert = newMockFn;
      window.dispatchEvent(new Event("beforeprint"));
    });

    expect(newMockFn).toBeCalledTimes(0); // no alert should be shown
  });
});
