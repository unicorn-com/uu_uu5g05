import { createComponent, Environment, useRouteParams, RouteProvider, withRouteParamsProvider, useRoute } from "uu5g05";
import { Test } from "uu5g05-test";
import UuDataTypes from "uu_datatypesg01";
import { createRerenderableComponent } from "./internal/tools.js";

let TestComponent = createComponent({
  nestingLevel: ["route"],
  render(props) {
    return props.children;
  },
});

TestComponent = withRouteParamsProvider(TestComponent, {
  param1: UuDataTypes.string,
  param2: UuDataTypes.string,
});

function useRouteAndRouteParams() {
  const [route, setRoute] = useRoute();
  const [routeParams, setRouteParams] = useRouteParams();
  return { route, setRoute, routeParams, setRouteParams };
}

function renderHookInProvider(hook) {
  let { rerender, Component } = createRerenderableComponent((props) => (
    <RouteProvider {...props}>
      <TestComponent nestingLevel="route">{props.children}</TestComponent>
    </RouteProvider>
  ));
  let result = Test.renderHook((props) => hook(...props), {
    initialProps: [],
    wrapper: Component,
  });
  return {
    ...result,
    setProviderProps: (newProps) => rerender(newProps),
  };
}

const INITIAL_UC = "initialUc";

describe("useRouteParams", () => {
  it("should return current route params", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1`);

    // when
    const { result } = renderHookInProvider(useRouteParams);

    // then
    expect(result.current[0]).toEqual({ param1: "value1" });
  });

  it("should not return extra route params", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1&param3=value3`);

    // when
    const { result } = renderHookInProvider(useRouteParams);

    // then
    expect(result.current[0]).toEqual({ param1: "value1" });
  });

  it("should set new route params", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1`);
    const initialHistoryLength = history.length;

    // when
    const { result } = renderHookInProvider(useRouteParams);
    Test.act(() => {
      result.current[1]({ param1: "value2" });
    });

    // then
    expect(result.current[0]).toEqual({ param1: "value2" });
    expect(history.length).toBe(initialHistoryLength);
  });

  it("should set new route params with callback", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1`);
    const initialHistoryLength = history.length;

    // when
    const { result } = renderHookInProvider(useRouteParams);
    Test.act(() => {
      result.current[1](({ params, options }) => ({ params: { param1: "value2" }, options }));
    });

    // then
    expect(result.current[0]).toEqual({ param1: "value2" });
    expect(history.length).toBe(initialHistoryLength);
  });

  it("should preserve fragment if replacing route", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1#frag`);
    const initialHistoryLength = history.length;

    // when
    const { result } = renderHookInProvider(useRouteAndRouteParams);
    Test.act(() => {
      result.current.setRouteParams({ param1: "value2" });
    });

    // then
    expect(result.current.routeParams).toEqual({ param1: "value2" });
    expect(result.current.route?.fragment).toEqual("frag");
    expect(history.length).toBe(initialHistoryLength);
  });

  it("should not preserve fragment if adding new route (not replacing previous)", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1#frag`);
    const initialHistoryLength = history.length;

    // when
    const { result } = renderHookInProvider(useRouteAndRouteParams);
    Test.act(() => {
      result.current.setRouteParams({ param1: "value2" }, { replace: false });
    });

    // then
    expect(result.current.routeParams).toEqual({ param1: "value2" });
    expect(result.current.route?.fragment).toEqual(undefined);
    expect(history.length).toBe(initialHistoryLength + 1);
  });

  it("should return current values in setParams callback", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1`);

    // when
    const { result } = renderHookInProvider(useRouteParams);
    let currentParams;
    Test.act(() => {
      result.current[1](({ params, options }) => {
        currentParams = { ...params };
        return { params: { param1: "value2" }, options };
      });
    });

    // then
    expect(currentParams).toEqual({ param1: "value1" });
  });

  it("should return current values in setParams callback immediately after calling previous setParams", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1&param2=value2`);
    const initialHistoryLength = history.length;

    // when
    const { result } = renderHookInProvider(useRouteParams);
    let currentParams;
    Test.act(() => {
      result.current[1]({ param1: "param1_value2" }, { replace: false });
      result.current[1](({ params, options }) => {
        currentParams = { ...params };
        return { params: { ...params, param2: "param2_value2" }, options: { replace: false } };
      });
    });

    // then
    expect(currentParams).toEqual({ param1: "param1_value2" });
    expect(result.current[0]).toEqual({ param1: "param1_value2", param2: "param2_value2" });
    expect(history.length).toBe(initialHistoryLength + 1);
  });

  it("should not replace history when setRouteParams called concurrently with different replace option", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1`);
    const initialHistoryLength = history.length;

    // when
    const { result } = renderHookInProvider(useRouteParams);
    Test.act(() => {
      result.current[1]({ param1: "value2" }, { replace: false });
      result.current[1]({ param1: "value3" });
    });

    // then
    expect(history.length).toBe(initialHistoryLength + 1);
  });

  it("should set extra parameter in new route params", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1`);
    const initialHistoryLength = history.length;

    // when
    const { result } = renderHookInProvider(useRouteParams);
    Test.act(() => {
      result.current[1]({ param1: "value2", param3: "value3" });
    });

    // then
    expect(result.current[0]).toEqual({ param1: "value2" });
    expect(history.state.params).toEqual({ param1: "value2", param3: "value3" });
    expect(history.length).toBe(initialHistoryLength);
  });

  it("should work with useRoute.setRoute called concurrently", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1`);

    // when
    const { result } = renderHookInProvider(useRouteAndRouteParams);
    Test.act(() => {
      result.current.setRoute(INITIAL_UC, { param1: "value2" }, { replace: false });
      result.current.setRouteParams({ param1: "value3" });
    });

    // then
    expect(result.current.routeParams).toEqual({ param1: "value3" });
  });

  it("should work with useRoute.setRoute called concurrently using callback", async () => {
    // given
    history.replaceState(undefined, undefined, `${Environment.appBaseUri}${INITIAL_UC}?param1=value1`);

    // when
    const { result } = renderHookInProvider(useRouteAndRouteParams);
    let currentParams1;
    let currentParams2;
    Test.act(() => {
      result.current.setRoute(INITIAL_UC, { param1: "value2" }, { replace: false });
      result.current.setRouteParams(({ params, options }) => {
        currentParams1 = { ...params };
        return { params: { param1: "value3" }, options };
      });
      result.current.setRoute(({ uu5Route, params, options }) => {
        currentParams2 = { ...params };
        return { uu5Route, params: { param1: "value4" }, options };
      });
    });

    // then
    expect(currentParams1).toEqual({ param1: "value2" });
    expect(currentParams2).toEqual({ param1: "value3" });
    expect(result.current.routeParams).toEqual({ param1: "value4" });
  });
});
