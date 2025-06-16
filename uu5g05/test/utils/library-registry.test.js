import Uu5, { Utils, createComponent, useDynamicLibraryComponent } from "uu5g05";
import { Test, Utils as TestUtils } from "uu5g05-test";

const TestComponent = createComponent({
  uu5Tag: "Uu5Demo.TestComponent",
  render(props) {
    return null;
  },
});
const TestComponent2 = createComponent({
  uu5Tag: "Uu5Demo.TestComponent2",
  render(props) {
    return null;
  },
});

const LIBRARY_DEMO_JSON = {
  name: "uu5g05-demo",
  code: "Uu5Demo",
  sourceUri: "http://localhost/foo.js",
  dependencyMap: {},
};

const LIBRARY_EXPORTS = {
  TestComponent,
};

// restore "initial" state of library registry after each test
let origLibraryMap = JSON.parse(JSON.stringify(Utils.LibraryRegistry._libraryMap));
let origNamespaceMap = JSON.parse(JSON.stringify(Utils.LibraryRegistry._namespaceMap));
afterEach(() => {
  let cleanup = (map, origMap) => {
    for (let k in map) delete map[k];
    Object.assign(map, origMap);
  };
  cleanup(Utils.LibraryRegistry._libraryMap, origLibraryMap);
  cleanup(Utils.LibraryRegistry._namespaceMap, origNamespaceMap);
  Utils.LibraryRegistry._loadLibraryCache = {};
});

// mock Utils.LibraryRegistry.getLibrary
let origGetLibrary;
beforeEach(() => {
  origGetLibrary = Utils.LibraryRegistry.getLibrary;
  Utils.LibraryRegistry.getLibrary = jest.fn(async () => {
    throw new Error(
      "Utils.LibraryRegistry.getLibrary was called unexpectedly. Test should mock the call to return necessary data.",
    );
  });
});
afterEach(() => {
  Utils.LibraryRegistry.getLibrary = origGetLibrary;
});

// mock Utils.Uu5Loader methods
let origUu5Loader = {};
beforeEach(() => {
  origUu5Loader.import = Utils.Uu5Loader.import;
  Utils.Uu5Loader.import = jest.fn(async () => {
    throw new Error(
      "Utils.Uu5Loader.import was called unexpectedly. Test should mock the call to return necessary data.",
    );
  });
  origUu5Loader.get = Utils.Uu5Loader.get;
  Utils.Uu5Loader.get = jest.fn((nameOrUrl) =>
    nameOrUrl.startsWith("http://localhost/foo")
      ? LIBRARY_EXPORTS
      : nameOrUrl === "uu5g05" || nameOrUrl === "/uu5g05.js"
        ? Uu5
        : origUu5Loader.get(nameOrUrl),
  );
  origUu5Loader.resolve = Utils.Uu5Loader.resolve;
  Utils.Uu5Loader.resolve = jest.fn(origUu5Loader.resolve);
});
afterEach(() => {
  Object.assign(Utils.Uu5Loader, origUu5Loader);
});

describe("[uu5g05] Utils.LibraryRegistry", () => {
  // TODO Other methods.

  it("importLibrary(namespace)", async () => {
    Utils.Uu5Loader.config({ imports: { uu5g05: "/uu5g05.js" } });
    Utils.LibraryRegistry.getLibrary.mockImplementation(async (namespace) => {
      if (namespace === LIBRARY_DEMO_JSON.code || namespace.startsWith(LIBRARY_DEMO_JSON.code + ".")) {
        return LIBRARY_DEMO_JSON;
      }
      throw new Error(`Library ${namespace} not in the registry.`);
    });
    Utils.Uu5Loader.import.mockImplementation(async (name) => {
      if (name === LIBRARY_DEMO_JSON.name) return LIBRARY_EXPORTS;
      throw new Error(`Unexpected Uu5Loader.import(${JSON.stringify(name)}) call.`);
    });
    Utils.Uu5Loader.resolve.mockImplementation((name) => name);

    let exports;

    // should return already present component without load
    exports = await Utils.LibraryRegistry.importLibrary("Uu5");
    expect(exports === Uu5).toBeTruthy();

    // should load library - success
    exports = await Utils.LibraryRegistry.importLibrary(LIBRARY_DEMO_JSON.code);
    expect(exports === LIBRARY_EXPORTS).toBeTruthy();

    // should load library - failure LIBRARY_JSON_LOAD_FAILURE
    TestUtils.omitConsoleLogs("The registry only contains library with namespace Uu5Demo");
    // should still fail because the namespace must be exact when importing library
    await expect(Utils.LibraryRegistry.importLibrary(LIBRARY_DEMO_JSON.code + ".Nested")).rejects.toHaveProperty(
      "code",
      "LIBRARY_JSON_LOAD_FAILURE",
    );

    // should load library - failure LIBRARY_JSON_LOAD_FAILURE
    TestUtils.omitConsoleLogs("Failed to load library registry");
    await expect(Utils.LibraryRegistry.importLibrary("abcd")).rejects.toHaveProperty(
      "code",
      "LIBRARY_JSON_LOAD_FAILURE",
    );
  });

  it("registerComponent(Component)", async () => {
    Utils.LibraryRegistry.registerComponent(TestComponent2);
    let { result } = Test.renderHook(() => useDynamicLibraryComponent(TestComponent2.uu5Tag));
    expect(result.current?.Component === TestComponent2).toBeTruthy();
  });

  it("getComponentByUu5Tag(uu5Tag)", async () => {
    Utils.LibraryRegistry.registerComponent(TestComponent2);
    expect(Utils.LibraryRegistry.getComponentByUu5Tag(TestComponent2.uu5Tag)).toEqual({
      Component: TestComponent2,
      error: undefined,
    });

    // component which isn't loaded yet / doesn't exist
    expect(Utils.LibraryRegistry.getComponentByUu5Tag(TestComponent.uu5Tag)).toEqual({});

    // component which failed to load
    Utils.LibraryRegistry.getLibrary.mockImplementation(async (namespace) => {
      if (namespace === LIBRARY_DEMO_JSON.code) return LIBRARY_DEMO_JSON;
      throw new Error(`Library ${namespace} not in the registry.`);
    });
    Utils.Uu5Loader.import.mockImplementation(async (name) => {
      if (name === LIBRARY_DEMO_JSON.name) return LIBRARY_EXPORTS;
      throw new Error(`Unexpected Uu5Loader.import(${JSON.stringify(name)}) call.`);
    });
    Utils.Uu5Loader.resolve.mockImplementation((name) => name);
    TestUtils.omitConsoleLogs("not in the registry.");
    await Utils.LibraryRegistry.importLibrary("LibraryXyz").catch((e) => null);
    expect(Utils.LibraryRegistry.getComponentByUu5Tag("LibraryXyz.Button")).toEqual({
      Component: undefined,
      error: expect.objectContaining({ code: expect.any(String) }),
    });

    // component which doesn't exist (in loaded library)
    await Utils.LibraryRegistry.importLibrary(LIBRARY_DEMO_JSON.code);
    expect(Utils.LibraryRegistry.getComponentByUu5Tag(TestComponent.uu5Tag + "asdf")).toEqual({
      Component: undefined,
      error: expect.objectContaining({ code: expect.any(String) }),
    });
  });
});
