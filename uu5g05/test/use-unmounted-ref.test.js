import { useUnmountedRef } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g05] useUnmountedRef", () => {
  it("should return value based on mount state", () => {
    let { result, unmount } = Test.renderHook(() => useUnmountedRef());
    expect(result.current).toMatchObject({ current: false });
    unmount();
    expect(result.current).toMatchObject({ current: true });
  });
});
