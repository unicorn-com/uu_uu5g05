import { useRoute, RouteProvider, Environment } from "uu5g05";
import { Test } from "uu5g05-test";
import { createRerenderableComponent } from "./internal/tools.js";

function renderHookInProvider(providerProps, ...initialHookParams) {
  let { rerender, Component } = createRerenderableComponent((props) => <RouteProvider {...props} />, providerProps);
  let result = Test.renderHook((props) => useRoute(...props), { initialProps: initialHookParams, wrapper: Component });
  return {
    ...result,
    setProviderProps: (newProps) => rerender(newProps),
  };
}

beforeEach(() => {
  history.replaceState(undefined, undefined, Environment.appBaseUri + "initialUc");
});

describe("[uu5g04-hooks] useRoute", () => {
  it("result; should return current route", async () => {
    let { result } = renderHookInProvider();
    expect(result.current).toEqual([{ uu5Route: "initialUc", params: {} }, expect.any(Function)]);
  });

  it("result setRoute(uu5Route, params)", async () => {
    let startHistoryLength = history.length;
    let { result } = renderHookInProvider();
    Test.act(() => {
      result.current?.[1]?.("newUc", { foo: "bar" });
    });
    expect(result.current?.[0]).toEqual({
      uu5Route: "newUc",
      params: { foo: "bar" },
      prevRoute: { uu5Route: "initialUc", params: {} },
    });
    expect(history.length).toBe(startHistoryLength + 1);
  });

  it("result setRoute(uu5Route, params, fragment)", async () => {
    let startHistoryLength = history.length;
    let { result } = renderHookInProvider();
    Test.act(() => {
      result.current?.[1]?.("newUc", { foo: "bar" }, "frag");
    });
    expect(result.current?.[0]).toEqual({
      uu5Route: "newUc",
      params: { foo: "bar" },
      fragment: "frag",
      prevRoute: { uu5Route: "initialUc", params: {} },
    });
    expect(history.length).toBe(startHistoryLength + 1);
  });

  it("result setRoute(uu5Route, params, { replace })", async () => {
    let startHistoryLength = history.length;
    let { result } = renderHookInProvider();
    Test.act(() => {
      result.current?.[1]?.("newUc", { foo: "bar" }, { replace: false });
    });
    expect(result.current?.[0]).toEqual({
      uu5Route: "newUc",
      params: { foo: "bar" },
      prevRoute: { uu5Route: "initialUc", params: {} },
    });
    expect(history.length).toBe(startHistoryLength + 1);

    Test.act(() => {
      result.current?.[1]?.("newUc2", { foo: "bar2" }, { replace: true });
    });
    expect(result.current?.[0]).toEqual({
      uu5Route: "newUc2",
      params: { foo: "bar2" },
      prevRoute: { uu5Route: "initialUc", params: {} }, // prevRoute of replaced one
    });
    expect(history.length).toBe(startHistoryLength + 1);
  });

  it("result setRoute(uu5Route, params, { skipHistory })", async () => {
    let startHistoryLength = history.length;
    let { result } = renderHookInProvider();
    Test.act(() => {
      result.current?.[1]?.("newUc", { foo: "bar" }, { skipHistory: true });
    });
    expect(result.current?.[0]).toEqual({
      uu5Route: "newUc",
      params: { foo: "bar" },
      prevRoute: { uu5Route: "initialUc", params: {} },
    });
    expect(history.length).toBe(startHistoryLength + 1);

    Test.act(() => {
      result.current?.[1]?.("newUc2", { foo: "bar2" }, "frag", { skipHistory: false });
    });
    expect(result.current?.[0]).toEqual({
      uu5Route: "newUc2",
      params: { foo: "bar2" },
      fragment: "frag",
      prevRoute: { uu5Route: "newUc", params: { foo: "bar" } },
    });
    expect(history.length).toBe(startHistoryLength + 1); // previous skipHistory route gets replaced

    Test.act(() => {
      result.current?.[1]?.("newUc3");
    });
    expect(result.current?.[0]).toEqual({
      uu5Route: "newUc3",
      prevRoute: { uu5Route: "newUc2", params: { foo: "bar2" }, fragment: "frag" },
    });
    expect(history.length).toBe(startHistoryLength + 2);
  });

  it("result setRoute(uu5Route, params, { component })", async () => {
    let component = <span>Test content</span>;
    let { result } = renderHookInProvider();
    Test.act(() => {
      result.current?.[1]?.("newUc", { foo: "bar" }, { component });
    });
    expect(result.current?.[0]).toEqual({
      uu5Route: "newUc",
      params: { foo: "bar" },
      prevRoute: { uu5Route: "initialUc", params: {} },
      component,
    });
  });

  it("RouteProvider prop initialRoute", async () => {
    let { result, setProviderProps } = renderHookInProvider({
      initialRoute: { uu5Route: "useCase2", params: { foo: 0 }, fragment: "frag" },
    });
    expect(result.current?.[0]).toEqual({ uu5Route: "useCase2", params: { foo: 0 }, fragment: "frag" });

    // changing initialRoute should not do anything
    setProviderProps({ initialRoute: { uu5Route: "abc", params: { foo: 30 } } });
    expect(result.current?.[0]).toEqual({ uu5Route: "useCase2", params: { foo: 0 }, fragment: "frag" });
  });

  it("history.back()/go(1) should navigate to previous/next route", async () => {
    let { result } = renderHookInProvider();
    Test.act(() => {
      result.current?.[1]?.("newUc");
    });
    expect(result.current?.[0]?.uu5Route).toBe("newUc");

    // NOTE JSDOM's History API uses several setTimeout calls leading to re-rendering of RouteProvider (due to "popstate" event),
    // but effects do not get flushed by React because the setTimeout callback is outside of act() call:
    // a) we can use Utils.wait() which flushes them at the end, but some effects in RouteProvider end up doing additional
    //    History API calls, which again results in JSDOM's setTimeout, so we would have to do several Utils.wait() calls
    //    in succession.
    // b) use Test.waitFor() instead (which flushes effect every ~50ms, with total timeout ~1000ms) until expectation is met.
    Test.act(() => {
      history.back();
    });
    await Test.waitFor(() => {
      expect(result.current?.[0]?.uu5Route).toBe("initialUc");
    });

    Test.act(() => {
      history.go(1);
    });
    await Test.waitFor(() => {
      expect(result.current?.[0]?.uu5Route).toBe("newUc");
    });
  });
});
