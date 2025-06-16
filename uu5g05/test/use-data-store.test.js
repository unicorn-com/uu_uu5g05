import { DataStoreProvider, useDataStore } from "uu5g05";
import { Test, Utils } from "uu5g05-test";

function getData(length) {
  let data = [];
  for (let i = 0; i < length; i++) {
    data.push({ id: "data-" + i, content: i });
  }
  return data;
}

describe("DataStoreProvider", function () {
  it("provides expected API", async () => {
    const { result } = Test.renderHook(() => useDataStore(), {
      wrapper: (props) => (
        <DataStoreProvider initialData={[]} handlerMap={{ load: async () => [] }}>
          {props.children}
        </DataStoreProvider>
      ),
    });
    expect(result.current).toEqual({
      handlerMap: {
        load: expect.any(Function),
        loadNext: expect.any(Function),
        setData: expect.any(Function),
      },
      pageSize: expect.any(Number),
      state: "ready",
      data: [],
      newData: [],
      pendingData: null,
      errorData: null,
    });
  });

  it("prop handlerMap.load", async () => {
    const data0 = getData(10);
    const data1 = getData(10);
    let handlerMap = {
      load: jest.fn(async ({ pageInfo } = {}) => {
        let pageIndex = pageInfo ? pageInfo.pageIndex : 0;
        let data = pageIndex === 0 ? data0 : data1;
        return { itemList: data, pageInfo: { pageIndex: 0, pageSize: 10 } };
      }),
    };
    const { result } = Test.renderHook(() => useDataStore(), {
      wrapper: (props) => (
        <DataStoreProvider
          handlerMap={handlerMap}
          pageSize={10}
          filterDefinitionList={[{ key: "f1", initialValue: "v1" }, { key: "f2" }, { key: "f3", initialValue: 0 }]}
          sorterDefinitionList={[
            { key: "s1", initialAscending: true },
            { key: "s2" },
            { key: "s3", initialAscending: false },
          ]}
        >
          {props.children}
        </DataStoreProvider>
      ),
    });
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenLastCalledWith({
      filterMap: { f1: "v1", f3: 0 },
      sorterList: [
        { key: "s1", ascending: true },
        { key: "s3", ascending: false },
      ],
      pageInfo: { pageSize: 10 },
    });

    Test.act(() => {
      result.current.handlerMap.loadNext({ pageInfo: { pageIndex: 1 } });
    });
    await Utils.wait();
    expect(handlerMap.load).toHaveBeenLastCalledWith({
      filterMap: { f1: "v1", f3: 0 },
      sorterList: [
        { key: "s1", ascending: true },
        { key: "s3", ascending: false },
      ],
      pageInfo: { pageSize: 10, pageIndex: 1 },
    });
  });
});
