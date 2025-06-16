import { useToolbar } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g05] useToolbar", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useToolbar());
    expect(result.current).toEqual({
      providerless: expect.any(Boolean),
      renderLeft: expect.any(Function),
      renderRight: expect.any(Function),
      setLeftElement: expect.any(Function),
      setRightElement: expect.any(Function),
      toolbarless: expect.any(Boolean),
    });
  });

  // TODO Test ToolbarProvider too. Currently we test ToolbarProvider + useToolbar proper functionality
  // as a part of Toolbar.
});
