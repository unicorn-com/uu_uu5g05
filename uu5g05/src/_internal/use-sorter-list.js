import { useMemo, useCallback, useState } from "../hooks/react-hooks.js";
import Tools from "./tools.js";
import useValueChange from "./use-value-change.js";

const EMPTY_ARRAY = Object.freeze([]);

function normalizeSorterList(sorterDefinitionList, sorterList) {
  // normalize to { key, ascending } items and preserve only those that exist in sorterDefinitionList
  let normalizedSorterList = sorterList
    .map((item) => (item?.key != null ? { key: item.key, ascending: item.ascending ?? true } : undefined))
    .filter(Boolean);

  let validList = normalizedSorterList.filter((item) => {
    let definitionItem = sorterDefinitionList.find((it) => it.key === item.key);
    if (process.env.NODE_ENV === "development" && !definitionItem) {
      Tools.warning(
        `A sorter with the key "${item.key}" is active in DataControllerProvider but it is missing in the property sorterDefinitionList and therefore is ignored.`,
        { item },
      );
    }
    return !!definitionItem;
  });

  return validList.length === normalizedSorterList ? normalizedSorterList : validList;
}

function useSorterList(sorterDefinitionList, propsSorterList, onChange) {
  const controlled = propsSorterList && typeof onChange === "function";

  const [_sorterDefinitionList, setSorterDefinitionList] = useState([]);

  const groupedSorterDefinitionList = sorterDefinitionList.concat(_sorterDefinitionList);

  if (!propsSorterList) {
    propsSorterList = groupedSorterDefinitionList
      .filter((sorter) => typeof sorter?.initialAscending === "boolean")
      .map((sorter) => {
        let { initialAscending, key } = sorter;
        return { key, ascending: initialAscending };
      });
  }

  let [storedSorterList, setStoredSorterList] = useValueChange(
    propsSorterList,
    typeof onChange === "function"
      ? (newSorterList) => {
          onChange(normalizeSorterList(groupedSorterDefinitionList, newSorterList));
        }
      : undefined,
    controlled,
  );

  let sorterList = useMemo(
    () => (controlled ? storedSorterList : normalizeSorterList(groupedSorterDefinitionList, storedSorterList)),
    [controlled, groupedSorterDefinitionList, storedSorterList],
  );

  // if the computed sorterList differs from the stored one then there must
  // be some invalid values in stored list => we can safely splice it as it isn't anywhere on API
  // and next sorter operations (add/remove/...) will operate on smaller list thanks to that
  if (storedSorterList.length !== sorterList.length) {
    storedSorterList.splice(0, storedSorterList.length, ...sorterList);
  }

  const addSorter = _addToList(setStoredSorterList);
  const removeSorter = _removeFromList(setStoredSorterList);

  const clearSorterList = useCallback(() => {
    setStoredSorterList((curList) => {
      let newList = EMPTY_ARRAY;
      return newList.length === curList.length ? curList : newList;
    });
  }, [setStoredSorterList]);

  const setSorterList = useCallback(
    (list) => {
      if (Array.isArray(list)) setStoredSorterList([...list]); // NOTE Copying as we're splicing the value later (as an optimization).
    },
    [setStoredSorterList],
  );

  const addSorterDefinition = _addToList(setSorterDefinitionList);
  const removeSorterDefinition = _removeFromList(setSorterDefinitionList);

  let api = useMemo(
    () => ({
      sorterDefinitionList: groupedSorterDefinitionList,
      sorterList,
      addSorter,
      removeSorter,
      clearSorterList,
      setSorterList,
      addSorterDefinition,
      removeSorterDefinition,
    }),
    [
      addSorter,
      clearSorterList,
      removeSorter,
      setSorterList,
      groupedSorterDefinitionList,
      sorterList,
      addSorterDefinition,
      removeSorterDefinition,
    ],
  );
  return [sorterList, api];
}

function applyLocalSorters(data, sorterList, sorterDefinitionList) {
  let sortedResult = data;
  if (Array.isArray(data) && sorterList?.length > 0) {
    let sorterItems = sorterList
      .map((it) => {
        let { sort } = sorterDefinitionList.find((defIt) => defIt.key === it.key) || {};
        return typeof sort === "function" ? { sort, ascending: it.ascending } : undefined;
      })
      .filter(Boolean);
    if (sorterItems.length > 0) {
      sortedResult = sortedResult
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
          let comparisonResult = 0;
          for (let { ascending, sort } of sorterItems) {
            comparisonResult = sort(a.item, b.item);
            if (comparisonResult) return ascending ? comparisonResult : -comparisonResult;
          }
          let { ascending } = sorterItems[sorterItems.length - 1];
          return (ascending ? 1 : -1) * (a.index - b.index);
        })
        .map(({ item }) => item);
    }
  }
  return sortedResult;
}

function _addToList(setter) {
  return useCallback(
    (list) => {
      let addList = !Array.isArray(list) ? [list] : list;
      if (addList.length) {
        setter((curList) => {
          let newSorterList = curList;
          for (let newSorter of addList) {
            let currentSorters = newSorterList;
            let isSorterChanged = currentSorters.some((curSorter) => curSorter.key === newSorter.key);

            if (isSorterChanged) {
              // active sorter was changed
              newSorterList = currentSorters.map((curSorter) =>
                curSorter.key === newSorter.key ? newSorter : curSorter,
              );
            } else {
              // new sorter was added
              newSorterList = currentSorters.concat([newSorter]);
            }
          }

          return newSorterList;
        });
      }
    },
    [setter],
  );
}

function _removeFromList(setter) {
  return useCallback(
    (list) => {
      let removeList = !Array.isArray(list) ? [list] : list;
      if (removeList.length) {
        let isInRemoveList = (key) => removeList.some((removeItem) => removeItem === key);
        setter((curList) => {
          let newList = curList.filter((it) => it && !isInRemoveList(it.key));
          return newList.length === curList.length ? curList : newList;
        });
      }
    },
    [setter],
  );
}

export { useSorterList, applyLocalSorters };
