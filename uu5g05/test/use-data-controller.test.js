import {
  DataControllerProvider,
  useDataController,
  useDataFilter,
  useDataSorter,
  useDataSelection,
  useState,
} from "uu5g05";
import { Test, Utils } from "uu5g05-test";
import {
  getData,
  FILTERS,
  SORTERS,
  sortByType,
  sortByFontSize,
  filterByColorSchema,
  filterByType,
  createMockFn,
} from "./internal/mock-data.js";
import { createRerenderableComponent } from "./internal/tools.js";

function initTest() {
  const { HookComponent: ControllerHookComponent, ...renderResult } = Test.createHookComponent(() =>
    useDataController(),
  );
  const { result: filterResult, HookComponent: FilterHookComponent } = Test.createHookComponent(() => useDataFilter());
  const { result: sorterResult, HookComponent: SorterHookComponent } = Test.createHookComponent(() => useDataSorter());
  const { result: selectionResult, HookComponent: SelectionHookComponent } = Test.createHookComponent(() =>
    useDataSelection(),
  );
  let HookComponent = () => (
    <ControllerHookComponent>
      <FilterHookComponent>
        <SorterHookComponent>
          <SelectionHookComponent />
        </SorterHookComponent>
      </FilterHookComponent>
    </ControllerHookComponent>
  );
  return {
    ...renderResult,
    HookComponent,
    filterResult,
    sorterResult,
    selectionResult,
  };
}

