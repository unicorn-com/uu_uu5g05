import { useRouter, RouteProvider, Environment, useRoute, ErrorBoundary, Utils as Uu5Utils } from "uu5g05";
import { Test, Utils } from "uu5g05-test";

function renderHookInProvider(...initialHookParams) {
  let { HookComponent, ...result } = Test.createHookComponent((props) => useRouter(...props), {
    initialProps: initialHookParams,
  });
  let { HookComponent: RouteHookComponent, result: routeResult } = Test.createHookComponent(() => useRoute());
  let lastError = Uu5Utils.Component.createRef();
  let Err = ({ error }) => {
    lastError.current = error;
    return null;
  };
  Test.render(
    <ErrorBoundary fallback={Err}>
      <RouteProvider>
        <HookComponent>{(lastResult) => lastResult ?? null}</HookComponent>
        <RouteHookComponent />
      </RouteProvider>
    </ErrorBoundary>,
  );
  return {
    ...result,
    setRoute: (...args) => routeResult.current?.[1]?.(...args),
    lastError,
  };
}

const ROUTE_MAP1 = {
  initialUc: () => "initial use case as function",
  redirectUc: { redirect: "redirected" },
  redirected: () => "Redirected",
  rewriteUc: { rewrite: "rewritten" },
  rewritten: () => "Rewritten",
  jsxUc: <span>JSX content</span>,
  componentUc: { component: <span>Custom component</span> },
  skipHistoryUc: { skipHistory: true, component: () => "Content with skipHistory" },
  multi1A: { redirect: "multi1B" },
  multi1B: { redirect: "multi1C" },
  multi1C: { rewrite: "multi1Final", skipHistory: true },
  multi1Final: () => "Multi1 Final",
  "*": () => "star fallback",
};

const CYCLIC_ROUTE_MAP = {
  initialUc: ROUTE_MAP1.initialUc,
  cyclic1A: { redirect: "cyclic1A" },
  cyclic2A: { redirect: "cyclic2B" },
  cyclic2B: { rewrite: "cyclic2C" },
  cyclic2C: { rewrite: "cyclic2A" },
  "*": { redirect: "cyclic" }, // "cyclic" goes back here
};

beforeEach(() => {
  history.replaceState(undefined, undefined, Environment.appBaseUri + "initialUc");
});

