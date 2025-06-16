import { useMemo, useCallback, useRef } from "../hooks/react-hooks.js";
import useValueChange from "./use-value-change.js";
import Tools from "./tools.js";

function normalizeFilterList(filterDefinitionList, filterList) {
  // normalize to { key, value } items and preserve only those that exist in filterDefinitionList
  let normalizedFilterList = filterList
    .map((item) => {
      if (item?.key != null && item?.value != null) {
        let otherInfo = item.isBool ? { isBool: item.isBool, isRequired: item.isRequired } : {};
        return { key: item.key, value: item.value, ...otherInfo };
      }
      return undefined;
    })
    .filter(Boolean);

  let validList = normalizedFilterList.filter((item) => {
    let definitionItem = filterDefinitionList.find((it) => it.key === item.key);
    if (process.env.NODE_ENV === "development" && !definitionItem) {
      Tools.warning(
        `A filter with the key "${item.key}" is active in DataControllerProvider but it is missing in the property filterDefinitionList and therefore is ignored.`,
        { item },
      );
    }
    return !!definitionItem;
  });

  return validList.length === normalizedFilterList ? normalizedFilterList : validList;
}

function useFilterList(filterDefinitionList, propsFilterList, onChange) {
  const controlled = propsFilterList && typeof onChange === "function";

  if (!propsFilterList) {
    propsFilterList = filterDefinitionList
      .filter((filter) => filter?.initialValue != null)
      .map((filter) => {
        let { initialValue, key } = filter;
        return { key, value: initialValue };
      });
  }

  let [storedFilterList, setStoredFilterList] = useValueChange(
    propsFilterList,
    typeof onChange === "function"
      ? (newFilterList) => {
          onChange(normalizeFilterList(filterDefinitionList, newFilterList));
        }
      : undefined,
    controlled,
  );

  let filterList = useMemo(
    () => (controlled ? storedFilterList : normalizeFilterList(filterDefinitionList, storedFilterList)),
    [controlled, filterDefinitionList, storedFilterList],
  );

  // if the computed filterList differs from the stored one then there must
  // be some invalid values in stored list => we can safely splice it as it isn't anywhere on API
  // and next filter operations (add/remove/...) will operate on smaller list thanks to that
  if (storedFilterList.length !== filterList.length) storedFilterList.splice(0, storedFilterList.length, ...filterList);

  const currentValuesRef = useRef();
  currentValuesRef.current = { filterDefinitionList, storedFilterList };

  const addFilter = useCallback(
    (list) => {
      let addList = !Array.isArray(list) ? [list] : list;

      if (addList.length) {
        let hasEmptyRequired = currentValuesRef.current.filterDefinitionList.some((filterDef) => {
          if (filterDef.required) {
            let matchingItem = addList.find((it) => it.key === filterDef.key);
            return matchingItem && matchingItem?.value == null;
          }
        });

        if (hasEmptyRequired) {
          console.error(
            "Some of the filters sent to the addFilter function are required and have an invalid value!",
            list,
          );
        } else {
          setStoredFilterList((curList) => {
            let newFilterList = curList;
            for (let newFilter of addList) {
              let newFilterDef = currentValuesRef.current.filterDefinitionList.find(
                (filter) => filter.key === newFilter.key,
              );
              if (newFilterDef && newFilterDef.inputType === "bool") {
                newFilter = { ...newFilter, isRequired: newFilterDef.required, isBool: true };
                // if the inputType of the filter is bool and the required key is set to true,
                // it is necessary that the position of this filter is always the same
                // the isRequired key has only filter with inputType bool
              }

              // filter function is necessary for correct filter sorting with inputType bool
              // that don't have the isReguired key set to true
              // filter with inputType bool is always in filterList
              let currentFilters = newFilterList.filter(
                (it) => (it && !it.isBool) || (it && it.isBool && (it.isRequired || it.value)),
              );

              let isFilterChanged = currentFilters.some((curFilter) => curFilter.key === newFilter.key);

              if (isFilterChanged) {
                // active filter was changed
                newFilterList = currentFilters.map((curFilter) =>
                  curFilter.key === newFilter.key ? newFilter : curFilter,
                );
              } else {
                // new filter was added
                newFilterList = currentFilters.concat([newFilter]);
              }
            }
            return newFilterList;
          });
        }
      }
    },
    [setStoredFilterList],
  );

  const removeFilter = useCallback(
    (list) => {
      let removeList = list && !Array.isArray(list) ? [list] : list;
      if (removeList?.length) {
        let hasRequired = removeList.some((it) => {
          let definition = currentValuesRef.current.filterDefinitionList.find((filterDef) => it === filterDef.key);
          if (definition?.required) return true;
        });

        if (hasRequired) {
          console.error(
            "Some of the filters sent to the removeFilter function are set as required and cannot be removed!",
            list,
          );
        } else {
          let isInRemoveList = (key) => removeList.some((removeItem) => removeItem === key);
          setStoredFilterList((curList) => {
            let newList = curList.filter((it) => it && !isInRemoveList(it.key));
            return newList.length === curList.length ? curList : newList;
          });
        }
      }
    },
    [setStoredFilterList],
  );

  const clearFilterList = useCallback(() => {
    setStoredFilterList((curList) => {
      let newList = curList.filter((it) => it.required);
      return newList.length === curList.length ? curList : newList;
    });
  }, [setStoredFilterList]);

  const setFilterList = useCallback(
    (list) => {
      if (Array.isArray(list)) {
        let hasEmptyRequired = currentValuesRef.current.filterDefinitionList.some((filterDef) => {
          if (filterDef.required) {
            let matchingItem = list.find((it) => it.key === filterDef.key);
            return matchingItem && matchingItem?.value == null;
          }
        });

        if (hasEmptyRequired) {
          console.error(
            "Some of the filters sent to the setFilterList function are required and have an invalid value or are missing altogether!",
            list,
          );
        } else {
          setStoredFilterList([...list]); // NOTE Copying as we're splicing the value later (as an optimization).
        }
      }
    },
    [setStoredFilterList],
  );

  let api = useMemo(
    () => ({
      filterDefinitionList,
      filterList,
      addFilter,
      removeFilter,
      clearFilterList,
      setFilterList,
    }),
    [addFilter, clearFilterList, filterDefinitionList, filterList, removeFilter, setFilterList],
  );
  return [filterList, api];
}

function applyLocalFilters(data, filterList, filterDefinitionList) {
  let filteredData = data;
  if (Array.isArray(data) && filterList?.length > 0) {
    let filterItems = filterList
      .map((it) => {
        let { filter } = filterDefinitionList.find((defIt) => defIt.key === it.key);
        return typeof filter === "function" ? { filter, value: it.value } : undefined;
      })
      .filter(Boolean);
    if (filterItems.length > 0) {
      filteredData = [];
      for (let item of data) {
        let matched = true;
        for (let { filter, value } of filterItems) {
          if (!filter(item, value)) {
            matched = false;
            break;
          }
        }
        if (matched) filteredData.push(item);
      }
      if (filteredData.length === data.length) filteredData = data;
    }
  }
  return filteredData;
}

export { useFilterList, applyLocalFilters };
