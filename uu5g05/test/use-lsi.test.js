import { useLsi, LanguageProvider } from "uu5g05";
import { Test } from "uu5g05-test";

const LSI1 = { en: "key1-en", cs: "key1-cs" };
const LSI2 = { en: "key2-en", cs: "key2-cs" };

describe("[uu5g05] useLsi", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useLsi(LSI1));
    expect(result.current).toEqual(expect.any(String));
  });

  it("should return value based on default language", async () => {
    let { result } = Test.renderHook(() => useLsi(LSI1));
    expect(result.current).toBe(LSI1.en);
  });

  it("should return value based on context language", async () => {
    let { result } = Test.renderHook(() => useLsi(LSI1), {
      wrapper: ({ children }) => <LanguageProvider language="cs">{children}</LanguageProvider>,
    });
    expect(result.current).toBe(LSI1.cs);
  });

  it("should react to hook parameters change", async () => {
    let { result, rerender } = Test.renderHook((props) => useLsi(...props), { initialProps: [LSI1] });
    expect(result.current).toBe(LSI1.en);
    rerender([LSI2]);
    expect(result.current).toBe(LSI2.en);
  });

  it("should return value as-is if the parameter isn't object", async () => {
    let { result } = Test.renderHook(() => useLsi("abc"));
    expect(result.current).toBe("abc");
  });
});