describe("[uu5g04-hooks] useRouter", () => {
  it("routeMap", async () => {
    let historyLength = history.length;
    let { setRoute, lastError } = renderHookInProvider(ROUTE_MAP1);
    expect(Test.screen.getByText("initial use case as function")).toBeInTheDocument();

    // redirect
    Test.act(() => {
      setRoute("redirectUc", { param: "value" }, "frag");
    });
    await Utils.wait();
    expect(location.pathname).toMatch(/\/redirected$/);
    expect(location.search).toBe("?param=value");
    expect(location.hash).toBe("#frag");
    expect(Test.screen.getByText("Redirected")).toBeInTheDocument();
    expect(history.length).toBe(historyLength + 1);
    historyLength = history.length;

    // rewrite
    Test.act(() => {
      setRoute("rewriteUc", { param2: "value2" }, "frag2");
    });
    await Utils.wait();
    expect(location.pathname).toMatch(/\/rewriteUc$/);
    expect(location.search).toBe("?param2=value2");
    expect(location.hash).toBe("#frag2");
    expect(Test.screen.getByText("Rewritten")).toBeInTheDocument();
    expect(history.length).toBe(historyLength + 1);
    historyLength = history.length;

    // JSX
    Test.act(() => {
      setRoute("jsxUc", { param: "value" }, "frag");
    });
    await Utils.wait();
    expect(location.pathname).toMatch(/\/jsxUc$/);
    expect(location.search).toBe("?param=value");
    expect(location.hash).toBe("#frag");
    expect(Test.screen.getByText("JSX content")).toBeInTheDocument();
    expect(history.length).toBe(historyLength + 1);
    historyLength = history.length;

    // skip history
    Test.act(() => {
      setRoute("skipHistoryUc", { param2: "value2" }, "frag2");
    });
    await Utils.wait();
    expect(location.pathname).toMatch(/\/skipHistoryUc$/);
    expect(location.search).toBe("?param2=value2");
    expect(location.hash).toBe("#frag2");
    expect(Test.screen.getByText("Content with skipHistory")).toBeInTheDocument();
    expect(history.length).toBe(historyLength + 1);
    historyLength = history.length;

    // custom component
    Test.act(() => {
      setRoute("componentUc", { param: "value" }, "frag");
    });
    await Utils.wait();
    expect(location.pathname).toMatch(/\/componentUc$/);
    expect(location.search).toBe("?param=value");
    expect(location.hash).toBe("#frag");
    expect(Test.screen.getByText("Custom component")).toBeInTheDocument();
    expect(history.length).toBe(historyLength); // should be same as previous (previous route had skipHistory: true)
    historyLength = history.length;

    // "*" route
    Test.act(() => {
      setRoute("elsewhere", { param2: "value2" }, "frag2");
    });
    await Utils.wait();
    expect(location.pathname).toMatch(/\/elsewhere$/);
    expect(location.search).toBe("?param2=value2");
    expect(location.hash).toBe("#frag2");
    expect(Test.screen.getByText("star fallback")).toBeInTheDocument();
    expect(history.length).toBe(historyLength + 1);
    historyLength = history.length;

    // "multi1A" -> ... "multi1Final" chain
    Test.act(() => {
      setRoute("multi1A", { param: "value" }, "frag");
    });
    await Utils.wait();
    expect(location.pathname).toMatch(/\/multi1C$/); // because multi1C -> multi1Final is rewrite, i.e. URL should contain multi1C
    expect(location.search).toBe("?param=value");
    expect(location.hash).toBe("#frag");
    expect(Test.screen.getByText("Multi1 Final")).toBeInTheDocument();
    expect(history.length).toBe(historyLength + 1);
    historyLength = history.length;
    Test.act(() => {
      setRoute("elsewhere");
    });
    await Utils.wait();
    expect(history.length).toBe(historyLength); // should be same as previous (previous route had skipHistory: true)
    expect(location.search).toBe("");
    expect(location.hash).toBe("");

    // cyclic chain 1
    Utils.omitConsoleLogs(/cyclic/i);
    history.replaceState(undefined, undefined, Environment.appBaseUri + "initialUc");
    ({ setRoute, lastError } = renderHookInProvider(CYCLIC_ROUTE_MAP));
    Test.act(() => {
      setRoute("cyclic1A");
    });
    await Utils.wait();
    expect(lastError.current + "").toMatch(/cyclic/i);
    expect(lastError.current + "").toContain("cyclic1A -> cyclic1A");

    // cyclic chain 2
    history.replaceState(undefined, undefined, Environment.appBaseUri + "initialUc");
    ({ setRoute, lastError } = renderHookInProvider(CYCLIC_ROUTE_MAP));
    Test.act(() => {
      setRoute("cyclic2A");
    });
    await Utils.wait();
    expect(lastError.current + "").toMatch(/cyclic/i);
    expect(lastError.current + "").toContain("cyclic2A -> cyclic2B -> cyclic2C -> cyclic2A");

    // cyclic chain 3
    history.replaceState(undefined, undefined, Environment.appBaseUri + "initialUc");
    ({ setRoute, lastError } = renderHookInProvider(CYCLIC_ROUTE_MAP));
    Test.act(() => {
      setRoute("cyclic3A");
    });
    await Utils.wait();
    expect(lastError.current + "").toMatch(/cyclic/i);
    expect(lastError.current + "").toContain("cyclic3A -> cyclic -> cyclic");
  });
});
