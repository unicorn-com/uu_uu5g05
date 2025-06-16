import { useState, useMemo, useCallback } from "../hooks/react-hooks.js";
import { constructItemKey } from "./list-helpers.js";
import useMemoObject from "../hooks/use-memo-object.js";
import UtilsObject from "../utils/object.js";

const EMPTY_ARRAY = Object.freeze([]);

// Finds item with key "key" in data and displayedData, stops when it's found. Remembers already processed items in a searchContext map(s)
// in case that the function gets called again for another key (so that it can continue from not-yet-processed items).
function findItemInData(key, data, displayedData, getItemKey, searchContext) {
  searchContext.allItemMap ??= {};
  searchContext.displayedItemMap ??= {};
  const { allItemMap, displayedItemMap } = searchContext;
  let dataInfo;
  let displayedDataInfo;
  if (Array.isArray(data)) {
    if (!(key in allItemMap)) {
      searchContext.dataInfoNextStart ??= 0;
      for (let i = searchContext.dataInfoNextStart; i < data.length; i++) {
        let item = data[i];
        let itemKey = getItemKey(item);
        if (itemKey != null) allItemMap[itemKey] = { index: i, key: itemKey, item };
        if (itemKey === key) {
          searchContext.dataInfoNextStart = i + 1;
          break;
        }
      }
      searchContext.dataInfoNextStart ||= data.length;
    }
    dataInfo = allItemMap[key];
  }
  if (Array.isArray(displayedData)) {
    if (!(key in displayedItemMap)) {
      searchContext.displayedDataInfoNextStart ??= 0;
      for (let i = searchContext.displayedDataInfoNextStart; i < displayedData.length; i++) {
        let item = displayedData[i];
        let itemKey = getItemKey(item);
        if (itemKey != null) displayedItemMap[itemKey] = { index: i, key: itemKey, item };
        if (itemKey === key) {
          searchContext.displayedDataInfoNextStart = i + 1;
          break;
        }
      }
      searchContext.displayedDataInfoNextStart ||= displayedData.length;
    }
    displayedDataInfo = displayedItemMap[key];
  }
  return { dataInfo, displayedDataInfo };
}

export function useSelectionSupport(
  data,
  displayedData,
  itemIdentifier,
  selectable = false,
  initialIsDisplayedSelected = false,
  initialSelectedData = EMPTY_ARRAY,
) {
  let itemKey = useMemo(() => constructItemKey(itemIdentifier), [itemIdentifier]);
  let [isDisplayedSelected, setIsDisplayedSelected] = useState(initialIsDisplayedSelected);

  let [storedSelectedData, setStoredSelectedData] = useState(initialSelectedData);
  if (storedSelectedData?.length > 0) {
    if (!selectable || selectable === "none") {
      setStoredSelectedData(EMPTY_ARRAY);
      setIsDisplayedSelected(false);
    } else if (selectable === "single" && storedSelectedData.length > 1) {
      setStoredSelectedData([storedSelectedData[storedSelectedData.length - 1]]);
    }
  }

  // normalize "storedSelectedData" and propagate item changes from "data" to items in "selectedData"
  // (including item order)
  let { selectedData, selectedDataKeys } = useMemo(() => {
    let selectedItemsZip = [];
    let selectedSet = new Set();
    let result = [];
    if (storedSelectedData.length > 0) {
      let searchContext = {};
      for (let i = 0; i < storedSelectedData.length; i++) {
        let item = storedSelectedData[i];
        let key = itemKey(item);
        if (key == null || selectedSet.has(key)) continue;
        selectedSet.add(key);
        let { dataInfo, displayedDataInfo } = findItemInData(key, data, displayedData, itemKey, searchContext);
        if (dataInfo) item = dataInfo.item; // use item from "data" if available (to have up-to-date data item)
        selectedItemsZip.push({ index: i, key, item, dataIndex: displayedDataInfo?.index });
      }

      // order selected items so that:
      // 1. relative order of items that are currently present in "displayedData" remains like it is in "displayedData"
      // 2. items not in "displayedData" remain on their current positions
      // e.g. selection has 5 items: [b,Z,a,X,Y] => [b,X,a,Y,Z]   (a,b are not in "displayedData"; X,Y,Z are in "displayedData" ordered as X <= Y <= Z)
      selectedItemsZip.sort((a, b) => {
        let result = a.dataIndex != null && b.dataIndex != null ? a.dataIndex - b.dataIndex : 0;
        return result || a.index - b.index;
      });

      for (let { item } of selectedItemsZip) result.push(item);

      // optimize next render - mutate "storedSelectedData" with normalized result
      // (we can do that as it is internal field not present on API)
      storedSelectedData.splice(0, storedSelectedData.length, ...result);
    }

    return { selectedData: result, selectedDataKeys: [...selectedSet] };
  }, [data, displayedData, itemKey, storedSelectedData]);
  selectedData = useMemoObject(selectedData, UtilsObject.shallowEqual);
  selectedDataKeys = useMemoObject(selectedDataKeys, UtilsObject.shallowEqual);

  const addSelected = useCallback(
    (list) => {
      let addList = !Array.isArray(list) ? [list] : list;
      if (addList.length) {
        let isInAddList = (key) => addList.some((addItem) => addItem && itemKey(addItem) === key);
        setStoredSelectedData((curList) => curList.filter((it) => it && !isInAddList(itemKey(it))).concat(addList));
      }
    },
    [itemKey],
  );

  const removeSelected = useCallback(
    (list) => {
      let removeList = !Array.isArray(list) ? [list] : list;
      if (removeList.length) {
        let isInRemoveList = (key) => removeList.some((removeItem) => removeItem && itemKey(removeItem) === key);
        setStoredSelectedData((curList) => curList.filter((it) => it && !isInRemoveList(itemKey(it))));
      }
    },
    [itemKey],
  );

  const clearSelected = useCallback(() => {
    setStoredSelectedData(EMPTY_ARRAY);
  }, []);

  const setSelected = useCallback((list) => {
    if (Array.isArray(list)) setStoredSelectedData([...list]); // NOTE Copying as we're splicing the value later (as an optimization).
  }, []);

  const isSelected = useCallback(
    (item) => {
      let key = itemKey(item);
      return key != null && selectedDataKeys.includes(key);
    },
    [itemKey, selectedDataKeys],
  );

  const toggleIsDisplayedSelected = useCallback((selected = null) => {
    setIsDisplayedSelected((curValue) => (typeof selected === "boolean" ? selected : !curValue));
  }, []);

  let usedDisplayedData = isDisplayedSelected ? selectedData : displayedData;
  let selectionApi = useMemo(() => {
    return {
      selectable,
      selectedData,
      isSelected,
      addSelected,
      removeSelected,
      setSelected,
      clearSelected,
      isDisplayedSelected,
      toggleIsDisplayedSelected,
    };
  }, [
    selectable,
    selectedData,
    isSelected,
    addSelected,
    removeSelected,
    setSelected,
    clearSelected,
    isDisplayedSelected,
    toggleIsDisplayedSelected,
  ]);

  return [usedDisplayedData, selectionApi];
}
export default useSelectionSupport;
