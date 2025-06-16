import { Utils } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g05] Utils.Print", () => {
  it("initial state", () => {
    const mockFn = jest.fn();
    Test.act(() => {
      window.alert = mockFn;
      window.dispatchEvent(new Event("beforeprint"));
    });
    expect(mockFn).toBeCalledTimes(0); // should not be called, we don't have any listener
  });

  let printBlockerId;
  it("registerPrintBlocker and show alert", () => {
    printBlockerId = Utils.Print.registerPrintBlocker();
    expect(typeof printBlockerId).toBe("string");

    const mockFn = jest.fn();
    Test.act(() => {
      window.alert = mockFn;
      window.dispatchEvent(new Event("beforeprint"));
    });
    expect(mockFn).toBeCalledTimes(1); // alert should be shown
  });

  it("unregisterPrintBlocker", () => {
    Utils.Print.unregisterPrintBlocker(printBlockerId); // use the print blocker from previous test

    const mockFn = jest.fn();
    Test.act(() => {
      window.alert = mockFn;
      window.dispatchEvent(new Event("beforeprint"));
    });
    expect(mockFn).toBeCalledTimes(0); // alert should not be shown
  });

  it("registerPrintBlocker callback", () => {
    const mockFn = jest.fn();
    Utils.Print.registerPrintBlocker(mockFn);

    Test.act(() => {
      window.dispatchEvent(new Event("beforeprint"));
    });

    expect(mockFn).toBeCalledTimes(1); // callback should be called
  });
});
