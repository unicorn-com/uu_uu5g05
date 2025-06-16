//@@viewOn:imports
import { Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
//@@viewOff:imports

const ITEM_DEFAULT_COLOR_SCHEME = "building";
const ITEM_DEFAULT_SIGNIFICANCE = "common";

// TODO gds does not specify this and it is impossible to achieve these (or similar) values with relative height
const TAG_SPACE = {
  xxs: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "a"]),
  xs: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"]),
  s: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"]),
  m: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"]),
  l: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "c"]),
  xl: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "c"]),
};
const TAG_SIZE_CFG = {
  xs: ["xsmall", "minor", "l"],
  s: ["small", "basic", "xxs"],
  m: ["medium", "basic", "xs"],
  l: ["large", "basic", "s"],
  xl: ["large", "basic", "m"],
};
const TAG_HEIGHT = "1.3em";

const MAX_ITEMS_COUNT = 7;
const ITEM_LIST_HEIGHTS = {
  singleItem: 36,
  gap: 2,
  padding: 8,
};

function getItemChildren({ children, value }) {
  if (!children) {
    if (typeof value === "boolean") value = value + "";
    if (typeof value === "object") value = JSON.stringify(value);
  } else if (children && typeof children === "object" && !Utils.Element.isValid(children)) {
    children = Utils.Lsi.getMessage(children);
  }
  return children || value;
}

function replaceItemProps(item) {
  return {
    ...item,
    children: getItemChildren(item),
    colorScheme: undefined,
    iconRight: typeof item.iconRight === "boolean" ? undefined : item.iconRight,
  };
}

function getItemText({ text, children, value }) {
  let itemText = text;

  if (!itemText) itemText = typeof children === "string" ? children : value;
  if (typeof itemText === "object" && !Utils.Element.isValid(itemText)) itemText = Utils.Language.getItem(itemText);
  if (typeof itemText !== "string") itemText = undefined;

  return itemText;
}

function normalizeString(string) {
  return string ? Utils.String.stripAccents(string.toLowerCase()) : string;
}

function removeItem(onChange, value) {
  return (e) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(new Utils.Event({ value: value.filter((valueItem) => valueItem.value !== e.data.value) }, e));
  };
}

function filterOutDisabledItems(itemList) {
  return itemList.filter((item) => !item.disabled);
}

function removeDuplicates(array = [], uniqueKey = "value") {
  const storage = {};

  return array.reduce((result, current) => {
    const identifier = current[uniqueKey];

    if (!storage[identifier]) {
      storage[identifier] = true;
      result.push(current);
    }

    return result;
  }, []);
}

// for non-insertable select only
function splitMismatchedValues(value, itemList, multiple) {
  // remove mismatched items from `value` list (those that are not present in itemList)
  let valueList = multiple ? (Array.isArray(value) ? value : value != null ? [value] : []) : [value];
  let allowedItemListValueSet = new Set(itemList.filter((it) => it && !it.disabled).map((it) => it.value));
  let allowedList = [];
  let disallowedList = [];
  for (value of valueList) {
    (allowedItemListValueSet.has(value) ? allowedList : disallowedList).push(value);
  }
  return {
    value: multiple ? (allowedList.length > 0 ? allowedList : undefined) : allowedList[0],
    allowedList,
    disallowedList,
  };
}

// Get value (for onChange) so that the items of the value equal the items from props value/itemList.
// This prevent additional keys to sneak into the value item objects (like key focused)
function getOutputValue(newValue, value = [], itemList = []) {
  if (!newValue || newValue.length === 0) return undefined;
  value = value && !Array.isArray(value) ? [value] : value || [];
  return filterOutDisabledItems(newValue).map((newValueItem) => {
    return (
      itemList.find((item) => item.value === newValueItem.value) ??
      value.find((v) => newValueItem.value === (typeof v === "object" ? v.value : v)) ?? { value: newValueItem.value }
    );
  });
}

function getMap(array, key = "value") {
  return array.reduce((map, item) => {
    map.set(item[key], item);
    return map;
  }, new Map());
}

function sortByArray(inputArr, sortArr, key = "value") {
  // Create a mapping of objects in the sort array for efficient lookup
  const sortMap = new Map();
  sortArr.forEach((item, index) => {
    sortMap.set(item[key], index);
  });

  // Duplicate original array to prevent mutation
  const dupArray = [...inputArr];

  // Sort the input array based on the order in the sort array
  dupArray.sort((a, b) => {
    const indexA = sortMap.get(a[key]);
    const indexB = sortMap.get(b[key]);

    if (indexA === undefined && indexB === undefined) return 0; // Preserve original order if keys not found in sort array
    if (indexA === undefined) return 1; // Move unmatched key to the end
    if (indexB === undefined) return -1; // Move unmatched key to the end

    return indexA - indexB; // Compare indices for sorting
  });

  return dupArray;
}

function duplicateSelectedNestItems(itemList, value) {
  const dupItemList = [...itemList];

  const itemListMap = itemList.reduce((map, item) => {
    map.set(item.value, item);
    return map;
  }, new Map());

  const dupSelectedItemsMap = new Map();

  value.forEach((val) => {
    const item = itemListMap.get(val.value);
    if (!item) return;
    if (!item.parent?.value) return;
    if (item.root) return;
    if (dupSelectedItemsMap.has(val.value)) return;

    dupSelectedItemsMap.set(val.value, { ...val, parent: item.parent });
  });

  for (let dupSelectedItem of dupSelectedItemsMap.values()) {
    dupItemList.push({ ...dupSelectedItem, root: true });
  }

  return dupItemList;
}

