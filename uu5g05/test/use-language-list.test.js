import { useLanguageList, LanguageListProvider } from "uu5g05";
import { Test } from "uu5g05-test";

describe("[uu5g05] useLanguageList", () => {
  it("no provider; should return undefineds", async () => {
    let { result } = Test.renderHook(() => useLanguageList());
    expect(result.current).toEqual([undefined, undefined]);
  });

  it("result[0]; should get language list", async () => {
    let { result } = Test.renderHook(() => useLanguageList(), {
      wrapper: ({ children }) => <LanguageListProvider languageList={["es", "en"]}>{children}</LanguageListProvider>,
    });
    expect(result.current).toEqual([["es", "en"], expect.any(Function)]);
  });

  it("result[1]; should set new language list", async () => {
    let { result } = Test.renderHook(() => useLanguageList(), {
      wrapper: ({ children }) => <LanguageListProvider languageList={["es", "en"]}>{children}</LanguageListProvider>,
    });

    Test.act(() => {
      result.current[1](["ru"]);
    });
    expect(result.current).toEqual([["ru"], expect.any(Function)]);
  });
});
