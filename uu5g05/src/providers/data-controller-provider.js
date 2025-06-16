import { useMemo, useEffect } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import useSelectionSupport from "../_internal/use-selection-support.js";
import { useFilterList, applyLocalFilters } from "../_internal/use-filter-list.js";
import { useSorterList, applyLocalSorters } from "../_internal/use-sorter-list.js";
import DataFilterContext from "../contexts/data-filter-context.js";
import DataSorterContext from "../contexts/data-sorter-context.js";
import DataSelectionContext from "../contexts/data-selection-context.js";
import Config from "../config/config.js";
import DataControllerContext from "../contexts/data-controller-context.js";
import { Context } from "../utils.js";

const EMPTY_ARRAY = Object.freeze([]);

function isMissingValue(propName, definitionList, activeList, valueName) {
  let isControlled = Array.isArray(activeList);
  return definitionList.some((definition) => {
    if (definition[propName]) {
      if (
        (isControlled && activeList.find((item) => item.key === definition.key)?.[valueName] == null) ||
        (!isControlled && definition.initialValue == null)
      ) {
        return true;
      }
    }
  });
}

const DataControllerProvider = createComponent({
  uu5Tag: Config.TAG + "DataControllerProvider",

  propTypes: {
    itemIdentifier: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    data: PropTypes.array,

    filterDefinitionList: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        filter: PropTypes.func,
        initialValue: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
          PropTypes.bool,
          PropTypes.object,
          PropTypes.array,
        ]),
        required: PropTypes.bool,
      }).isRequired,
    ),
    filterList: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
          PropTypes.bool,
          PropTypes.object,
          PropTypes.array,
        ]),
      }),
    ),
    onFilterChange: PropTypes.func,

    sorterDefinitionList: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        sort: PropTypes.func,
        initialAscending: PropTypes.bool,
      }).isRequired,
    ),
    sorterList: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        ascending: PropTypes.bool,
      }),
    ),
    onSorterChange: PropTypes.func,

    selectable: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(["none", "multiple", "single"])]),
    initialIsDisplayedSelected: PropTypes.bool,
    initialSelectedData: PropTypes.array,
  },

  defaultProps: {
    itemIdentifier: "id",
    data: EMPTY_ARRAY,
    filterDefinitionList: EMPTY_ARRAY,
    filterList: undefined,
    onFilterChange: undefined,
    sorterDefinitionList: EMPTY_ARRAY,
    sorterList: undefined,
    onSorterChange: undefined,
    selectable: false,
    initialIsDisplayedSelected: false,
    initialSelectedData: EMPTY_ARRAY,
  },

  render(props) {
    let {
      children,
      itemIdentifier,
      data,
      filterDefinitionList,
      filterList: propsFilterList,
      onFilterChange,
      sorterDefinitionList: propsSorterDefinitionList,
      sorterList: propsSorterList,
      onSorterChange,
      selectable,
      initialIsDisplayedSelected,
      initialSelectedData,
    } = props;
    let [filterList, filterApi] = useFilterList(
      filterDefinitionList,
      propsFilterList,
      typeof onFilterChange === "function"
        ? (newFilterList) => {
            onFilterChange({ filterList: newFilterList, sorterList });
          }
        : undefined,
    );
    let [sorterList, sorterApi] = useSorterList(
      propsSorterDefinitionList,
      propsSorterList,
      typeof onSorterChange === "function"
        ? (value) => {
            onSorterChange({ sorterList: value, filterList });
          }
        : undefined,
    );

    let displayedData = data;
    displayedData = useMemo(
      () => applyLocalFilters(displayedData, filterList, filterDefinitionList),
      [displayedData, filterDefinitionList, filterList],
    );
    displayedData = useMemo(
      () => applyLocalSorters(displayedData, sorterList, sorterApi.sorterDefinitionList),
      [displayedData, sorterApi.sorterDefinitionList, sorterList],
    );

    let selectionApi;
    [displayedData, selectionApi] = useSelectionSupport(
      data,
      displayedData,
      itemIdentifier,
      selectable,
      initialIsDisplayedSelected ?? props.initialDisplaySelected, // initialDisplaySelected for backward compatibility
      initialSelectedData,
    );
    let dataApi = useMemo(() => ({ itemIdentifier, data, displayedData }), [data, itemIdentifier, displayedData]);

    useEffect(() => {
      let isMissingRequiredValue = isMissingValue("required", filterDefinitionList, propsFilterList, "value");
      let isMissingValueForReadOnly = isMissingValue("readOnly", filterDefinitionList, propsFilterList, "value");

      if (isMissingRequiredValue) {
        console.error("filterDefinitionList contains required filters without an initial value!", filterDefinitionList);
      }
      if (isMissingValueForReadOnly) {
        console.error(
          "filterDefinitionList contains read-only filters without an initial value!",
          filterDefinitionList,
        );
      }
    }, [filterDefinitionList, propsFilterList]);

    useEffect(() => {
      let isMissingValueForReadOnly = isMissingValue(
        "readOnly",
        propsSorterDefinitionList,
        propsSorterList,
        "ascending",
      );
      if (isMissingValueForReadOnly) {
        console.error(
          "sorterDefinitionList contains read-only sorters without an initial value!",
          propsSorterDefinitionList,
        );
      }
    }, [propsSorterDefinitionList, propsSorterList]);

    if (typeof children === "function") {
      return children(dataApi, filterApi, sorterApi, selectionApi);
    } else {
      return (
        <DataControllerContext.Provider value={dataApi}>
          <DataFilterContext.Provider value={filterApi}>
            <DataSorterContext.Provider value={sorterApi}>
              <DataSelectionContext.Provider value={selectionApi}>{children}</DataSelectionContext.Provider>
            </DataSorterContext.Provider>
          </DataFilterContext.Provider>
        </DataControllerContext.Provider>
      );
    }
  },
});

function createDataControllerContext() {
  const [DataControllerContext, useDataController] = Context.create();
  const [DataFilterContext, useDataFilter] = Context.create();
  const [DataSorterContext, useDataSorter] = Context.create();
  const [DataSelectionContext, useDataSelection] = Context.create();

  const _DataControllerProvider = ({ children, ...props }) => (
    <DataControllerProvider {...props}>
      {(dataApi, filterApi, sorterApi, selectionApi) => {
        return (
          <DataControllerContext.Provider value={dataApi}>
            <DataFilterContext.Provider value={filterApi}>
              <DataSorterContext.Provider value={sorterApi}>
                <DataSelectionContext.Provider value={selectionApi}>
                  {typeof children === "function" ? children(selectionApi) : children}
                </DataSelectionContext.Provider>
              </DataSorterContext.Provider>
            </DataFilterContext.Provider>
          </DataControllerContext.Provider>
        );
      }}
    </DataControllerProvider>
  );

  return { Provider: _DataControllerProvider, useDataController, useDataFilter, useDataSorter, useDataSelection };
}

DataControllerProvider.create = createDataControllerContext;

export { DataControllerProvider };
export default DataControllerProvider;
