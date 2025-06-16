import { useLsiValues, LanguageProvider } from "uu5g05";
import { Test } from "uu5g05-test";

const LSI_VALUES1 = {
  key1: { en: "key1-en", cs: "key1-cs" },
  key2: { en: "key2-en", cs: "key2-en" },
};
const LSI_VALUES2 = {
  key1: { en: "v2-key1-en", cs: "v2-key1-cs" },
  key2: { en: "v2-key2-en", cs: "v2-key2-en" },
};

describe("[uu5g05] useLsiValues", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useLsiValues());
    expect(result.current).toEqual({});
  });

  it("should return values based on default language", async () => {
    let { result } = Test.renderHook(() => useLsiValues(LSI_VALUES1));
    expect(result.current).toMatchObject({ key1: LSI_VALUES1.key1.en, key2: LSI_VALUES1.key2.en });
  });

  it("should return values based on context language", async () => {
    let { result } = Test.renderHook(() => useLsiValues(LSI_VALUES1), {
      wrapper: ({ children }) => <LanguageProvider language="cs">{children}</LanguageProvider>,
    });
    expect(result.current).toMatchObject({ key1: LSI_VALUES1.key1.cs, key2: LSI_VALUES1.key2.cs });
  });

  it("should react to hook parameters change", async () => {
    let { result, rerender } = Test.renderHook((props) => useLsiValues(...props), { initialProps: [LSI_VALUES1] });
    expect(result.current).toMatchObject({ key1: LSI_VALUES1.key1.en, key2: LSI_VALUES1.key2.en });
    rerender([LSI_VALUES2]);
    expect(result.current).toMatchObject({ key1: LSI_VALUES2.key1.en, key2: LSI_VALUES2.key2.en });
  });
});
