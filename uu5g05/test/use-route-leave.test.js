import { useRouteLeave, RouteProvider, Environment, useRoute } from "uu5g05";
import { Test, Utils } from "uu5g05-test";
import { createRerenderableComponent } from "./internal/tools.js";

function renderHookInProvider(...initialHookParams) {
  let { HookComponent: RouteLeaveHookComponent, ...result } = Test.createHookComponent(() =>
    useRouteLeave(...initialHookParams),
  );
  let { HookComponent: RouteHookComponent, result: routeResult } = Test.createHookComponent(() => useRoute());
  let { rerender, Component } = createRerenderableComponent(({ renderPreventingComponent = true }) => (
    <RouteProvider>
      {renderPreventingComponent ? <RouteLeaveHookComponent /> : null}
      <RouteHookComponent />
    </RouteProvider>
  ));
  Test.render(<Component />);
  return {
    ...result,
    setRoute: (...args) =>
      Test.act(() => {
        routeResult.current?.[1]?.(...args);
      }),
    lastUu5Route: () => routeResult.current?.[0]?.uu5Route,
    setProviderProps: (newProps) => rerender(newProps),
  };
}

beforeEach(() => {
  history.replaceState(undefined, undefined, Environment.appBaseUri + "initialUc");
});

describe("[uu5g04-hooks] useRouteLeave", () => {
  it("result; should return expected API", async () => {
    let { result } = renderHookInProvider();
    expect(result.current).toEqual({
      allow: expect.any(Function),
      prevent: expect.any(Function),
    });
  });

  it("initialPrevented", async () => {
    let { result, setRoute, lastUu5Route } = renderHookInProvider({ initialPrevented: false });
    setRoute("nextUc");
    await Utils.wait();
    expect(lastUu5Route()).toBe("nextUc"); // not prevented, i.e. we got to the target UC
    expect(result.current).toEqual({
      allow: expect.any(Function),
      prevent: expect.any(Function),
    });

    // initialPrevented: true
    ({ result, setRoute, lastUu5Route } = renderHookInProvider());
    setRoute("nextUc2");
    await Utils.wait();
    expect(lastUu5Route()).toBe("nextUc"); // prevented, i.e. we're still at the previous UC
    expect(result.current).toEqual({
      allow: expect.any(Function),
      prevent: expect.any(Function),
      nextRoute: expect.any(Object),
      refuse: expect.any(Function),
    });
  });

  it("result prevent()", async () => {
    let { result, setRoute, lastUu5Route, setProviderProps } = renderHookInProvider({ initialPrevented: false });
    Test.act(() => {
      result.current?.prevent?.();
    });
    setRoute("nextUc");
    await Utils.wait();
    expect(lastUu5Route()).toBe("initialUc");

    // if component with useRouteLeave unmounts, it should unregister its prevention
    setProviderProps({ renderPreventingComponent: false });
    expect(lastUu5Route()).toBe("nextUc");
  });

  it("result allow(); before navigation - should remove prevention", async () => {
    let { result, setRoute, lastUu5Route } = renderHookInProvider();
    Test.act(() => {
      result.current?.allow?.();
    });
    setRoute("nextUc");
    await Utils.wait();
    expect(lastUu5Route()).toBe("nextUc");
  });

  it("result allow(); while route-leave-dialog is being shown - should confirm leave", async () => {
    let { result, setRoute, lastUu5Route } = renderHookInProvider();
    setRoute("nextUc");
    await Utils.wait();
    Test.act(() => {
      result.current?.allow?.();
    });
    expect(lastUu5Route()).toBe("nextUc");
  });

  it("result refuse(); should refuse to leave & keep prevention active", async () => {
    let { result, setRoute, lastUu5Route } = renderHookInProvider();
    setRoute("nextUc");
    await Utils.wait();
    Test.act(() => {
      result.current?.refuse?.();
    });
    expect(lastUu5Route()).toBe("initialUc");
    setRoute("nextUcAttempt2");
    await Utils.wait();
    expect(lastUu5Route()).toBe("initialUc");
    Test.act(() => {
      result.current?.allow?.();
    });
    await Utils.wait();
    expect(lastUu5Route()).toBe("nextUcAttempt2");
  });
});
