import { useWorker } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g05] useLevel", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useWorker(jest.fn()));
    expect(result.current).toEqual({
      call: expect.any(Function),
      state: "readyNoData",
      data: null,
      pendingData: null,
      errorData: null,
    });
  });

  // NOTE Not testing the actual functionality as JSDOM doesn't support Web Workers yet.
});
