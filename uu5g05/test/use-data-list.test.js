import { SessionProvider, useDataList } from "uu5g05";
import { Test, Utils } from "uu5g05-test";
import { AuthenticationService } from "uu_appg01_oidc";
import { createRerenderableComponent } from "./internal/tools.js";

const DEFAULT_PAGE_SIZE = 50;

const INITIAL_DATA1 = [{ id: "id1", value: "x" }];
const LOAD_DATA1 = [
  { id: "id1", value: "a" },
  { id: "id2", value: "b" },
  { id: "id3", value: "c" },
  { id: "id4", value: "d" },
];
const LOAD_DATA2 = [{ id: "idA", value: "1" }];
const SERVER_DATA = [...LOAD_DATA1];

async function renderWithServerData(serverData0, extraHandlers) {
  let serverData = JSON.parse(JSON.stringify(serverData0));
  let handlerMap = {
    load: jest.fn(async ({ pageInfo }) => {
      let { pageIndex = 0 } = pageInfo;
      return { itemList: [serverData[pageIndex]], pageInfo: { pageIndex, pageSize: 1, total: serverData.length } };
    }),
    ...extraHandlers,
  };
  let result = Test.renderHook(() => useDataList({ handlerMap, pageSize: 1 }));
  await Utils.wait();
  return { ...result, handlerMap, serverData };
}

const LIST_HANDLER_MAP = {
  setData: true,
};
function expectedItem({ data, state = "ready", errorData = null, pendingData = null, handlerMap } = {}) {
  return data != null
    ? {
        data,
        state,
        errorData,
        pendingData,
        handlerMap: expectedHandlerMap(handlerMap ?? { setData: true }),
      }
    : data;
}
function expectedHandlerMap(handlerMap = LIST_HANDLER_MAP) {
  let r = {};
  for (let k in handlerMap) r[k] = handlerMap[k] ? expect.any(Function) : null;
  return r;
}
function expectedResult({
  data = expect.any(Object),
  newData = expect.any(Array),
  state = expect.any(String),
  pendingData = expect.any(Object),
  errorData = expect.any(Object),
  handlerMap = expect.any(Object),
  pageSize = expect.any(Number),
} = {}) {
  return { data, newData, state, pendingData, errorData, handlerMap, pageSize };
}

function createMockJsonStream(dtoOut) {
  let { itemList, ...rest } = dtoOut;
  rest.itemList = ["MOCKMOCK"];
  let [initialLine, finalLine] = JSON.stringify(rest).split('"MOCKMOCK"');
  initialLine += "\n";
  let itemLines = [];
  for (let i = 0; i < itemList.length; i++) {
    let itemLine = (i ? "," : "") + JSON.stringify(itemList[i]) + "\n";
    itemLines.push(itemLine);
  }

  let writeLine;
  let closeStream;
  let index = 0;
  let flushNext = async () => {
    if (index === 0) writeLine(initialLine);
    writeLine(itemLines[index++]);
    if (index === itemLines.length) {
      writeLine(finalLine);
      closeStream();
    }
  };
  let flushAll = async () => {
    if (index === 0) writeLine(initialLine);
    for (; index < itemLines.length; index++) writeLine(itemLines[index]);
    writeLine(finalLine);
    closeStream();
  };
  let stream = new ReadableStream({
    type: "bytes",
    start(controller) {
      writeLine = (line) => controller.enqueue(utf8StringToBytes(line));
      closeStream = () => controller.close();
    },
  });
  return { stream, flushNext, flushAll };
}
function utf8StringToBytes(string) {
  return new TextEncoder().encode(string);
}

function createAccessPolicyError() {
  let error = new Error("Session is not trusted as it does not meet expected criteria.");
  Object.assign(error, {
    code: "uu-app-oidc/verifyAccessPolicy/untrustedSession",
    paramMap: {
      maxAuthenticationAge: 60,
      supportedAcrValues: ["high", "veryHigh"],
    },
  });
  return error;
}

beforeAll(() => {
  if (typeof ReadableStream === "undefined") global.ReadableStream = require("stream/web").ReadableStream;
  if (typeof TextDecoderStream === "undefined") global.TextDecoderStream = require("stream/web").TextDecoderStream;
  if (typeof TransformStream === "undefined") global.TransformStream = require("stream/web").TransformStream;
  if (typeof TextEncoder === "undefined") global.TextEncoder = require("util").TextEncoder;
});

