import { useUserPreferences, UserPreferencesProvider } from "uu5g05";
import { Test } from "uu5g05-test";
import { userPreferencesContextDefaultValues } from "../src/contexts/user-preferences-context.js";
import { createRerenderableComponent } from "./internal/tools.js";

const USER_PREFERENCES1 = {
  timeZone: "Europe/Prague",
  shortDateFormat: "M. YY",
  mediumDateFormat: "M. D. Y",
  longDateFormat: "MM. DD. Y",
  weekStartDay: 7,
  hourFormat: 12,
  languageList: ["en-us", "cs-cz"],
  numberGroupingSeparator: "-",
  numberDecimalSeparator: "_",
  currency: "USD",
  currencyGroupingSeparator: "/",
  currencyDecimalSeparator: "*",
};

const USER_PREFERENCES2 = {
  timeZone: "Asia/Vladivostok",
  shortDateFormat: "MM. YY",
  mediumDateFormat: "MM. D. Y",
  longDateFormat: "M. D. Y",
  weekStartDay: 1,
  hourFormat: 24,
  languageList: ["en-us", "sk-sk"],
  numberGroupingSeparator: " ",
  numberDecimalSeparator: ",",
  currency: "EUR",
  currencyGroupingSeparator: " ",
  currencyDecimalSeparator: ",",
};

function renderHookInProvider(providerProps, ...initialHookParams) {
  let { rerender, Component } = createRerenderableComponent(
    (props) => <UserPreferencesProvider {...props} />,
    providerProps,
  );
  let result = Test.renderHook((props) => useUserPreferences(...props), {
    initialProps: initialHookParams,
    wrapper: Component,
  });
  return {
    ...result,
    setProviderProps: (newProps) => rerender(newProps),
  };
}

describe("[uu5g04-hooks] useUserPreferences", () => {
  it("result, timeZone; should return default timeZone", async () => {
    let { result } = Test.renderHook(() => useUserPreferences());
    expect(result.current).toEqual([userPreferencesContextDefaultValues.userPreferences, undefined]);
  });

  it("result, timeZone; should return context timeZone", async () => {
    let { result } = renderHookInProvider(USER_PREFERENCES1);
    expect(result.current).toEqual([USER_PREFERENCES1, expect.any(Function)]);
  });

  it("result setUserPreferences(newUserPreferences); should change user preferences", async () => {
    let { result } = renderHookInProvider(USER_PREFERENCES1);

    expect(result.current?.[0]).toEqual(USER_PREFERENCES1);
    Test.act(() => {
      result.current[1](USER_PREFERENCES2);
    });
    expect(result.current?.[0]).toEqual(USER_PREFERENCES2);
  });

  it("UserPreferencesProvider prop onChange; should receive new user preferences", async () => {
    let onChange = jest.fn();
    let { result, setProviderProps } = renderHookInProvider({ ...USER_PREFERENCES1, onChange });

    expect(result.current?.[0]).toEqual(USER_PREFERENCES1);
    Test.act(() => {
      result.current[1](USER_PREFERENCES2);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith(USER_PREFERENCES2);
    expect(result.current?.[0]).toEqual(USER_PREFERENCES1); // not updated because we didn't propagate value from onChange to prop

    setProviderProps({ ...USER_PREFERENCES2, onChange });
    expect(result.current?.[0]).toEqual(USER_PREFERENCES2);
  });
});
