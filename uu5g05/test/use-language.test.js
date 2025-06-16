import {
  useLanguage,
  LanguageProvider,
  useLanguageList,
  LanguageListProvider,
  Utils,
  useState,
  useUserPreferences,
  UserPreferencesProvider,
} from "uu5g05";
import { Test } from "uu5g05-test";

let origLanguage;
beforeEach(() => {
  origLanguage = Utils.Language.getLanguage();
});
afterEach(() => {
  Utils.Language.setLanguage(origLanguage);
});

describe("[uu5g05] useLanguage", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useLanguage());
    expect(result.current).toMatchObject([expect.any(String), expect.any(Function), {}]);
  });

  it("prop language; should return default language", async () => {
    let { result } = Test.renderHook(() => useLanguage());
    expect(result.current).toMatchObject(["en-gb", expect.any(Function), {}]);
  });

  it("prop language; should return context language", async () => {
    let { result } = Test.renderHook(() => useLanguage(), {
      wrapper: ({ children }) => <LanguageProvider language="es">{children}</LanguageProvider>,
    });
    expect(result.current).toMatchObject(["es", expect.any(Function), { direction: "ltr" }]);
  });

  it("setLanguage; should re-render with new language", async () => {
    let { result, HookComponent } = Test.createHookComponent(() => useLanguage());
    let onChangeFn = jest.fn();
    let { rerender } = Test.render(
      <LanguageProvider language="es" onChange={onChangeFn}>
        <HookComponent />
      </LanguageProvider>,
    );

    Test.act(() => {
      result.current[1]("ru");
    });
    expect(onChangeFn).toHaveBeenCalledTimes(1);
    expect(onChangeFn).toHaveBeenCalledWith({ language: "ru" });
    expect(result.current).toMatchObject(["es", expect.any(Function), { direction: "ltr" }]); // not updated because we didn't propagate value from onChange to prop
    rerender(
      <LanguageProvider language="ru" onChange={onChangeFn}>
        <HookComponent />
      </LanguageProvider>,
    );
    expect(result.current).toMatchObject(["ru", expect.any(Function), { direction: "ltr" }]);
  });

  it("with LanguageListProvider; should constrain allowed language by language list from LanguageListProvider", async () => {
    let { result, HookComponent } = Test.createHookComponent(useLanguage);
    let { result: listLastResult, HookComponent: HookComponentList } = Test.createHookComponent(useLanguageList);
    let { unmount } = Test.render(
      <LanguageListProvider languageList={["en", "ru"]}>
        <LanguageProvider language="es">
          <HookComponent />
          <HookComponentList />
        </LanguageProvider>
      </LanguageListProvider>,
    );
    expect(result.current).toMatchObject(["en", expect.any(Function), { direction: "ltr" }]);
    Test.act(() => {
      listLastResult.current[1](["cs", "ru"]);
    });
    expect(result.current).toMatchObject(["cs", expect.any(Function), { direction: "ltr" }]); // "en" is no longer in language list => should switch to "cs"
    Test.act(() => {
      listLastResult.current[1](["uk", "cs"]);
    });
    expect(result.current).toMatchObject(["cs", expect.any(Function), { direction: "ltr" }]);
    Test.act(() => {
      result.current[1]("ru");
    });
    expect(result.current).toMatchObject(["cs", expect.any(Function), { direction: "ltr" }]);
    unmount();

    Test.render(
      <LanguageListProvider languageList={["en", "ru"]}>
        <LanguageProvider language="en">
          <HookComponent />
          <HookComponentList />
        </LanguageProvider>
      </LanguageListProvider>,
    );
    expect(result.current).toMatchObject(["en", expect.any(Function), { direction: "ltr" }]);
  });

  it("with LanguageListProvider + onChange; should constrain allowed language by language list from LanguageListProvider and pass it to onChange", async () => {
    let { result, HookComponent } = Test.createHookComponent(() => useLanguage());
    let { result: listLastResult, HookComponent: HookComponentList } = Test.createHookComponent(() =>
      useLanguageList(),
    );
    let onChange = jest.fn();
    let TestComponent = ({ initialLanguage }) => {
      let [languageState, setLanguageState] = useState({ language: initialLanguage });
      return (
        <LanguageListProvider languageList={["en", "ru"]}>
          <LanguageProvider
            {...languageState}
            onChange={(...args) => {
              onChange(...args);
              setLanguageState(...args);
            }}
          >
            <HookComponent />
            <HookComponentList />
          </LanguageProvider>
        </LanguageListProvider>
      );
    };
    let { unmount } = Test.render(<TestComponent initialLanguage="es" />);
    expect(result.current).toMatchObject(["en", expect.any(Function), { direction: "ltr" }]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith({ language: "en" });
    onChange.mockClear();
    Test.act(() => {
      listLastResult.current[1](["cs", "ru"]);
    });
    expect(result.current).toMatchObject(["cs", expect.any(Function), { direction: "ltr" }]); // "en" is no longer in language list => should switch to "cs"
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith({ language: "cs" });
    onChange.mockClear();
    Test.act(() => {
      listLastResult.current[1](["uk", "cs"]);
    });
    expect(result.current).toMatchObject(["cs", expect.any(Function), { direction: "ltr" }]);
    expect(onChange).toHaveBeenCalledTimes(0);
    Test.act(() => {
      result.current[1]("ru");
    });
    expect(result.current).toMatchObject(["cs", expect.any(Function), { direction: "ltr" }]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith({ language: "cs" });
    onChange.mockClear();
    unmount();

    Test.render(<TestComponent initialLanguage="en" />);
    expect(result.current).toMatchObject(["en", expect.any(Function), { direction: "ltr" }]);
    expect(onChange).toHaveBeenCalledTimes(0);
  });
});