function getMenuItem(item, value, getOnItemSelect, ref, colorScheme) {
  const {
    disabled,
    value: itemValue,
    colorScheme: itemColorScheme = ITEM_DEFAULT_COLOR_SCHEME,
    significance = ITEM_DEFAULT_SIGNIFICANCE,
    size,
    elementRef,
    onMouseDown,
    originalChildren,
    heading,
    ...otherItemProps
  } = item;
  const isSelected = value.some((selectedItem) => selectedItem.value === itemValue);
  return {
    ...otherItemProps,
    elementRef: Utils.Component.combineRefs(ref, elementRef),
    onClick: !heading ? getOnItemSelect(item) : undefined,
    colorScheme: isSelected ? colorScheme : itemColorScheme,
    significance: isSelected ? "distinct" : significance,
    role: "option",
    elementAttrs:
      disabled || heading
        ? undefined
        : {
            "aria-selected": !!isSelected,
            onMouseDown: (e) => {
              if (typeof onMouseDown === "function") onMouseDown(new Utils.Event({ value: item }, e));
            },
          },
    disabled,
    heading,
    selected: isSelected,
  };
}

function valueWithSameCategory(parentSet, valueParent) {
  if (parentSet.has(valueParent.value)) return true;
  if (valueParent.parent) return valueWithSameCategory(parentSet, valueParent.parent);
}

function getOnMenuItemSelect(item, value, multiple, callback) {
  return (event) => {
    let eventData;
    let currentValue = value || [];

    let lastNonMultipleParent;
    // prepare parent key array and get last parent which is not multiple (multiple === false)
    function fillParentArray(parent, parentArray) {
      parentArray.push(parent.value);
      if (parent.multiple === false) lastNonMultipleParent = parent.value;
      if (parent.parent) fillParentArray(parent.parent, parentArray, lastNonMultipleParent);
    }

    // multi-level
    if (item.parent && multiple) {
      const parentArray = [];
      fillParentArray(item.parent, parentArray);
      const itemParentSet = new Set();

      if (lastNonMultipleParent) {
        // filter out last parent which has multiple=false
        for (let parentItem of parentArray) {
          itemParentSet.add(parentItem);
          if (parentItem === lastNonMultipleParent) break;
        }
      }

      // check if there is already value under same category (same as single level)
      if (currentValue.some((v) => v.value === item.value)) {
        eventData = { value: currentValue.filter((v) => v.value !== item.value) };
      } else {
        // filter values which have same parent with multiple=false (everything from itemParentSet)
        const values = currentValue.filter((v) => (v.parent ? !valueWithSameCategory(itemParentSet, v.parent) : true));
        eventData = { value: [...values, item] };
      }
    } else {
      // non multi-level values
      if (currentValue.some((v) => v.value === item.value)) {
        if (multiple) eventData = { value: currentValue.filter((v) => v.value !== item.value) };
        else eventData = { value: currentValue };
      } else if (multiple) {
        eventData = { value: [...currentValue, item] };
      } else {
        eventData = { value: [item] };
      }
    }

    if (typeof callback === "function") callback(new Utils.Event(eventData, event));
  };
}

function countHeight(itemsLength) {
  const maxItemsCount = itemsLength > MAX_ITEMS_COUNT ? MAX_ITEMS_COUNT : itemsLength;
  return (
    maxItemsCount * ITEM_LIST_HEIGHTS.singleItem +
    (maxItemsCount - 1) * ITEM_LIST_HEIGHTS.gap +
    2 * ITEM_LIST_HEIGHTS.padding
  );
}

function checkValuesAndCallOnChange(value, itemList, onChange) {
  const valArr = value && !Array.isArray(value) ? [value] : value || [];
  if (valArr.length) {
    const itemListMap = getMap(itemList);
    const eventValue = valArr.filter((val) => itemListMap.has(val));
    if (!Utils.Object.deepEqual(valArr, eventValue)) {
      onChange(new Utils.Event({ value: eventValue }));
    }
  }
}

function checkInsertedItemCandidate(itemList, value, searchValue) {
  function getItemValue(value) {
    let itemText = value;
    if (typeof itemText === "object" && !Utils.Element.isValid(itemText)) itemText = Utils.Language.getItem(itemText);
    if (typeof itemText !== "string") itemText = undefined;

    return itemText;
  }

  if (!searchValue) return;

  // Check if search value doesn't match any of the existing items in the mergedList (items with temp items).
  // Check actual string (children or value) with not normalized searchValue.
  const isInItemList = !!itemList?.some((item) => {
    let itemChildren = getItemValue(item.children);
    let itemValue = getItemValue(item.value);

    return (itemChildren && itemChildren === searchValue) || (itemValue && itemValue === searchValue);
  });
  // Check if search value doesn't match any of the items in value.
  // Check actual string (not normalized) because, for example, if item "created" exists,
  // we want to allow inserting "Created" item.
  const isInValue = !!value?.some((item) => item.value === searchValue);

  return !isInItemList && !isInValue;
}

export {
  ITEM_DEFAULT_COLOR_SCHEME,
  ITEM_DEFAULT_SIGNIFICANCE,
  TAG_SPACE,
  TAG_SIZE_CFG,
  TAG_HEIGHT,
  getItemChildren,
  getItemText,
  normalizeString,
  removeItem,
  getOutputValue,
  filterOutDisabledItems,
  removeDuplicates,
  getMap,
  sortByArray,
  duplicateSelectedNestItems,
  getMenuItem,
  getOnMenuItemSelect,
  countHeight,
  checkValuesAndCallOnChange,
  splitMismatchedValues,
  replaceItemProps,
  checkInsertedItemCandidate,
};
