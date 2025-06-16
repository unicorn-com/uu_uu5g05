import React from "react";
import Uu5, { useDynamicLibraryComponent, Suspense, Utils as Uu5Utils } from "uu5g05";
import { Test, Utils } from "uu5g05-test";

function TestComponent() {
  return null;
}

let counter = 0;
const CREATE_LIBRARY_DEMO_JSON = () => ({
  name: "uu5g05-demo" + counter,
  code: "Uu5Demo" + counter,
  sourceUri: `http://localhost/foo${counter++}.js`,
  dependencyMap: {},
});

const LIBRARY_EXPORTS = {
  TestComponent,
};

// restore "initial" state of library registry after each test
let origLibraryMap = JSON.parse(JSON.stringify(Uu5Utils.LibraryRegistry._libraryMap));
let origNamespaceMap = JSON.parse(JSON.stringify(Uu5Utils.LibraryRegistry._namespaceMap));
afterEach(() => {
  let cleanup = (map, origMap) => {
    for (let k in map) delete map[k];
    Object.assign(map, origMap);
  };
  cleanup(Uu5Utils.LibraryRegistry._libraryMap, origLibraryMap);
  cleanup(Uu5Utils.LibraryRegistry._namespaceMap, origNamespaceMap);
  Uu5Utils.LibraryRegistry._loadLibraryCache = {};
});

// mock Uu5Utils.LibraryRegistry.getLibrary
let origGetLibrary;
beforeEach(() => {
  origGetLibrary = Uu5Utils.LibraryRegistry.getLibrary;
  Uu5Utils.LibraryRegistry.getLibrary = jest.fn(async () => {
    throw new Error(
      "Uu5Utils.LibraryRegistry.getLibrary was called unexpectedly. Test should mock the call to return necessary data.",
    );
  });
});
afterEach(() => {
  Uu5Utils.LibraryRegistry.getLibrary = origGetLibrary;
});

// mock Uu5Utils.Uu5Loader methods
let origUu5Loader = {};
beforeEach(() => {
  origUu5Loader.import = Uu5Utils.Uu5Loader.import;
  Uu5Utils.Uu5Loader.import = jest.fn(async () => {
    throw new Error(
      "Uu5Utils.Uu5Loader.import was called unexpectedly. Test should mock the call to return necessary data.",
    );
  });
  origUu5Loader.get = Uu5Utils.Uu5Loader.get;
  Uu5Utils.Uu5Loader.get = jest.fn((nameOrUrl) =>
    nameOrUrl.startsWith("http://localhost/foo")
      ? LIBRARY_EXPORTS
      : nameOrUrl === "uu5g05" || nameOrUrl === "/uu5g05.js"
        ? Uu5
        : origUu5Loader.get(nameOrUrl),
  );
  origUu5Loader.resolve = Uu5Utils.Uu5Loader.resolve;
  Uu5Utils.Uu5Loader.resolve = jest.fn(origUu5Loader.resolve);
});
afterEach(() => {
  Object.assign(Uu5Utils.Uu5Loader, origUu5Loader);
});