describe("useDataList", () => {
  it("should return expected result API", () => {
    let { result } = Test.renderHook(() => useDataList({ initialData: INITIAL_DATA1 }));
    expect(result.current).toEqual({
      data: INITIAL_DATA1.map((data) => expectedItem({ data })),
      newData: [],
      state: "ready",
      errorData: null,
      pendingData: null,
      handlerMap: expectedHandlerMap(),
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("prop initialData; should use initial data", () => {
    let { result } = Test.renderHook(() => useDataList({ initialData: INITIAL_DATA1 }));
    expect(result.current).toEqual({
      data: INITIAL_DATA1.map((data) => expectedItem({ data })),
      newData: [],
      state: "ready",
      errorData: null,
      pendingData: null,
      handlerMap: expectedHandlerMap(),
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("prop initialData; should use initial data without calling handlerMap.load", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataList({ initialData: INITIAL_DATA1, handlerMap }));
    expect(result.current).toEqual({
      data: INITIAL_DATA1.map((data) => expectedItem({ data })),
      newData: [],
      state: "ready",
      errorData: null,
      pendingData: null,
      handlerMap: expectedHandlerMap({ load: true, loadNext: true, setData: true }),
      pageSize: DEFAULT_PAGE_SIZE,
    });
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);
  });

  it("prop skipInitialLoad; should skip initial load (no data)", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataList({ skipInitialLoad: true, handlerMap }));
    expect(result.current).toEqual({
      data: null,
      newData: [],
      state: "readyNoData",
      errorData: null,
      pendingData: null,
      handlerMap: expectedHandlerMap({ load: true, setData: true }),
      pageSize: DEFAULT_PAGE_SIZE,
    });
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);
  });

  it("prop skipInitialLoad; should skip initial load (with data)", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() =>
      useDataList({ skipInitialLoad: true, initialData: INITIAL_DATA1, handlerMap }),
    );
    expect(result.current).toEqual({
      data: INITIAL_DATA1.map((data) => expectedItem({ data })),
      newData: [],
      state: "ready",
      errorData: null,
      pendingData: null,
      handlerMap: expectedHandlerMap({ setData: true, load: true, loadNext: true }),
      pageSize: DEFAULT_PAGE_SIZE,
    });
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);
  });

  it("prop initialDtoIn; should pass initialDtoIn to initial load", async () => {
    let initialDtoIn = { a: "b" };
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    Test.renderHook(() => useDataList({ handlerMap, initialDtoIn }));
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    expect(handlerMap.load).toHaveBeenCalledWith({ ...initialDtoIn, pageInfo: { pageSize: DEFAULT_PAGE_SIZE } });
  });

  it("prop pageSize; should add pageSize to initial load", async () => {
    let initialDtoIn = { a: "b" };
    let pageSize = 8;
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    Test.renderHook(() => useDataList({ handlerMap, initialDtoIn, pageSize }));
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    expect(handlerMap.load).toHaveBeenCalledWith({ ...initialDtoIn, pageInfo: { pageSize } });
  });

  it("prop pageSize; should add pageSize to handlerMap.load* methods", async () => {
    let initialDtoIn = { a: "b" };
    let pageSize = 8;
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
      loadNext: jest.fn(async () => LOAD_DATA1),
    };
    // initial load
    let { result } = Test.renderHook(() => useDataList({ handlerMap, initialDtoIn, pageSize }));
    expect(result.current).toEqual(
      expectedResult({
        pendingData: { operation: "load", dtoIn: { ...initialDtoIn, pageInfo: { pageSize } } },
      }),
    );
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    expect(handlerMap.load).toHaveBeenCalledWith({ ...initialDtoIn, pageInfo: { pageSize } });

    // explicit load
    handlerMap.load.mockClear();
    Test.act(() => {
      result.current.handlerMap.load();
    });
    expect(result.current).toEqual(
      expectedResult({
        pendingData: { operation: "load", dtoIn: { pageInfo: { pageSize } } },
      }),
    );
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    expect(handlerMap.load).toHaveBeenCalledWith({ pageInfo: { pageSize } });

    // explicit loadNext
    Test.act(() => {
      result.current.handlerMap.loadNext({ pageInfo: { pageIndex: 1 } });
    });
    expect(result.current).toEqual(
      expectedResult({
        pendingData: { operation: "loadNext", dtoIn: { pageInfo: { pageIndex: 1, pageSize } } },
      }),
    );
    await Utils.wait();
    expect(handlerMap.loadNext).toHaveBeenCalledTimes(1);
    expect(handlerMap.loadNext).toHaveBeenCalledWith({ pageInfo: { pageIndex: 1, pageSize } });
  });

  it("prop itemIdentifier; should match items using itemIdentifier during operations (default 'id' / custom string / array)", async () => {
    let data = [
      { id: "id1", code: "code1", combo1: "a", combo2: "A", value: 0 },
      undefined,
      { id: "id2", code: "code2", combo1: "a", combo2: "B", value: 0 },
      { id: "id3", code: "code3", combo1: "b", combo2: "A", value: 0 },
      { id: "id4", code: "code4", combo1: "b", combo2: "B", value: 0 },
    ];
    let handlerMap = {
      update: jest.fn(async (newData, extraInfo) => ({ ...data[extraInfo], ...newData })),
    };
    let testWith = async function (itemIdentifier, updateOpts, expectedChangedItemIndex) {
      let { result } = Test.renderHook(() => useDataList({ initialData: data, handlerMap, itemIdentifier }));
      await Utils.wait();
      Test.act(() => {
        result.current.handlerMap.update({ ...updateOpts, value: 10 }, expectedChangedItemIndex);
      });
      await Utils.wait();
      let expectedData = data.map((it, i) => (expectedChangedItemIndex === i ? { ...it, value: 10 } : it));
      expect(result.current).toEqual(expectedResult({ data: expectedData.map((data) => expectedItem({ data })) }));
    };

    await testWith(undefined, { id: "id2" }, 2);
    await testWith("code", { code: "code3" }, 3);
    await testWith(["combo1", "combo2"], { combo1: "b", combo2: "B" }, 4);
  });

  it("prop handlerMap.load; should apply result of initial onLoad (success)", async () => {
    let pageSize = 10;
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    let { result } = Test.renderHook(() => useDataList({ handlerMap, pageSize }));
    expect(result.current).toEqual(
      expectedResult({
        data: null,
        state: "pendingNoData",
        errorData: null,
        pendingData: { operation: "load", dtoIn: { pageInfo: { pageSize: 10 } } },
      }),
    );
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1.map((data) => expectedItem({ data })),
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
  });

  it("prop handlerMap.load; should apply result of initial onLoad (error)", async () => {
    let error = 123;
    let pageSize = 10;
    let handlerMap = {
      load: jest.fn(async () => {
        error = new Error("Test error.");
        error.dtoOut = { key: "value" };
        throw error;
      }),
    };
    Utils.omitConsoleLogs("Test error.");

    let { result } = Test.renderHook(() => useDataList({ handlerMap, pageSize }));
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: null,
        state: "errorNoData",
        pendingData: null,
        errorData: { operation: "load", dtoIn: { pageInfo: { pageSize } }, error, data: error.dtoOut },
      }),
    );
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
  });

  it("prop loadDependencies; should reload if dependencies changed", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
    };
    let { rerender } = Test.renderHook((args) => useDataList(...args), {
      initialProps: [{ handlerMap, initialDtoIn: { foo: "bar" } }, ["key1"]],
    });
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    handlerMap.load.mockClear();

    rerender([{ handlerMap, initialDtoIn: { foo: "bar2" } }, ["key1"]]);
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);

    rerender([{ handlerMap, initialDtoIn: { foo: "bar2" } }, ["key2"]]);
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    expect(handlerMap.load).lastCalledWith(expect.objectContaining({ foo: "bar2" }));
    handlerMap.load.mockClear();

    // similar but with skipInitialLoad => should skip 1st load
    ({ rerender } = Test.renderHook((args) => useDataList(...args), {
      initialProps: [{ handlerMap, skipInitialLoad: true, initialDtoIn: { foo: "bar" } }, ["key1"]],
    }));
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);

    rerender([{ handlerMap, initialDtoIn: { foo: "bar2" } }, ["key1"]]);
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(0);

    rerender([{ handlerMap, initialDtoIn: { foo: "bar2" } }, ["key2"]]);
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenCalledTimes(1);
    expect(handlerMap.load).lastCalledWith(expect.objectContaining({ foo: "bar2" }));
    handlerMap.load.mockClear();

    // changing dependencies during ongoing load should end up doing another load afterwards
    handlerMap = {
      load: jest.fn(async ({ promiseToWaitFor, ...data }) => {
        await promiseToWaitFor;
        return { itemList: [{ ...data, result: true }] };
      }),
    };
    let result;
    let promiseToWaitForResolve;
    let promiseToWaitFor = new Promise((res, rej) => (promiseToWaitForResolve = res));
    ({ result, rerender } = Test.renderHook((args) => useDataList(...args), {
      initialProps: [{ handlerMap, initialDtoIn: { foo: "bar", promiseToWaitFor } }, ["key1"]],
    }));
    await Utils.wait();
    expect(result.current).toMatchObject({ state: "pendingNoData" });
    rerender([{ handlerMap, initialDtoIn: { foo: "bar2" } }, ["key2"]]);
    promiseToWaitForResolve();
    await Test.waitFor(
      async () => {
        expect(result.current).toMatchObject({ data: [{ state: "ready", data: { foo: "bar2", result: true } }] });
      },
      { timeout: 500 },
    );
    expect(handlerMap.load).lastCalledWith({ foo: "bar2", pageInfo: expect.any(Object) });
  });

  it("result should be referentially stable", async () => {
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
      custom: jest.fn(async () => LOAD_DATA2),
    };
    let { result, rerender } = Test.renderHook(() => useDataList({ handlerMap, initialData: INITIAL_DATA1 }));
    let result1 = result.current;
    rerender({ handlerMap, initialData: INITIAL_DATA1 });
    expect(result.current).toBe(result1);
  });

  it("handlerMap.*; should be present in result depending on current load state", async () => {
    let pageSize = 10;
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA1),
      custom: jest.fn(async () => null),
    };
    // initial with no data
    let { result } = Test.renderHook(() => useDataList({ handlerMap, pageSize, skipInitialLoad: true }));
    expect(result.current).toEqual(expectedResult({ handlerMap: expectedHandlerMap({ load: true, setData: true }) }));

    // during "load"
    Test.act(() => {
      result.current.handlerMap.load();
    });
    expect(result.current).toEqual(expectedResult({ handlerMap: expectedHandlerMap({}) }));
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({ handlerMap: expectedHandlerMap({ load: true, loadNext: true, setData: true, custom: true }) }),
    );

    // during "loadNext"
    Test.act(() => {
      result.current.handlerMap.loadNext();
    });
    expect(result.current).toEqual(
      expectedResult({ handlerMap: expectedHandlerMap({ load: true, loadNext: true, setData: true, custom: true }) }),
    );
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({ handlerMap: expectedHandlerMap({ load: true, loadNext: true, setData: true, custom: true }) }),
    );

    // during custom operation (<=> bulk operation)
    Test.act(() => {
      result.current.handlerMap.custom();
    });
    expect(result.current).toEqual(
      expectedResult({ handlerMap: expectedHandlerMap({ load: true, loadNext: true, setData: true, custom: true }) }),
    );
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({ handlerMap: expectedHandlerMap({ load: true, loadNext: true, setData: true, custom: true }) }),
    );
  });

  it("handlerMap.load; should do load (success)", async () => {
    let pageSize = 10;
    let handlerMap = {
      load: jest
        .fn()
        .mockImplementationOnce(async () => LOAD_DATA1)
        .mockImplementationOnce(async () => LOAD_DATA2),
    };
    const LOAD_PARAMS = { p: "v" };
    let { result } = Test.renderHook(() => useDataList({ handlerMap, pageSize }));
    await Utils.wait();

    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1.map((data) => expectedItem({ data })),
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );

    let handleLoadResolved;
    Test.act(() => {
      result.current.handlerMap.load(LOAD_PARAMS).then(() => (handleLoadResolved = true));
    });
    expect(handlerMap.load).toHaveBeenCalledTimes(2);
    expect(handlerMap.load).lastCalledWith({ ...LOAD_PARAMS, pageInfo: { pageSize } });
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1.map((data) => expectedItem({ data, handlerMap: {} })),
        state: "pending",
        pendingData: { operation: "load", dtoIn: { ...LOAD_PARAMS, pageInfo: { pageSize: 10 } } },
        errorData: null,
      }),
    );

    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA2.map((data) => expectedItem({ data })),
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    expect(handleLoadResolved).toBe(true);
  });

  it("handlerMap.load; should do load (error) - should keep previous data", async () => {
    let error = 123;
    let pageSize = 10;
    let handlerMap = {
      load: jest
        .fn()
        .mockImplementationOnce(async () => LOAD_DATA1)
        .mockImplementationOnce(async () => {
          error = new Error("Test error.");
          error.dtoOut = { key: "value" };
          throw error;
        }),
    };
    let { result } = Test.renderHook(() => useDataList({ handlerMap, pageSize }));
    await Utils.wait();

    let handleLoadResolved;
    Test.act(() => {
      result.current.handlerMap
        .load()
        .catch((e) => null)
        .then(() => (handleLoadResolved = true));
    });
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1.map((data) => expectedItem({ data, handlerMap: {} })),
        state: "pending",
        pendingData: { operation: "load", dtoIn: { pageInfo: { pageSize: 10 } } },
        errorData: null,
      }),
    );

    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1.map((data) => expectedItem({ data })),
        state: "error",
        pendingData: null,
        errorData: { operation: "load", dtoIn: { pageInfo: { pageSize: 10 } }, error, data: error.dtoOut },
      }),
    );
    expect(handleLoadResolved).toBe(true);
  });

  it("handlerMap.load; should support JSON stream", async () => {
    let backendDtoOut = {
      pageInfo: { pageIndex: 0, pageSize: LOAD_DATA1.length, total: LOAD_DATA1.length },
      itemList: LOAD_DATA1,
    };
    let { stream, flushNext, flushAll } = createMockJsonStream(backendDtoOut);
    let pageSize = 10;
    let handlerMap = {
      load: jest
        .fn()
        .mockImplementationOnce(async () => stream)
        .mockImplementationOnce(async () => LOAD_DATA2),
      otherOp: jest.fn(),
    };
    let { result } = Test.renderHook(() => useDataList({ handlerMap, pageSize }));
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: null,
        state: "pendingNoData",
        pendingData: expect.objectContaining({ operation: "load" }),
        errorData: null,
        handlerMap: {},
      }),
    );

    await flushNext();
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [expectedItem({ data: LOAD_DATA1[0] }), ...LOAD_DATA1.slice(1).map((it) => undefined)],
        state: "pending",
        pendingData: expect.objectContaining({ operation: "load" }),
        errorData: null,
        // after streaming single item, other handlers should become available (except load itself)
        handlerMap: expectedHandlerMap({ setData: true, otherOp: true, loadNext: true }),
      }),
    );

    await flushNext();
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({ data: LOAD_DATA1[0] }),
          expectedItem({ data: LOAD_DATA1[1] }),
          ...LOAD_DATA1.slice(2).map((it) => undefined),
        ],
        state: "pending",
        pendingData: expect.objectContaining({ operation: "load" }),
        errorData: null,
        handlerMap: expectedHandlerMap({ setData: true, otherOp: true, loadNext: true }),
      }),
    );

    await flushAll();
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1.map((data) => expectedItem({ data })),
        state: "ready",
        pendingData: null,
        errorData: null,
        handlerMap: expectedHandlerMap({ setData: true, otherOp: true, loadNext: true, load: true }),
      }),
    );
  });

  it("handlerMap.loadNext; should load next page and preserve already loaded ones (success)", async () => {
    const PARAMS_PAGE_1 = { pageInfo: { pageIndex: 1 } };
    let { result, handlerMap, serverData } = await renderWithServerData(SERVER_DATA);

    let handleLoadNextResolved;
    Test.act(() => {
      result.current.handlerMap.loadNext(PARAMS_PAGE_1).then(() => (handleLoadNextResolved = true));
    });
    expect(handlerMap.load).toHaveBeenCalledTimes(2); // loadNext should fallback to handlerMap.load if loadNext is not specified
    expect(handlerMap.load).lastCalledWith({ ...PARAMS_PAGE_1, pageInfo: { ...PARAMS_PAGE_1.pageInfo, pageSize: 1 } });
    expect(result.current).toEqual(
      expectedResult({
        data: serverData.map((data, i) => (i > 0 ? undefined : data)).map((data) => expectedItem({ data })),
        state: "pending",
        pendingData: {
          operation: "loadNext",
          dtoIn: { ...PARAMS_PAGE_1, pageInfo: { ...PARAMS_PAGE_1.pageInfo, pageSize: 1 } },
        },
        errorData: null,
      }),
    );

    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: serverData.map((data, i) => (i > 1 ? undefined : data)).map((data) => expectedItem({ data })),
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    expect(handleLoadNextResolved).toBe(true);

    // test loadNext() without params
    Test.act(() => {
      result.current.handlerMap.loadNext();
    });
    expect(handlerMap.load).lastCalledWith({ pageInfo: { pageIndex: 2, pageSize: 1 } });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: serverData.map((data, i) => (i > 2 ? undefined : data)).map((data) => expectedItem({ data })),
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
  });

  it("handlerMap.loadNext; should load next page and preserve already loaded ones (error)", async () => {
    const PARAMS_PAGE_1 = { pageInfo: { pageIndex: 1 } };
    let error = 123;
    let { result, handlerMap, serverData } = await renderWithServerData(SERVER_DATA);

    handlerMap.load.mockImplementationOnce(async () => {
      error = new Error("Test error.");
      error.dtoOut = { key: "value" };
      throw error;
    });
    let handleLoadNextResolved;
    Test.act(() => {
      result.current.handlerMap
        .loadNext(PARAMS_PAGE_1)
        .catch((e) => null)
        .then(() => (handleLoadNextResolved = true));
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: serverData.map((data, i) => (i > 0 ? undefined : data)).map((data) => expectedItem({ data })),
        state: "error",
        pendingData: null,
        errorData: {
          operation: "loadNext",
          dtoIn: { ...PARAMS_PAGE_1, pageInfo: { ...PARAMS_PAGE_1.pageInfo, pageSize: 1 } },
          error,
          data: error.dtoOut,
        },
      }),
    );
    expect(handleLoadNextResolved).toBe(true);
  });

  it("handlerMap.setData; should set data", async () => {
    let { result } = Test.renderHook(() => useDataList({ initialData: INITIAL_DATA1 }));
    Test.act(() => {
      result.current.handlerMap.setData(LOAD_DATA1.map((data) => ({ data })));
    });
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1.map((data) => expectedItem({ data })),
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
  });

  it("handlerMap.*(); should merge data if handler returns function (success)", async () => {
    let mergeLoadFn = jest.fn(() => LOAD_DATA1);
    let mergeCustomFn = jest.fn((arg) => ({ ...arg, value: "z" }));
    let mergeCustomArrayFn = jest.fn((arg) => [
      { ...arg?.[0], value: "A" },
      { ...arg?.[1], value: "B" },
    ]);
    let handlerMap = {
      load: jest.fn(async () => mergeLoadFn),
      custom: jest.fn(async () => mergeCustomFn),
      customArray: jest.fn(async () => mergeCustomArrayFn),
    };
    let { result } = Test.renderHook(() => useDataList({ handlerMap, initialData: INITIAL_DATA1 }));

    // merging fn for "load" / "loadNext" should receive full list
    Test.act(() => {
      result.current.handlerMap.load();
    });
    await Utils.wait();
    expect(mergeLoadFn).toHaveBeenCalledTimes(1);
    expect(mergeLoadFn).lastCalledWith(INITIAL_DATA1);
    expect(result.current).toMatchObject({ data: LOAD_DATA1.map((data) => expectedItem({ data })) });

    // merging fn for other than "load" / "loadNext" should receive only relevant item
    Test.act(() => {
      result.current.handlerMap.custom({ id: LOAD_DATA1[0].id });
    });
    await Utils.wait();
    expect(mergeCustomFn).toHaveBeenCalledTimes(1);
    expect(mergeCustomFn).lastCalledWith(LOAD_DATA1[0]);
    expect(result.current).toMatchObject({
      data: [
        expectedItem({ data: { ...LOAD_DATA1[0], value: "z" } }),
        ...LOAD_DATA1.slice(1).map((data) => expectedItem({ data })),
      ],
    });

    // merging fn for other than "load" / "loadNext" should receive only relevant items
    Test.act(() => {
      result.current.handlerMap.customArray([{ id: LOAD_DATA1[1].id }, { id: LOAD_DATA1[2].id }]);
    });
    await Utils.wait();
    expect(mergeCustomArrayFn).toHaveBeenCalledTimes(1);
    expect(mergeCustomArrayFn).lastCalledWith([LOAD_DATA1[1], LOAD_DATA1[2]]);
    expect(result.current).toMatchObject({
      data: [
        expectedItem({ data: { ...LOAD_DATA1[0], value: "z" } }),
        expectedItem({ data: { ...LOAD_DATA1[1], value: "A" } }),
        expectedItem({ data: { ...LOAD_DATA1[2], value: "B" } }),
        ...LOAD_DATA1.slice(3).map((data) => expectedItem({ data })),
      ],
    });
  });

  it("handlerMap.*(); should merge data if handler returns function (failure)", async () => {
    let error = 123;
    let mergeLoadFn = jest.fn(() => {
      error = new Error("Test error.");
      error.dtoOut = { key: "value" };
      throw error;
    });
    let handlerMap = { load: jest.fn(async () => mergeLoadFn) };
    let { result } = Test.renderHook(() => useDataList({ handlerMap, initialData: INITIAL_DATA1 }));
    let caughtError;
    Test.act(() => {
      result.current.handlerMap.load().catch((e) => (caughtError = e));
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1.map((data) => expectedItem({ data })),
        state: "error",
        errorData: { operation: "load", dtoIn: expect.any(Object), error, data: error.dtoOut },
        pendingData: null,
      }),
    );
    expect(caughtError).toBe(error);
  });

  it("handlerMap.*(); should throw if another operation is already running", async () => {
    let pageSize = 8;
    let handlerMap = {
      load: jest.fn(async () => LOAD_DATA2),
      update: jest.fn(async () => null),
    };
    let { result } = Test.renderHook(() => useDataList({ handlerMap, initialData: LOAD_DATA1, pageSize }));
    await Utils.wait();

    // explicit load
    handlerMap.load.mockClear();
    let call1Promise, call2Promise, call2Error, call3Promise, call3Error;
    Test.act(() => {
      call1Promise = result.current.handlerMap.load();
      call2Promise = result.current.handlerMap.load({ pageInfo: { pageIndex: 1 } }).catch((e) => (call2Error = e));
      call3Promise = result.current.handlerMap.update({ id: LOAD_DATA1[0].id }).catch((e) => (call3Error = e));
    });
    await Utils.wait();
    await expect(call1Promise).resolves.toEqual(LOAD_DATA2);
    await call2Promise;
    expect(call2Error + "").toMatch(/not allow/);
    await call3Promise;
    expect(call3Error + "").toMatch(/not allow/);

    handlerMap.update.mockClear();
    Test.act(() => {
      call1Promise = result.current.handlerMap.update({ id: LOAD_DATA2[0].id, foo: "bar" });
      call2Promise = result.current.handlerMap
        .update({ id: LOAD_DATA2[0].id, foo: "bar2" })
        .catch((e) => (call2Error = e));
    });
    await Utils.wait();
    await expect(call1Promise).resolves.toEqual(null);
    await call2Promise;
    expect(call2Error + "").toMatch(/not allow/);
  });

  it("handlerMap.<custom>; operates on a new item (success) - should add at the end (list is fully loaded)", async () => {
    const CALL_PARAM = { value: "v" };
    const CALL_RESPONSE = { id: "create1", ...CALL_PARAM };
    let handlerMap = {
      customCall: jest.fn(async () => CALL_RESPONSE),
    };
    let { result } = Test.renderHook(() => useDataList({ initialData: INITIAL_DATA1, handlerMap }));
    await Utils.wait();

    let customCallResolved;
    Test.act(() => {
      result.current.handlerMap.customCall(CALL_PARAM).then(() => (customCallResolved = true));
    });
    expect(handlerMap.customCall).toHaveBeenCalledTimes(1);
    expect(handlerMap.customCall).toHaveBeenCalledWith(CALL_PARAM);
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1.map((data) => expectedItem({ data })),
        newData: [],
        state: "itemPending",
        pendingData: null,
        errorData: null,
      }),
    );

    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1.concat([CALL_RESPONSE]).map((data) => expectedItem({ data })),
        newData: [],
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    expect(customCallResolved).toBe(true);
  });

  it("handlerMap.<custom>; operates on a new item (success) - should add to newData (list is not fully loaded)", async () => {
    const CALL_PARAM = { value: "v" };
    const CALL_RESPONSE = { id: "create1", ...CALL_PARAM };
    let handlerMap = {
      customCall: jest.fn(async () => CALL_RESPONSE),
    };
    let { result } = Test.renderHook(() => useDataList({ initialData: INITIAL_DATA1.concat([undefined]), handlerMap }));
    await Utils.wait();

    Test.act(() => {
      result.current.handlerMap.customCall(CALL_PARAM);
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1.map((data) => expectedItem({ data })).concat([undefined]),
        newData: [CALL_RESPONSE].map((data) => expectedItem({ data })),
      }),
    );
  });

  it("handlerMap.<custom>; operates on a new item (error) - should end with rejection", async () => {
    const CALL_PARAM = { value: "v" };
    let error = 123;
    let handlerMap = {
      customCall: jest.fn(async () => {
        error = new Error("Test error.");
        error.dtoOut = { key: "value" };
        throw error;
      }),
    };
    let { result } = Test.renderHook(() => useDataList({ initialData: INITIAL_DATA1, handlerMap }));
    await Utils.wait();

    let customCallResolved, rejected;
    Test.act(() => {
      result.current.handlerMap
        .customCall(CALL_PARAM)
        .catch((e) => (rejected = e))
        .then(() => (customCallResolved = true));
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1.map((data) => expectedItem({ data })),
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    expect(rejected).toBe(error);
    expect(customCallResolved).toBe(true);
  });

  it("handlerMap.<custom>; operates (update) on an existing item (success) - should update the item", async () => {
    const CALL_PARAM = { id: INITIAL_DATA1[0].id, value: "v" };
    const CALL_RESPONSE = { ...INITIAL_DATA1[0], ...CALL_PARAM };
    let handlerMap = {
      customCall: jest.fn(async () => CALL_RESPONSE),
    };
    let { result } = Test.renderHook(() => useDataList({ initialData: INITIAL_DATA1, handlerMap }));
    await Utils.wait();

    let customCallResolved;
    Test.act(() => {
      result.current.handlerMap.customCall(CALL_PARAM).then(() => (customCallResolved = true));
    });
    expect(handlerMap.customCall).toHaveBeenCalledTimes(1);
    expect(handlerMap.customCall).toHaveBeenCalledWith(CALL_PARAM);
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({
            data: INITIAL_DATA1[0],
            state: "pending",
            pendingData: { operation: "customCall", dtoIn: CALL_PARAM },
            errorData: null,
            handlerMap: expectedHandlerMap({}),
          }),
        ].concat(INITIAL_DATA1.slice(1).map((data) => expectedItem({ data }))),
        newData: [],
        state: "itemPending",
        pendingData: null,
        errorData: null,
      }),
    );

    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [CALL_RESPONSE].concat(INITIAL_DATA1.slice(1)).map((data) => expectedItem({ data })),
        newData: [],
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    expect(customCallResolved).toBe(true);
  });

  it("handlerMap.<custom>; operates (delete) on an existing item (success) - should delete the item", async () => {
    const CALL_PARAM = { id: INITIAL_DATA1[0].id, value: "v" };
    const CALL_RESPONSE = null;
    let handlerMap = {
      customCall: jest.fn(async () => CALL_RESPONSE),
    };
    let { result } = Test.renderHook(() => useDataList({ initialData: INITIAL_DATA1, handlerMap }));
    await Utils.wait();

    let customCallResolved;
    Test.act(() => {
      result.current.handlerMap.customCall(CALL_PARAM).then(() => (customCallResolved = true));
    });
    expect(handlerMap.customCall).toHaveBeenCalledTimes(1);
    expect(handlerMap.customCall).toHaveBeenCalledWith(CALL_PARAM);
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({
            data: INITIAL_DATA1[0],
            state: "pending",
            pendingData: { operation: "customCall", dtoIn: CALL_PARAM },
            errorData: null,
            handlerMap: expectedHandlerMap({}),
          }),
        ].concat(INITIAL_DATA1.slice(1).map((data) => expectedItem({ data }))),
        newData: [],
        state: "itemPending",
        pendingData: null,
        errorData: null,
      }),
    );

    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: INITIAL_DATA1.slice(1).map((data) => expectedItem({ data })),
        newData: [],
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    expect(customCallResolved).toBe(true);
  });

  it("handlerMap.<custom>; operates on an existing item (error) - should end with rejection", async () => {
    const CALL_PARAM = { id: INITIAL_DATA1[0].id, value: "v" };
    let error = 123;
    let handlerMap = {
      customCall: jest.fn(async () => {
        error = new Error("Test error.");
        error.dtoOut = { key: "value" };
        throw error;
      }),
    };
    let { result } = Test.renderHook(() => useDataList({ initialData: INITIAL_DATA1, handlerMap }));
    await Utils.wait();

    let customCallResolved, rejected;
    Test.act(() => {
      result.current.handlerMap
        .customCall(CALL_PARAM)
        .catch((e) => (rejected = e))
        .then(() => (customCallResolved = true));
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({
            data: INITIAL_DATA1[0],
            state: "error",
            pendingData: null,
            errorData: { operation: "customCall", dtoIn: CALL_PARAM, error, data: error.dtoOut },
            handlerMap: expectedHandlerMap({ setData: true }),
          }),
        ].concat(INITIAL_DATA1.slice(1).map((data) => expectedItem({ data }))),
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    expect(rejected).toBe(error);
    expect(customCallResolved).toBe(true);
  });

  it("handlerMap.<custom>; bulk; operates on multiple items (partial success/error) - should apply some changes & rollback some", async () => {
    const CREATE = [{ value: "c1" }, { value: "c2" }, { value: "c3" }, { value: "c4" }, { value: "c5" }];
    const CREATE1_OK = { id: "id-c1", ...CREATE[0] };
    const CREATE4_OK = { id: "id-c4", ...CREATE[3] };
    const CREATE5_OK = { id: "id-c5", ...CREATE[4] };
    const UPDATE = [
      { id: "id1", value: "u1" },
      { id: "id2", value: "u2" },
      { id: "id3", value: "u3" },
      { id: "id4", value: "u4" },
      { id: "id5", value: "u5" },
    ];
    const UPDATE1_OK = { ...UPDATE[0] };
    const UPDATE4_OK = { ...UPDATE[3] };
    const UPDATE5_OK = { ...UPDATE[4] };
    let update2Error = 123;
    let update3Error = 123;
    const DELETE = [{ id: "id1" }, { id: "id2" }, { id: "id3" }, { id: "id4" }, { id: "id5" }];
    const DELETE1_OK = null;
    const DELETE4_OK = null;
    const DELETE5_OK = null;
    let delete2Error = 123;
    let delete3Error = 123;
    let data = [
      { id: "id1", value: "a" },
      { id: "id2", value: "b" },
      { id: "id3", value: "c" },
      { id: "id4", value: "d" },
      { id: "id5", value: "e" },
      { id: "id6", value: "f" },
    ];
    let handlerMap = {
      create: jest.fn(async () =>
        Promise.reject([
          CREATE1_OK,
          new Error("BE"),
          { uuAppErrorMap: { code: { type: "error" } } },
          { uuAppErrorMap: { code: { type: "warning" } }, ...CREATE4_OK },
          { uuAppErrorMap: {}, ...CREATE5_OK },
        ]),
      ),
      update: jest.fn(async () =>
        Promise.reject([
          UPDATE1_OK,
          (update2Error = new Error("BE")),
          (update3Error = { uuAppErrorMap: { code: { type: "error" } } }),
          { uuAppErrorMap: { code: { type: "warning" } }, ...UPDATE4_OK },
          { uuAppErrorMap: {}, ...UPDATE5_OK },
        ]),
      ),
      delete: jest.fn(async () =>
        Promise.reject([
          DELETE1_OK,
          (delete2Error = new Error("BE")),
          (delete3Error = { uuAppErrorMap: { code: { type: "error" } } }),
          { uuAppErrorMap: { code: { type: "warning" } }, ...DELETE4_OK },
          { uuAppErrorMap: {}, ...DELETE5_OK },
        ]),
      ),
    };
    let { result } = Test.renderHook(() => useDataList({ handlerMap, initialData: data, pageSize: 100 }));
    await Utils.wait();
    let afterInitData = result.current.data;

    // bulk create
    let rejected;
    Test.act(() => {
      result.current.handlerMap.create(CREATE).catch((e) => (rejected = e));
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [
          ...data,
          CREATE1_OK,
          // NOTE Seems like we're currently retaining non-empty non-error uuAppErrorMap in items.
          { uuAppErrorMap: { code: { type: "warning" } }, ...CREATE4_OK },
          CREATE5_OK,
        ].map((data) => expectedItem({ data })),
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
    expect(rejected).toBeTruthy();

    // bulk update
    rejected = undefined;
    Test.act(() => {
      result.current.handlerMap.setData(afterInitData);
      result.current.handlerMap.update(UPDATE).catch((e) => (rejected = e));
    });
    expect(result.current).toEqual(
      expectedResult({
        data: UPDATE.map((item, i) =>
          expectedItem({
            data: data[i],
            state: "pending",
            pendingData: { operation: "update", dtoIn: UPDATE[i] },
            errorData: null,
            handlerMap: expectedHandlerMap({}),
          }),
        ).concat(data.slice(5).map((data) => expectedItem({ data }))),
        state: "itemPending",
        pendingData: null,
        errorData: null,
      }),
    );
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({ data: UPDATE1_OK }),
          expectedItem({
            data: data[1],
            state: "error",
            errorData: {
              operation: "update",
              dtoIn: UPDATE[1],
              error: update2Error,
              data: update2Error.dtoOut ?? update2Error,
            },
          }),
          expectedItem({
            data: data[2],
            state: "error",
            errorData: {
              operation: "update",
              dtoIn: UPDATE[2],
              error: update3Error,
              data: update3Error.dtoOut ?? update3Error,
            },
          }),
          expectedItem({
            data:
              // NOTE Seems like we're currently retaining non-empty non-error uuAppErrorMap in items.
              { uuAppErrorMap: { code: { type: "warning" } }, ...UPDATE4_OK },
          }),
          expectedItem({ data: UPDATE5_OK }),
          ...data.slice(5).map((data) => expectedItem({ data })),
        ],
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
    expect(rejected).toBeTruthy();

    // bulk delete
    rejected = undefined;
    Test.act(() => {
      result.current.handlerMap.setData(afterInitData);
      result.current.handlerMap.delete(DELETE).catch((e) => (rejected = e));
    });
    expect(result.current).toEqual(
      expectedResult({
        data: DELETE.map((item, i) =>
          expectedItem({
            data: data[i],
            state: "pending",
            pendingData: { operation: "delete", dtoIn: DELETE[i] },
            errorData: null,
            handlerMap: expectedHandlerMap({}),
          }),
        ).concat(data.slice(5).map((data) => expectedItem({ data }))),
        state: "itemPending",
        pendingData: null,
        errorData: null,
      }),
    );
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({
            data: data[1],
            state: "error",
            errorData: {
              operation: "delete",
              dtoIn: DELETE[1],
              error: delete2Error,
              data: delete2Error.dtoOut ?? delete2Error,
            },
          }),
          expectedItem({
            data: data[2],
            state: "error",
            errorData: {
              operation: "delete",
              dtoIn: DELETE[2],
              error: delete3Error,
              data: delete3Error.dtoOut ?? delete3Error,
            },
          }),
          ...data.slice(5).map((data) => expectedItem({ data })),
        ],
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
    expect(rejected).toBeTruthy();
  });

  it("data[].handlerMap.*; should be present in result depending on current load state", async () => {
    let data = [INITIAL_DATA1[0]];
    let handlerMap = { load: jest.fn(async () => data) };
    let itemHandlerMap = { custom: jest.fn(async () => data[0]) };
    let expectedHMR = (map) =>
      expectedResult({
        data: [
          expectedItem({
            data: data[0],
            handlerMap: expectedHandlerMap(map),
            errorData: expect.any(Object),
            pendingData: expect.any(Object),
            state: expect.any(String),
          }),
        ],
      });

    // initial
    let { result } = Test.renderHook(() => useDataList({ handlerMap, itemHandlerMap, initialData: data }));
    expect(result.current).toEqual(expectedHMR({ custom: true, setData: true }));

    // during "load"
    Test.act(() => {
      result.current.handlerMap.load();
    });
    expect(result.current).toEqual(expectedHMR({}));
    await Utils.wait();
    expect(result.current).toEqual(expectedHMR({ custom: true, setData: true }));

    // during "loadNext"
    Test.act(() => {
      result.current.handlerMap.loadNext();
    });
    expect(result.current).toEqual(expectedHMR({ custom: true, setData: true }));
    await Utils.wait();
    expect(result.current).toEqual(expectedHMR({ custom: true, setData: true }));

    // during item operation
    Test.act(() => {
      result.current.data[0].handlerMap.custom();
    });
    expect(result.current).toEqual(expectedHMR({}));
    await Utils.wait();
    expect(result.current).toEqual(expectedHMR({ custom: true, setData: true }));
  });

  it("data[].handlerMap.setData; should set item data", async () => {
    let data = [
      { id: "id1", value: "a" },
      { id: "id2", value: "b" },
      { id: "id3", value: "c" },
    ];
    let itemHandlerMap = { custom: jest.fn(async () => null) };
    let { result } = Test.renderHook(() => useDataList({ initialData: data, itemHandlerMap }));
    Test.act(() => {
      result.current.data[0].handlerMap.setData({ data: LOAD_DATA1[0] });
      result.current.data[1].handlerMap.setData(null); // should remove
      result.current.data[2].handlerMap.setData({ data: LOAD_DATA1[1], state: "custom" });
    });
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({ data: LOAD_DATA1[0], handlerMap: expectedHandlerMap({ setData: true, custom: true }) }), // should auto-add handlerMap
          expectedItem({
            data: LOAD_DATA1[1],
            state: "custom",
            handlerMap: expectedHandlerMap({ setData: true, custom: true }), // should auto-add handlerMap
          }),
        ],
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
  });

  it("data[].handlerMap.*; should merge data if handler returns function (success)", async () => {
    let mergeCustomFn = jest.fn((arg) => ({ ...arg, value: "z" }));
    let itemHandlerMap = {
      custom: jest.fn(async () => mergeCustomFn),
    };
    let { result } = Test.renderHook(() => useDataList({ itemHandlerMap, initialData: LOAD_DATA1 }));
    Test.act(() => {
      result.current.data[1].handlerMap.custom();
    });
    await Utils.wait();
    expect(mergeCustomFn).toHaveBeenCalledTimes(1);
    expect(mergeCustomFn).lastCalledWith(LOAD_DATA1[1]);
    expect(result.current).toMatchObject({
      data: [
        expectedItem({ data: LOAD_DATA1[0] }),
        expectedItem({ data: { ...LOAD_DATA1[1], value: "z" } }),
        ...LOAD_DATA1.slice(2).map((data) => expectedItem({ data })),
      ],
    });
  });

  it("data[].handlerMap.*; should merge data if handler returns function (failure)", async () => {
    let error = 123;
    let mergeCustomFn = jest.fn(() => {
      error = new Error("Test error.");
      error.dtoOut = { key: "value" };
      throw error;
    });
    let itemHandlerMap = {
      custom: jest.fn(async () => mergeCustomFn),
    };
    let { result } = Test.renderHook(() => useDataList({ itemHandlerMap, initialData: LOAD_DATA1 }));
    let caughtError;
    Test.act(() => {
      result.current.data[1].handlerMap.custom().catch((e) => (caughtError = e));
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({ data: LOAD_DATA1[0], handlerMap: expectedHandlerMap({ setData: true, custom: true }) }),
          expectedItem({
            data: LOAD_DATA1[1],
            state: "error",
            errorData: { operation: "custom", dtoIn: expect.any(Object), error, data: error.dtoOut },
            handlerMap: expectedHandlerMap({ setData: true, custom: true }),
          }),
          ...LOAD_DATA1.slice(2).map((data) =>
            expectedItem({ data, handlerMap: expectedHandlerMap({ setData: true, custom: true }) }),
          ),
        ],
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
    expect(caughtError).toBe(error);
  });

  it("data[].handlerMap.<custom>; operates (update) on an existing item (success) - should update the item", async () => {
    const CALL_PARAM = { value: "v" };
    const CALL_RESPONSE = { ...LOAD_DATA1[1], ...CALL_PARAM };
    let itemHandlerMap = { customCall: jest.fn(async () => CALL_RESPONSE) };
    let { result } = Test.renderHook(() => useDataList({ initialData: LOAD_DATA1, itemHandlerMap }));
    await Utils.wait();

    let customCallResolved;
    Test.act(() => {
      result.current.data[1].handlerMap.customCall(CALL_PARAM).then(() => (customCallResolved = true));
    });
    expect(itemHandlerMap.customCall).toHaveBeenCalledTimes(1);
    expect(itemHandlerMap.customCall).toHaveBeenCalledWith({ id: LOAD_DATA1[1].id, ...CALL_PARAM });
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({ data: LOAD_DATA1[0], handlerMap: expectedHandlerMap({ setData: true, customCall: true }) }),
          expectedItem({
            data: LOAD_DATA1[1],
            state: "pending",
            pendingData: { operation: "customCall", dtoIn: { id: LOAD_DATA1[1].id, ...CALL_PARAM } },
            errorData: null,
            handlerMap: expectedHandlerMap({}),
          }),
          ...LOAD_DATA1.slice(2).map((data) =>
            expectedItem({ data, handlerMap: expectedHandlerMap({ setData: true, customCall: true }) }),
          ),
        ],
        newData: [],
        state: "itemPending",
        pendingData: null,
        errorData: null,
      }),
    );

    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [LOAD_DATA1[0], CALL_RESPONSE]
          .concat(LOAD_DATA1.slice(2))
          .map((data) => expectedItem({ data, handlerMap: expectedHandlerMap({ setData: true, customCall: true }) })),
        newData: [],
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    expect(customCallResolved).toBe(true);
  });

  it("data[].handlerMap.<custom>; operates (delete) on an existing item (success) - should delete the item", async () => {
    const CALL_PARAM = { value: "v" };
    const CALL_RESPONSE = null;
    let itemHandlerMap = { customCall: jest.fn(async () => CALL_RESPONSE) };
    let { result } = Test.renderHook(() => useDataList({ initialData: LOAD_DATA1, itemHandlerMap }));
    await Utils.wait();

    let customCallResolved;
    Test.act(() => {
      result.current.data[1].handlerMap.customCall(CALL_PARAM).then(() => (customCallResolved = true));
    });
    expect(itemHandlerMap.customCall).toHaveBeenCalledTimes(1);
    expect(itemHandlerMap.customCall).toHaveBeenCalledWith({ id: LOAD_DATA1[1].id, ...CALL_PARAM });
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({ data: LOAD_DATA1[0], handlerMap: expectedHandlerMap({ setData: true, customCall: true }) }),
          expectedItem({
            data: LOAD_DATA1[1],
            state: "pending",
            pendingData: { operation: "customCall", dtoIn: { id: LOAD_DATA1[1].id, ...CALL_PARAM } },
            errorData: null,
            handlerMap: expectedHandlerMap({}),
          }),
          ...LOAD_DATA1.slice(2).map((data) =>
            expectedItem({ data, handlerMap: expectedHandlerMap({ setData: true, customCall: true }) }),
          ),
        ],
        newData: [],
        state: "itemPending",
        pendingData: null,
        errorData: null,
      }),
    );

    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [LOAD_DATA1[0], ...LOAD_DATA1.slice(2)].map((data) =>
          expectedItem({ data, handlerMap: expectedHandlerMap({ setData: true, customCall: true }) }),
        ),
        newData: [],
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    expect(customCallResolved).toBe(true);
  });

  it("data[].handlerMap.<custom>; operates on an existing item (error) - should end with rejection", async () => {
    const CALL_PARAM = { value: "v" };
    let error = 123;
    let itemHandlerMap = {
      customCall: jest.fn(async () => {
        error = new Error("Test error.");
        error.dtoOut = { key: "value" };
        throw error;
      }),
    };
    let { result } = Test.renderHook(() => useDataList({ initialData: LOAD_DATA1, itemHandlerMap }));
    await Utils.wait();

    let customCallResolved, rejected;
    Test.act(() => {
      result.current.data[1].handlerMap
        .customCall(CALL_PARAM)
        .catch((e) => (rejected = e))
        .then(() => (customCallResolved = true));
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [
          expectedItem({ data: LOAD_DATA1[0], handlerMap: expectedHandlerMap({ setData: true, customCall: true }) }),
          expectedItem({
            data: LOAD_DATA1[1],
            state: "error",
            pendingData: null,
            errorData: {
              operation: "customCall",
              dtoIn: { id: LOAD_DATA1[1].id, ...CALL_PARAM },
              error,
              data: error.dtoOut,
            },
            handlerMap: expectedHandlerMap({ setData: true, customCall: true }),
          }),
          ...LOAD_DATA1.slice(2).map((data) =>
            expectedItem({ data, handlerMap: expectedHandlerMap({ setData: true, customCall: true }) }),
          ),
        ],
        state: "ready",
        pendingData: null,
        errorData: null,
      }),
    );
    expect(rejected).toBe(error);
    expect(customCallResolved).toBe(true);
  });

  it("newData; should remove items from 'newData' if they get loaded into 'data'", async () => {
    const CREATE1 = { value: "v" };
    const CREATE1_FULL = { id: "create1", ...CREATE1 };
    let serverData = [
      { id: "id1", value: 1 },
      { id: "id2", value: 2 },
    ];
    let handlerMap = {
      load: jest.fn(async ({ pageInfo }) => {
        let { pageIndex = 0 } = pageInfo;
        return { itemList: [serverData[pageIndex]], pageInfo: { pageIndex, pageSize: 1, total: serverData.length } };
      }),
      createItem: jest.fn(async () => {
        serverData.splice(1, 0, CREATE1_FULL); // add in-between
        return CREATE1_FULL;
      }),
    };
    let { result } = Test.renderHook(() => useDataList({ handlerMap, pageSize: 1 }));
    await Utils.wait();
    Test.act(() => {
      result.current.handlerMap.createItem(CREATE1);
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [serverData[0], undefined].map((data) => expectedItem({ data })),
        newData: [CREATE1_FULL].map((data) => expectedItem({ data })),
      }),
    );
    Test.act(() => {
      result.current.handlerMap.loadNext({ pageInfo: { pageIndex: 1 } });
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: [serverData[0], CREATE1_FULL, undefined].map((data) => expectedItem({ data })),
        newData: [],
      }),
    );
  });

  it("newData; item operations should work on items in newData too", async () => {
    let data = [{ id: "id1", value: "a" }, { id: "id2", value: "b" }, undefined];
    const CREATE = [{ value: "c1" }, { value: "c2" }];
    const CREATE_FULL = CREATE.map((it, i) => ({ id: "c" + (i + 1), ...it }));
    let handlerMap = {
      createMulti: jest.fn(async () => CREATE_FULL),
      update1: jest.fn(async (v) => v),
      delete1: jest.fn(async (v) => null),
    };
    let itemHandlerMap = {
      itemUpdate: jest.fn(async (v) => v),
      itemDelete: jest.fn(async (v) => null),
    };
    let expectedReadyItem = (itemData) =>
      expectedItem({
        data: itemData,
        state: "ready",
        errorData: null,
        pendingData: null,
        handlerMap: expectedHandlerMap({ setData: true, itemUpdate: true, itemDelete: true }),
      });
    let { result } = Test.renderHook(() => useDataList({ initialData: data, handlerMap, itemHandlerMap, pageSize: 2 }));
    await Utils.wait();
    Test.act(() => {
      result.current.handlerMap.createMulti(CREATE);
    });
    await Utils.wait();

    // update using list handlerMap
    Test.act(() => {
      result.current.handlerMap.update1({ id: "c1", value: "up1" });
    });
    expect(result.current).toEqual(
      expectedResult({
        data: data.map((data) => expectedReadyItem(data)),
        newData: [
          expectedItem({
            data: CREATE_FULL[0],
            state: "pending",
            pendingData: { operation: "update1", dtoIn: { id: "c1", value: "up1" } },
            errorData: null,
            handlerMap: expectedHandlerMap({}),
          }),
          expectedReadyItem(CREATE_FULL[1]),
        ],
      }),
    );
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: data.map((data) => expectedReadyItem(data)),
        newData: [expectedReadyItem({ ...CREATE_FULL[0], value: "up1" }), expectedReadyItem(CREATE_FULL[1])],
      }),
    );

    // update using item handlerMap
    Test.act(() => {
      result.current.newData[1].handlerMap.itemUpdate({ value: "up2" });
    });
    expect(result.current).toEqual(
      expectedResult({
        data: data.map((data) => expectedReadyItem(data)),
        newData: [
          expectedReadyItem({ ...CREATE_FULL[0], value: "up1" }),
          expectedItem({
            data: CREATE_FULL[1],
            state: "pending",
            pendingData: { operation: "itemUpdate", dtoIn: { id: "c2", value: "up2" } },
            errorData: null,
            handlerMap: expectedHandlerMap({}),
          }),
        ],
      }),
    );
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: data.map((data) => expectedReadyItem(data)),
        newData: [
          expectedReadyItem({ ...CREATE_FULL[0], value: "up1" }),
          expectedReadyItem({ ...CREATE_FULL[1], value: "up2" }),
        ],
      }),
    );

    // delete using list handlerMap
    Test.act(() => {
      result.current.handlerMap.delete1({ id: "c1" });
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: data.map((data) => expectedReadyItem(data)),
        newData: [expectedReadyItem({ ...CREATE_FULL[1], value: "up2" })],
      }),
    );

    // delete using item handlerMap
    Test.act(() => {
      result.current.newData[0].handlerMap.itemDelete();
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: data.map((data) => expectedReadyItem(data)),
        newData: [],
      }),
    );
  });

  it("should call abort() on abortable ongoing calls during unmount", async () => {
    let abortMock = jest.fn();
    let handlerMap = {
      load: jest.fn(() => {
        let result = new Promise(() => {});
        result.abort = abortMock;
        return result;
      }),
    };

    // initial load
    let { result, unmount } = Test.renderHook(() => useDataList({ handlerMap }));
    await Utils.wait();
    expect(abortMock).toHaveBeenCalledTimes(0);
    unmount();
    expect(abortMock).toHaveBeenCalledTimes(1);

    // explicit load
    abortMock.mockClear();
    ({ result, unmount } = Test.renderHook(() => useDataList({ handlerMap, initialData: {} })));
    await Utils.wait();
    expect(abortMock).toHaveBeenCalledTimes(0);
    Test.act(() => {
      result.current.handlerMap.load();
    });
    await Utils.wait();
    expect(abortMock).toHaveBeenCalledTimes(0);
    unmount();
    expect(abortMock).toHaveBeenCalledTimes(1);
  });

  it("skipAbortOnUnmount; should start & finish the call (settle the Promise) even if component is going to be / got unmounted", async () => {
    let lastCallResolve;
    let handlerMap = {
      load: jest.fn(() => {
        let result = new Promise((resolve) => {
          lastCallResolve = resolve;
        });
        return result;
      }),
    };

    let { result, unmount } = Test.renderHook(() =>
      useDataList({ handlerMap, skipInitialLoad: true, skipAbortOnUnmount: true }),
    );
    await Utils.wait();
    let loadPromise;
    Test.act(() => {
      loadPromise = result.current.handlerMap.load();
      unmount();
    });
    await Test.waitFor(() => expect(handlerMap.load).toHaveBeenCalled(), { timeout: 100 });
    lastCallResolve({ itemList: [{ id: "a" }] });
    await expect(loadPromise).resolves.toEqual({ itemList: [{ id: "a" }] });
  });

  it("should re-invoke handler on access policy error recovery", async () => {
    let accessPolicyError = createAccessPolicyError();
    let sessionMatchesAccessPolicy = false;
    AuthenticationService.getCurrentSession().matches = () => sessionMatchesAccessPolicy;

    let handlerMap = {
      load: jest.fn(async () => {
        if (!sessionMatchesAccessPolicy) throw accessPolicyError;
        return LOAD_DATA1;
      }),
    };
    let lastSessionCtxValue;
    let { rerender, Component } = createRerenderableComponent((props) => (
      <SessionProvider authenticationService={AuthenticationService}>
        {(ctxValue) => {
          lastSessionCtxValue = ctxValue;
          return props.children;
        }}
      </SessionProvider>
    ));
    let { result } = Test.renderHook(() => useDataList({ handlerMap, skipInitialLoad: true }), { wrapper: Component });

    Test.act(() => {
      result.current.handlerMap.load().catch((e) => null);
    });
    await Utils.wait();
    expect(result.current).toEqual(
      expectedResult({
        data: null,
        state: "errorNoData",
        errorData: expect.objectContaining({ operation: "load", error: accessPolicyError }),
      }),
    );

    // force updating of oidc session and then re-rendering of SessionProvider
    sessionMatchesAccessPolicy = true;
    await lastSessionCtxValue.login();
    rerender();
    await Utils.wait();

    // expect that the hook automatically called handlerMap.load() because session got updated and
    // it now matches the access policy error data
    expect(result.current).toEqual(
      expectedResult({
        data: LOAD_DATA1.map((data) => expectedItem({ data })),
        state: "ready",
        errorData: null,
        pendingData: null,
      }),
    );
  });
});
