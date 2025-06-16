import { useTimeZone, TimeZoneProvider } from "uu5g05";
import { Test } from "uu5g05-test";
import { createRerenderableComponent } from "./internal/tools.js";

describe("[uu5g04-hooks] useTimeZone", () => {
  it("result, timeZone; should return default timeZone", async () => {
    let { result } = Test.renderHook(() => useTimeZone());
    expect(result.current).toEqual(["Europe/Prague", expect.any(Function)]);
  });

  it("result, timeZone; should return context timeZone", async () => {
    let { result } = Test.renderHook(() => useTimeZone(), {
      wrapper: ({ children }) => <TimeZoneProvider timeZone="America/Los_Angeles">{children} </TimeZoneProvider>,
    });
    expect(result.current?.[0]).toEqual("America/Los_Angeles");
  });

  it("result, setTimeZone; should re-render with new timeZone", async () => {
    let onChangeFn = jest.fn();
    let { rerender, Component } = createRerenderableComponent((props) => (
      <TimeZoneProvider timeZone="America/Los_Angeles" onChange={onChangeFn} {...props} />
    ));
    let { result } = Test.renderHook(() => useTimeZone(), { wrapper: Component });

    Test.act(() => {
      result.current[1]("Asia/Vladivostok");
    });
    expect(onChangeFn).toHaveBeenCalledTimes(1);
    expect(onChangeFn).toHaveBeenCalledWith({ timeZone: "Asia/Vladivostok" });
    expect(result.current?.[0]).toEqual("America/Los_Angeles"); // not updated because we didn't propagate value from onChange to prop

    rerender({ timeZone: "Europe/Prague" });
    expect(result.current?.[0]).toEqual("Europe/Prague");
  });
});