describe("[uu5g05] useDynamicLibraryComponent", () => {
  it("should return expected result API", async () => {
    let { result } = Test.renderHook(() => useDynamicLibraryComponent("div"));
    expect(result.current).toMatchObject({ Component: "div", errorData: null, state: "ready" });
  });

  it("should return primitive (HTML) component without load", async () => {
    let { result } = Test.renderHook(() => useDynamicLibraryComponent("div"));
    expect(result.current).toMatchObject({ Component: "div", errorData: null, state: "ready" });
  });

  it("should return already present component without load", async () => {
    Uu5Utils.Uu5Loader.config({ imports: { uu5g05: "/uu5g05.js" } });
    Uu5Utils.Uu5Loader.resolve.mockImplementation((name) => name);
    Uu5Utils.Uu5Loader.import.mockImplementation((name) => {
      throw new Error(`Uu5Loader.import(${JSON.stringify(name)}) should not have been called.`);
    });
    let { result } = Test.renderHook(() => useDynamicLibraryComponent("Uu5.Suspense"));
    expect(result.current).toMatchObject({ Component: Suspense, errorData: null, state: "ready" });

    // should return it even if it is nested deeper (should not try to load "Uu5g05.Utils")
    ({ result } = Test.renderHook(() => useDynamicLibraryComponent("Uu5.Utils.Dom"))); // TODO Use an actual React component, not just class.
    expect(result.current).toMatchObject({ Component: Uu5Utils.Dom, errorData: null, state: "ready" });
  });

  it("should load component (success), including firing of state change events", async () => {
    let json = CREATE_LIBRARY_DEMO_JSON();
    Uu5Utils.LibraryRegistry.getLibrary.mockImplementation(async () => json);
    Uu5Utils.Uu5Loader.import.mockImplementation(async (name) => {
      if (name === json.name) return LIBRARY_EXPORTS;
      throw new Error(`Unexpected Uu5Loader.import(${JSON.stringify(name)}) call.`);
    });
    const handleStateChange = jest.fn();
    Uu5Utils.EventManager.register("Uu5.useDynamicLibraryComponent.stateChange", handleStateChange);

    let { result } = Test.renderHook(() => useDynamicLibraryComponent(`${json.code}.TestComponent`));
    expect(result.current).toMatchObject({ Component: null, errorData: null, state: "pendingNoData" });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).lastCalledWith(expect.objectContaining({ data: { pendingCount: 1 } }));
    handleStateChange.mockClear();

    await Utils.wait();
    expect(result.current).toMatchObject({ Component: TestComponent, errorData: null, state: "ready" });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).lastCalledWith(expect.objectContaining({ data: { pendingCount: 0 } }));
    handleStateChange.mockClear();
  });

  it("should load component (error - component not in exports)", async () => {
    let json = CREATE_LIBRARY_DEMO_JSON();
    Uu5Utils.LibraryRegistry.getLibrary.mockImplementation(async () => json);
    Uu5Utils.Uu5Loader.import.mockImplementation(async (name) => {
      if (name === json.name) return {};
      throw new Error(`Unexpected Uu5Loader.import(${JSON.stringify(name)}) call.`);
    });
    const handleStateChange = jest.fn();
    Uu5Utils.EventManager.register("Uu5.useDynamicLibraryComponent.stateChange", handleStateChange);

    let { result } = Test.renderHook(() => useDynamicLibraryComponent(`${json.code}.MissingComponent`));
    expect(result.current).toMatchObject({ Component: null, errorData: null, state: "pendingNoData" });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).lastCalledWith(expect.objectContaining({ data: { pendingCount: 1 } }));
    handleStateChange.mockClear();

    await Utils.wait();
    expect(result.current).toMatchObject({
      Component: null,
      errorData: { error: { code: "COMPONENT_MISSING" } },
      state: "errorNoData",
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).lastCalledWith(expect.objectContaining({ data: { pendingCount: 0 } }));
    handleStateChange.mockClear();
  });

  it("should load component (error - loading library registry JSON failed)", async () => {
    let json = CREATE_LIBRARY_DEMO_JSON();
    Uu5Utils.LibraryRegistry.getLibrary.mockImplementation(async () => {
      throw new Error("Getting library registry JSON failed.");
    });
    Utils.omitConsoleLogs(`Error loading ${json.code}.TestComponent`);

    let { result } = Test.renderHook(() => useDynamicLibraryComponent(`${json.code}.TestComponent`));
    expect(result.current).toMatchObject({ Component: null, errorData: null, state: "pendingNoData" });
    await Utils.wait();
    expect(result.current).toMatchObject({
      Component: null,
      errorData: { error: { code: "LIBRARY_JSON_LOAD_FAILURE" } },
      state: "errorNoData",
    });
  });

  it("should load component (error - missing 'sourceUri' in library registry JSON)", async () => {
    let json = { ...CREATE_LIBRARY_DEMO_JSON(), sourceUri: null };
    Uu5Utils.LibraryRegistry.getLibrary.mockImplementation(async () => json);
    Utils.omitConsoleLogs(`Error loading ${json.code}.TestComponent`);

    let { result } = Test.renderHook(() => useDynamicLibraryComponent(`${json.code}.TestComponent`));
    expect(result.current).toMatchObject({ Component: null, errorData: null, state: "pendingNoData" });
    await Utils.wait();
    expect(result.current).toMatchObject({
      Component: null,
      errorData: { error: { code: "LIBRARY_MISSING_SOURCE" } },
      state: "errorNoData",
    });
  });

  it("should load component once even if using multiple hooks with same component name", async () => {
    let json = CREATE_LIBRARY_DEMO_JSON();
    Uu5Utils.LibraryRegistry.getLibrary.mockImplementation(async () => json);
    Uu5Utils.Uu5Loader.import.mockImplementation(async (name) => {
      if (name === json.name) return LIBRARY_EXPORTS;
      throw new Error(`Unexpected Uu5Loader.import(${JSON.stringify(name)}) call.`);
    });

    let lastResult1Ref = Uu5Utils.Component.createRef();
    const TestComponent1 = (props) => {
      lastResult1Ref.current = useDynamicLibraryComponent(`${json.code}.TestComponent`);
      return null;
    };
    let lastResult2Ref = Uu5Utils.Component.createRef();
    const TestComponent2 = (props) => {
      lastResult2Ref.current = useDynamicLibraryComponent(`${json.code}.TestComponent`);
      return null;
    };
    Test.render(
      <div>
        <TestComponent1 />
        <TestComponent2 />
      </div>,
    );

    expect(lastResult1Ref.current).toMatchObject({ Component: null, errorData: null, state: "pendingNoData" });
    expect(lastResult2Ref.current).toMatchObject({ Component: null, errorData: null, state: "pendingNoData" });
    await Utils.wait();
    expect(lastResult1Ref.current).toMatchObject({ Component: TestComponent, errorData: null, state: "ready" });
    expect(lastResult2Ref.current).toMatchObject({ Component: TestComponent, errorData: null, state: "ready" });
    expect(Uu5Utils.LibraryRegistry.getLibrary).toHaveBeenCalledTimes(1);
  });
});