describe("ControllerProvider", function () {
  it("returns expected API", async () => {
    const { result, filterResult, sorterResult, selectionResult, HookComponent } = initTest();
    Test.render(
      <DataControllerProvider initialData={[]}>
        <HookComponent />
      </DataControllerProvider>,
    );
    expect(result.current).toEqual({
      data: expect.any(Array),
      displayedData: expect.any(Array),
      itemIdentifier: expect.any(String),
    });
    expect(filterResult.current).toEqual({
      addFilter: expect.any(Function),
      clearFilterList: expect.any(Function),
      filterDefinitionList: expect.any(Array),
      filterList: expect.any(Array),
      removeFilter: expect.any(Function),
      setFilterList: expect.any(Function),
    });
    expect(sorterResult.current).toEqual({
      addSorter: expect.any(Function),
      addSorterDefinition: expect.any(Function),
      clearSorterList: expect.any(Function),
      removeSorter: expect.any(Function),
      removeSorterDefinition: expect.any(Function),
      setSorterList: expect.any(Function),
      sorterDefinitionList: expect.any(Array),
      sorterList: expect.any(Array),
    });
    expect(selectionResult.current).toEqual({
      addSelected: expect.any(Function),
      clearSelected: expect.any(Function),
      isDisplayedSelected: expect.any(Boolean),
      isSelected: expect.any(Function),
      removeSelected: expect.any(Function),
      selectable: expect.any(Boolean),
      selectedData: expect.any(Array),
      setSelected: expect.any(Function),
      toggleIsDisplayedSelected: expect.any(Function),
    });
  });

  it("mount behaviour", async () => {
    const { result, HookComponent } = initTest();
    const initialData = getData(10);
    Test.render(
      <DataControllerProvider data={initialData}>
        <HookComponent />
      </DataControllerProvider>,
    );
    expect(result.current.data).toEqual(initialData);
    expect(result.current.displayedData).toEqual(initialData);
  });

  it("itemIdentifier", async () => {
    const { selectionResult, HookComponent } = initTest();
    const data = [
      { uid: "id1", code: "codeA", nested: { awid: "1" } },
      { uid: "id2", code: "codeA", nested: { awid: "2" } },
      { uid: "id3", code: "codeB", nested: { awid: "2" } },
      { uid: "id4", code: "codeB", nested: { awid: "3" } },
    ];
    const { rerender, Component } = createRerenderableComponent((props) => (
      <DataControllerProvider data={data} itemIdentifier="uid" selectable initialSelectedData={[data[1]]} {...props} />
    ));
    Test.render(
      <Component>
        <HookComponent />
      </Component>,
    );
    expect(selectionResult.current.isSelected(data[1])).toBe(true);
    expect(selectionResult.current.isSelected({ uid: "id1" })).toBe(false);
    expect(selectionResult.current.isSelected({ uid: "id2" })).toBe(true);

    rerender({ itemIdentifier: ["code", "nested.awid"] });
    expect(selectionResult.current.isSelected(data[1])).toBe(true);
    expect(selectionResult.current.isSelected({ uid: "id2" })).toBe(false); // wrong parameter (does not contain all keys according to itemIdentifier)
    expect(selectionResult.current.isSelected({ code: "codeA" })).toBe(false); // wrong parameter (does not contain all keys according to itemIdentifier)
    expect(selectionResult.current.isSelected({ code: "codeA", nested: { awid: "3" } })).toBe(false);
    expect(selectionResult.current.isSelected({ code: "codeA", nested: { awid: "2" } })).toBe(true);
  });

  it("sorterList", async () => {
    const { result, sorterResult, HookComponent } = initTest();
    const onSorterChangeFn = createMockFn();
    const data = getData(10);
    const SORTERS_WITH_VALUES = SORTERS.map((it, i) => ({ key: it.key, ascending: i === 0 }));
    const sorterDefinitionList = SORTERS.map((it, i) => (i === 0 ? { ...it, initialAscending: true } : it));
    Test.render(
      <DataControllerProvider data={data} sorterDefinitionList={sorterDefinitionList} onSorterChange={onSorterChangeFn}>
        <HookComponent />
      </DataControllerProvider>,
    );
    expect(sorterResult.current.sorterDefinitionList).toEqual(sorterDefinitionList);
    expect(sorterResult.current.sorterList).toEqual([SORTERS_WITH_VALUES[0]]);
    expect(result.current.displayedData).toEqual([...data].sort(sortByType));
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(0);

    // addSorter
    Test.act(() => {
      sorterResult.current.addSorter({ key: SORTERS[1].key, ascending: false });
    });
    expect(sorterResult.current.sorterList).toEqual([SORTERS_WITH_VALUES[0], SORTERS_WITH_VALUES[1]]);
    expect(result.current.displayedData).toEqual([...data].sort((a, b) => sortByType(a, b) || -sortByFontSize(a, b)));
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(1);
    expect(onSorterChangeFn.lastValues.sorterList).toEqual([SORTERS_WITH_VALUES[0], SORTERS_WITH_VALUES[1]]);

    // clearSorterList
    Test.act(() => {
      sorterResult.current.clearSorterList();
    });
    expect(sorterResult.current.sorterList).toEqual([]);
    expect(result.current.displayedData).toEqual(data);
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(2);
    expect(onSorterChangeFn.lastValues.sorterList).toEqual([]);

    // setSorterList
    Test.act(() => {
      sorterResult.current.setSorterList(SORTERS.map(({ key }) => ({ key })));
    });
    expect(sorterResult.current.sorterList).toEqual(SORTERS.map((it) => ({ key: it.key, ascending: true })));
    expect(result.current.displayedData).toEqual([...data].sort((a, b) => sortByType(a, b) || sortByFontSize(a, b)));
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(3);
    expect(onSorterChangeFn.lastValues.sorterList).toEqual(SORTERS.map((it) => ({ key: it.key, ascending: true })));

    // removeSorter
    Test.act(() => {
      sorterResult.current.removeSorter(SORTERS[0].key);
    });
    expect(sorterResult.current.sorterList).toEqual(SORTERS.slice(1).map((it) => ({ key: it.key, ascending: true })));
    expect(result.current.displayedData).toEqual([...data].sort((a, b) => sortByFontSize(a, b)));
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(4);
    expect(onSorterChangeFn.lastValues.sorterList).toEqual(
      SORTERS.slice(1).map((it) => ({ key: it.key, ascending: true })),
    );

    Test.act(() => {
      sorterResult.current.clearSorterList();
    });
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(5);

    // addSorter with array
    Test.act(() => {
      sorterResult.current.addSorter(SORTERS.map(({ key }) => ({ key })));
    });
    expect(sorterResult.current.sorterList).toEqual(SORTERS.map((it) => ({ key: it.key, ascending: true })));
    expect(result.current.displayedData).toEqual([...data].sort((a, b) => sortByType(a, b) || sortByFontSize(a, b)));
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(6);
    expect(onSorterChangeFn.lastValues.sorterList).toEqual(SORTERS.map((it) => ({ key: it.key, ascending: true })));

    // multiple React-batched operations
    Test.act(() => {
      sorterResult.current.clearSorterList();
      sorterResult.current.addSorter(SORTERS_WITH_VALUES[0]);
      sorterResult.current.addSorter(SORTERS_WITH_VALUES[1]);
    });
    expect(sorterResult.current.sorterList).toEqual([SORTERS_WITH_VALUES[0], SORTERS_WITH_VALUES[1]]);
    await Utils.wait();
  });

  it("sorterList controlled", async () => {
    const { result, sorterResult, HookComponent } = initTest();
    const onSorterChangeFn = createMockFn();
    const data = getData(10);
    const SORTERS_WITH_VALUES = SORTERS.map((it, i) => ({ key: it.key, ascending: i === 0 }));
    const sorterDefinitionList = SORTERS.map((it, i) => (i === 1 ? { ...it, initialAscending: false } : it));

    function TestComponent() {
      const [sorterList, setSorterList] = useState([SORTERS_WITH_VALUES[0]]);
      return (
        <DataControllerProvider
          data={data}
          sorterDefinitionList={sorterDefinitionList}
          sorterList={sorterList}
          onSorterChange={(...args) => {
            setSorterList(args[0].sorterList);
            onSorterChangeFn(...args);
          }}
        >
          <HookComponent />
        </DataControllerProvider>
      );
    }
    Test.render(<TestComponent />);

    expect(sorterResult.current.sorterDefinitionList).toEqual(sorterDefinitionList);
    expect(sorterResult.current.sorterList).toEqual([SORTERS_WITH_VALUES[0]]);
    expect(result.current.displayedData).toEqual([...data].sort(sortByType));
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(0);

    // addSorter
    Test.act(() => {
      sorterResult.current.addSorter({ key: SORTERS[1].key, ascending: false });
    });
    expect(sorterResult.current.sorterList).toEqual([SORTERS_WITH_VALUES[0], SORTERS_WITH_VALUES[1]]);
    expect(result.current.displayedData).toEqual([...data].sort((a, b) => sortByType(a, b) || -sortByFontSize(a, b)));
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(1);
    expect(onSorterChangeFn.lastValues.sorterList).toEqual([SORTERS_WITH_VALUES[0], SORTERS_WITH_VALUES[1]]);

    // clearSorterList
    Test.act(() => {
      sorterResult.current.clearSorterList();
    });
    expect(sorterResult.current.sorterList).toEqual([]);
    expect(result.current.displayedData).toEqual(data);
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(2);
    expect(onSorterChangeFn.lastValues.sorterList).toEqual([]);

    // setSorterList
    Test.act(() => {
      sorterResult.current.setSorterList(SORTERS.map(({ key }) => ({ key })));
    });
    expect(sorterResult.current.sorterList).toEqual(SORTERS.map((it) => ({ key: it.key, ascending: true })));
    expect(result.current.displayedData).toEqual([...data].sort((a, b) => sortByType(a, b) || sortByFontSize(a, b)));
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(3);
    expect(onSorterChangeFn.lastValues.sorterList).toEqual(SORTERS.map((it) => ({ key: it.key, ascending: true })));

    // removeSorter
    Test.act(() => {
      sorterResult.current.removeSorter(SORTERS[0].key);
    });
    expect(sorterResult.current.sorterList).toEqual(SORTERS.slice(1).map((it) => ({ key: it.key, ascending: true })));
    expect(result.current.displayedData).toEqual([...data].sort((a, b) => sortByFontSize(a, b)));
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(4);
    expect(onSorterChangeFn.lastValues.sorterList).toEqual(
      SORTERS.slice(1).map((it) => ({ key: it.key, ascending: true })),
    );

    Test.act(() => {
      sorterResult.current.clearSorterList();
    });
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(5);

    // addSorter with array
    Test.act(() => {
      sorterResult.current.addSorter(SORTERS.map(({ key }) => ({ key })));
    });
    expect(sorterResult.current.sorterList).toEqual(SORTERS.map((it) => ({ key: it.key, ascending: true })));
    expect(result.current.displayedData).toEqual([...data].sort((a, b) => sortByType(a, b) || sortByFontSize(a, b)));
    await Utils.wait();
    expect(onSorterChangeFn).toHaveBeenCalledTimes(6);
    expect(onSorterChangeFn.lastValues.sorterList).toEqual(SORTERS.map((it) => ({ key: it.key, ascending: true })));

    // multiple React-batched operations
    Test.act(() => {
      sorterResult.current.clearSorterList();
      sorterResult.current.addSorter(SORTERS_WITH_VALUES[0]);
      sorterResult.current.addSorter(SORTERS_WITH_VALUES[1]);
    });
    expect(sorterResult.current.sorterList).toEqual([SORTERS_WITH_VALUES[0], SORTERS_WITH_VALUES[1]]);
    await Utils.wait();

    // TODO addSorterDefinition, removeSorterDefinition
  });

  it("filterList", async () => {
    const { result, filterResult, HookComponent } = initTest();
    const onFilterChangeFn = createMockFn();
    const data = getData(10);
    const FILTERS_WITH_VALUES = FILTERS.map((it, i) => ({ key: it.key, value: i === 0 ? "red" : "secondary" }));
    const filterDefinitionList = FILTERS.map((it, i) => (i === 0 ? { ...FILTERS[0], initialValue: "red" } : it));
    Test.render(
      <DataControllerProvider data={data} filterDefinitionList={filterDefinitionList} onFilterChange={onFilterChangeFn}>
        <HookComponent />
      </DataControllerProvider>,
    );
    expect(filterResult.current.filterDefinitionList).toBe(filterDefinitionList);
    expect(filterResult.current.filterList).toEqual([FILTERS_WITH_VALUES[0]]);
    expect(result.current.displayedData).toEqual(data.filter(filterByColorSchema));
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(0);

    // addFilter
    Test.act(() => {
      filterResult.current.addFilter(FILTERS_WITH_VALUES[1]);
    });
    expect(filterResult.current.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));
    expect(result.current.displayedData).toEqual(
      data.filter((item) => filterByColorSchema(item) && filterByType(item)),
    );
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(1);
    expect(onFilterChangeFn.lastValues.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));

    // clearFilter
    Test.act(() => {
      filterResult.current.clearFilterList();
    });
    expect(filterResult.current.filterList).toEqual([]);
    expect(result.current.displayedData).toEqual(data);
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(2);
    expect(onFilterChangeFn.lastValues.filterList).toEqual([]);

    // setFilterList
    Test.act(() => {
      filterResult.current.setFilterList(FILTERS_WITH_VALUES.slice(0, 2));
    });
    expect(filterResult.current.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));
    expect(result.current.displayedData).toEqual(
      data.filter((item) => filterByColorSchema(item) && filterByType(item)),
    );
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(3);
    expect(onFilterChangeFn.lastValues.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));

    // removeFilter
    Test.act(() => {
      filterResult.current.removeFilter(FILTERS_WITH_VALUES[0].key);
    });
    expect(filterResult.current.filterList).toEqual([FILTERS_WITH_VALUES[1]]);
    expect(result.current.displayedData).toEqual(data.filter(filterByType));
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(4);
    expect(onFilterChangeFn.lastValues.filterList).toEqual([FILTERS_WITH_VALUES[1]]);

    Test.act(() => {
      filterResult.current.clearFilterList();
    });
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(5);

    // addFilter with array
    Test.act(() => {
      filterResult.current.addFilter(FILTERS_WITH_VALUES.slice(0, 2));
    });
    expect(filterResult.current.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));
    expect(result.current.displayedData).toEqual(
      data.filter((item) => filterByColorSchema(item) && filterByType(item)),
    );
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(6);
    expect(onFilterChangeFn.lastValues.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));

    // multiple React-batched operations
    Test.act(() => {
      filterResult.current.clearFilterList();
      filterResult.current.addFilter(FILTERS_WITH_VALUES[0]);
      filterResult.current.addFilter(FILTERS_WITH_VALUES[2]);
    });
    expect(filterResult.current.filterList).toEqual([FILTERS_WITH_VALUES[0], FILTERS_WITH_VALUES[2]]);
    await Utils.wait();
  });

  it("filterList controlled", async () => {
    const { result, filterResult, HookComponent } = initTest();
    const onFilterChangeFn = createMockFn();
    const data = getData(10);
    const FILTERS_WITH_VALUES = FILTERS.map((it, i) => ({ key: it.key, value: i === 0 ? "red" : "secondary" }));
    const filterDefinitionList = FILTERS.map((it, i) => (i === 0 ? { ...FILTERS[0], initialValue: "red" } : it));
    Test.render(
      <DataControllerProvider data={data} filterDefinitionList={filterDefinitionList} onFilterChange={onFilterChangeFn}>
        <HookComponent />
      </DataControllerProvider>,
    );

    function TestComponent() {
      const [filterList, setFilterList] = useState([FILTERS_WITH_VALUES[0]]);
      return (
        <DataControllerProvider
          data={data}
          filterDefinitionList={filterDefinitionList}
          filterList={filterList}
          onFilterChange={(...args) => {
            setFilterList(args[0].filterList);
            onFilterChangeFn(...args);
          }}
        >
          <HookComponent />
        </DataControllerProvider>
      );
    }
    Test.render(<TestComponent />);

    expect(filterResult.current.filterDefinitionList).toBe(filterDefinitionList);
    expect(filterResult.current.filterList).toEqual([FILTERS_WITH_VALUES[0]]);
    expect(result.current.displayedData).toEqual(data.filter(filterByColorSchema));
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(0);

    // addFilter
    Test.act(() => {
      filterResult.current.addFilter(FILTERS_WITH_VALUES[1]);
    });
    expect(filterResult.current.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));
    expect(result.current.displayedData).toEqual(
      data.filter((item) => filterByColorSchema(item) && filterByType(item)),
    );
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(1);
    expect(onFilterChangeFn.lastValues.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));

    // clearFilter
    Test.act(() => {
      filterResult.current.clearFilterList();
    });
    expect(filterResult.current.filterList).toEqual([]);
    expect(result.current.displayedData).toEqual(data);
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(2);
    expect(onFilterChangeFn.lastValues.filterList).toEqual([]);

    // setFilterList
    Test.act(() => {
      filterResult.current.setFilterList(FILTERS_WITH_VALUES.slice(0, 2));
    });
    expect(filterResult.current.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));
    expect(result.current.displayedData).toEqual(
      data.filter((item) => filterByColorSchema(item) && filterByType(item)),
    );
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(3);
    expect(onFilterChangeFn.lastValues.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));

    // removeFilter
    Test.act(() => {
      filterResult.current.removeFilter(FILTERS_WITH_VALUES[0].key);
    });
    expect(filterResult.current.filterList).toEqual([FILTERS_WITH_VALUES[1]]);
    expect(result.current.displayedData).toEqual(data.filter(filterByType));
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(4);
    expect(onFilterChangeFn.lastValues.filterList).toEqual([FILTERS_WITH_VALUES[1]]);

    Test.act(() => {
      filterResult.current.clearFilterList();
    });
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(5);

    // addFilter with array
    Test.act(() => {
      filterResult.current.addFilter(FILTERS_WITH_VALUES.slice(0, 2));
    });
    expect(filterResult.current.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));
    expect(result.current.displayedData).toEqual(
      data.filter((item) => filterByColorSchema(item) && filterByType(item)),
    );
    await Utils.wait();
    expect(onFilterChangeFn).toHaveBeenCalledTimes(6);
    expect(onFilterChangeFn.lastValues.filterList).toEqual(FILTERS_WITH_VALUES.slice(0, 2));

    // multiple React-batched operations
    Test.act(() => {
      filterResult.current.clearFilterList();
      filterResult.current.addFilter(FILTERS_WITH_VALUES[0]);
      filterResult.current.addFilter(FILTERS_WITH_VALUES[2]);
    });
    expect(filterResult.current.filterList).toEqual([FILTERS_WITH_VALUES[0], FILTERS_WITH_VALUES[2]]);
    await Utils.wait();
  });

  it("filterList required", async () => {
    const { HookComponent } = initTest();
    const onFilterChangeFn = createMockFn();
    const data = getData(10);
    jest.spyOn(console, "error").mockImplementation();

    let filterDefinitionList = FILTERS.map((it, i) => (i === 0 ? { ...FILTERS[0], required: true } : it));
    Test.render(
      <DataControllerProvider data={data} filterDefinitionList={filterDefinitionList} onFilterChange={onFilterChangeFn}>
        <HookComponent />
      </DataControllerProvider>,
    );
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenLastCalledWith(expect.any(String), expect.any(Object));

    filterDefinitionList = FILTERS.map((it, i) =>
      i === 0 ? { ...FILTERS[0], required: true, initialValue: "red" } : it,
    );
    Test.render(
      <DataControllerProvider data={data} filterDefinitionList={filterDefinitionList} onFilterChange={onFilterChangeFn}>
        <HookComponent />
      </DataControllerProvider>,
    );
    expect(console.error).toHaveBeenCalledTimes(1);

    Test.render(
      <DataControllerProvider data={data} filterDefinitionList={filterDefinitionList} onFilterChange={onFilterChangeFn}>
        <HookComponent />
      </DataControllerProvider>,
    );
    expect(console.error).toHaveBeenCalledTimes(1);

    function TestComponent(props) {
      const [filterList, setFilterList] = useState(props.initialFilterList || []);
      return (
        <DataControllerProvider
          data={data}
          filterDefinitionList={filterDefinitionList}
          filterList={filterList}
          onFilterChange={(...args) => {
            setFilterList(args[0].filterList);
            onFilterChangeFn(...args);
          }}
        >
          <HookComponent />
        </DataControllerProvider>
      );
    }
    Test.render(<TestComponent />);
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenLastCalledWith(expect.any(String), expect.any(Object));

    let initialFilterList = FILTERS.map((it, i) => ({ key: it.key, value: i === 0 ? "red" : "secondary" }));
    Test.render(<TestComponent initialFilterList={initialFilterList} />);
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it("selectedData", async () => {
    const { selectionResult, HookComponent } = initTest();
    const data = getData(10);
    const initialSelectedData = data.slice(5, 10);
    Test.render(
      <DataControllerProvider data={data} selectable initialSelectedData={initialSelectedData}>
        <HookComponent />
      </DataControllerProvider>,
    );
    expect(selectionResult.current.selectedData).toEqual(initialSelectedData);

    // addSelected
    Test.act(() => {
      selectionResult.current.addSelected(data[4]);
    });
    expect(selectionResult.current.selectedData).toEqual([data[4], ...initialSelectedData]);

    // clearSelected
    Test.act(() => {
      selectionResult.current.clearSelected();
    });
    expect(selectionResult.current.selectedData).toEqual([]);

    // setSelected
    Test.act(() => {
      selectionResult.current.setSelected(data.slice(0, 2));
    });
    expect(selectionResult.current.selectedData).toEqual(data.slice(0, 2));

    // removeSelected
    Test.act(() => {
      selectionResult.current.removeSelected(data[1]);
    });
    expect(selectionResult.current.selectedData).toEqual([data[0]]);

    Test.act(() => {
      selectionResult.current.clearSelected();
    });

    // addSelected with array
    Test.act(() => {
      selectionResult.current.addSelected(data.slice(0, 2));
    });
    expect(selectionResult.current.selectedData).toEqual(data.slice(0, 2));

    // addSelected with already added items
    Test.act(() => {
      selectionResult.current.addSelected(data.slice(1, 3));
    });
    expect(selectionResult.current.selectedData).toEqual(data.slice(0, 3));

    // multiple React-batched operations
    Test.act(() => {
      selectionResult.current.clearSelected();
      selectionResult.current.addSelected(data[4]);
      selectionResult.current.addSelected(data[1]);
    });
    expect(selectionResult.current.selectedData).toEqual([data[1], data[4]]);
    await Utils.wait();
  });

  it("selectedData with data change", async () => {
    const { selectionResult, HookComponent } = initTest();
    const data1 = getData(10);
    const { rerender, Component } = createRerenderableComponent((props) => (
      <DataControllerProvider data={data1} selectable initialSelectedData={data1.slice(0, 3)} {...props} />
    ));
    Test.render(
      <Component>
        <HookComponent />
      </Component>,
    );

    // check item change propagation
    const data2 = [{ ...data1[0], content: "changedItem" }, ...data1.slice(1)];
    rerender({ data: data2 });
    expect(selectionResult.current.selectedData).toEqual(data2.slice(0, 3));

    // check item order change propagation
    const data3 = [data2[2], data2[1], data2[0], ...data2.slice(3)];
    rerender({ data: data3 });
    expect(selectionResult.current.selectedData).toEqual(data3.slice(0, 3));

    // selection should be preserved even if item is no longer in "data" (e.g. user added filter which matched no item)
    rerender({ data: [] });
    expect(selectionResult.current.selectedData).toEqual(data3.slice(0, 3));
  });

  it("isSelected", async () => {
    const { selectionResult, HookComponent } = initTest();
    const data = getData(10);
    Test.render(
      <DataControllerProvider data={data} selectable>
        <HookComponent />
      </DataControllerProvider>,
    );

    expect(selectionResult.current.isSelected(data[5])).toBe(false);
    Test.act(() => {
      selectionResult.current.setSelected([data[5]]);
    });
    expect(selectionResult.current.isSelected(data[5])).toBe(true);
  });

  it("isDisplayedSelected", async () => {
    const { result, selectionResult, HookComponent } = initTest();
    const data = getData(10);
    const initialSelectedData = data.slice(5, 10);
    Test.render(
      <DataControllerProvider data={data} selectable initialSelectedData={initialSelectedData}>
        <HookComponent />
      </DataControllerProvider>,
    );

    Test.act(() => {
      selectionResult.current.toggleIsDisplayedSelected();
    });
    expect(result.current.displayedData).toEqual(initialSelectedData);
  });
});