describe("LanguageProvider + integration with LanguageListProvider and UserPreferencesProvider", () => {
  it("should set proper language", async () => {
    let { result: languageLastResult, HookComponent: LanguageHookComponent } = Test.createHookComponent(() =>
      useLanguage(),
    );
    let { result: languageListLastResult, HookComponent: LanguageListHookComponent } = Test.createHookComponent(() =>
      useLanguageList(),
    );
    let { result: userPreferencesLastResult, HookComponent: UserPreferencesHookComponent } = Test.createHookComponent(
      () => useUserPreferences(),
    );
    let TestComponent = ({ initialUserLangList, initialAppLangList }) => {
      return (
        <UserPreferencesProvider languageList={initialUserLangList}>
          <LanguageListProvider languageList={initialAppLangList}>
            <LanguageProvider>
              <LanguageListHookComponent />
              <LanguageHookComponent />
              <UserPreferencesHookComponent />
            </LanguageProvider>
          </LanguageListProvider>
        </UserPreferencesProvider>
      );
    };

    // NOTE Initial Utils.Language language is "en".
    let { unmount } = Test.render(<TestComponent initialAppLangList={["ua", "en", "cs", "es"]} />);
    expect(languageLastResult.current[0]).toBe("en");
    unmount();

    Utils.Language.setLanguage("cs");
    ({ unmount } = Test.render(<TestComponent initialAppLangList={["ua", "en", "cs", "es"]} />));
    expect(languageLastResult.current[0]).toBe("cs");
    unmount();

    Utils.Language.setLanguage("en");
    ({ unmount } = Test.render(
      <TestComponent initialAppLangList={["ua", "en", "cs", "es"]} initialUserLangList={["cs", "en"]} />,
    ));
    expect(languageLastResult.current[0]).toBe("cs");
    Test.act(() => {
      languageListLastResult.current[1](["ua", "en", "cs"]); // set app languages ["ua", "en", "cs"] -> "cs" (intersects with user languages)
    });
    expect(languageLastResult.current[0]).toBe("cs");
    Test.act(() => {
      languageListLastResult.current[1](["ua", "en"]); // set app languages ["ua", "en"] -> "en" (intersects with user languages)
    });
    expect(languageLastResult.current[0]).toBe("en");
    Test.act(() => {
      languageListLastResult.current[1](["ua", "de"]); // set app languages ["ua", "de"] -> "ua" (does not intersect with user languages)
    });
    expect(languageLastResult.current[0]).toBe("ua");
    Test.act(() => {
      userPreferencesLastResult.current[1]((v) => ({ ...v, languageList: ["de", "es"] })); // set user languages ["de", "es"] -> "de" (intersects with app languages)
    });
    expect(languageLastResult.current[0]).toBe("de");
    Test.act(() => {
      languageLastResult.current[1]("ua"); // setLanguage("ua") -> "ua"
    });
    expect(languageLastResult.current[0]).toBe("ua");
    // after setLanguage call above, the language can change only if languageList got restricted and current language is no longer there
    Test.act(() => {
      userPreferencesLastResult.current[1]((v) => ({ ...v, languageList: ["de", "cs"] })); // set user languages ["de", "cs"] -> keep "ua"
    });
    expect(languageLastResult.current[0]).toBe("ua");
    Test.act(() => {
      languageListLastResult.current[1](["ua", "de", "cs"]); // set app languages ["ua", "de", "cs"] -> keep "ua"
    });
    expect(languageLastResult.current[0]).toBe("ua");
    Test.act(() => {
      languageListLastResult.current[1](["en", "de"]); // set app languages ["en", "de"] -> "de" ("ua" is no longer in the list, and "de" is the most user-preferred)
    });
    expect(languageLastResult.current[0]).toBe("de");
  });
});
