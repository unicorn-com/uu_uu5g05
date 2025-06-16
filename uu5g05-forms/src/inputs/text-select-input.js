//@@viewOn:imports
import { createVisualComponent, Utils, useState, PropTypes, Lsi, useMemo, useUpdateEffect } from "uu5g05";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import withFlattenedList from "../_internal/select/with-flattened-list.js";
import withValidationMap from "../with-validation-map.js";
import withValidationInput, { isValidValueDefault as isValidValue } from "../with-validation-input.js";
import withItemListValidation from "../_internal/select/with-item-list-validation.js";
import withInsertable from "../_internal/select/with-insertable.js";
import useOpenPicker from "../_internal/use-open-picker.js";
import TextSelectInputView from "../_internal/select/text-select-input-view.js";
import {
  ITEM_DEFAULT_COLOR_SCHEME,
  ITEM_DEFAULT_SIGNIFICANCE,
  getItemText,
  normalizeString,
  getOutputValue,
  removeDuplicates,
  checkValuesAndCallOnChange,
  replaceItemProps,
} from "../_internal/select/tools.js";
import useValidatorMap from "../use-validator-map.js";
import useBottomSheet from "../_internal/select/use-bottom-sheet.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const INPUT_WIDTH_MAP = {
  xxs: 180,
  xs: 200,
  s: 220,
  m: 240,
  l: 260,
  xl: 280,
};

const { onSearch, open, onOpen, isBottomSheet, ...textSelectFieldViewPropTypes } = TextSelectInputView.propTypes;
const {
  onSearch: _onSearch,
  open: _open,
  onOpen: _onOpen,
  isBottomSheet: _isBottomSheet,
  ...textSelectFieldViewDefaultProps
} = TextSelectInputView.defaultProps;

const DEFAULT_LSI = {
  noMatch: { import: importLsi, path: ["TextSelect", "noMatch"] },
  noItems: { import: importLsi, path: ["TextSelect", "noItems"] },
};
//@@viewOff:constants

//@@viewOn:helpers
const TextSelectInputViewInsertable = withInsertable(TextSelectInputView);

const _TextSelectInputValidationInput = withValidationInput((props) => {
  const { originalItemList: itemList, onChange, ...propsToPass } = props;
  const { insertable, multiple, value } = propsToPass;

  function handleChange(event) {
    let eventData;
    let eventValue = getOutputValue(event.data.value, value, itemList);

    if (multiple) {
      eventValue = removeDuplicates(eventValue);
      eventData = {
        value: eventValue?.map((item) => item.value),
        data: eventValue || [],
      };
    } else {
      eventData = {
        value: eventValue ? eventValue[0].value : eventValue,
        data: eventValue ? eventValue[0] : eventValue,
      };
    }

    if (typeof onChange === "function") onChange(new Utils.Event(eventData, event));
  }

  const Component = !insertable ? TextSelectInputView : TextSelectInputViewInsertable;
  return <Component {...propsToPass} onChange={handleChange} />;
});

function getItemListMap(itemList) {
  return itemList.reduce((map, item) => map.set(item.value, item), new Map());
}

function findParent(categoryMap, parent = {}) {
  if (categoryMap.has(parent.value)) return true;
  if (parent.parent) return findParent(categoryMap, parent.parent);
  return false;
}

function getMultilevelSearchList(searchList, itemList) {
  const categoryMap = new Map();

  const multilevelSearchList = [];
  searchList.forEach((item) => {
    if (item.category) categoryMap.set(item.category, true);
    multilevelSearchList.push({ ...item, root: true });
  });

  if (categoryMap.size) {
    itemList.forEach((item) => {
      if (item.value === undefined && item.children === undefined) return;
      const newItem = replaceItemProps(item);
      const text = getItemText(newItem);
      const usedItem = { ...newItem, text };

      const hasParent = findParent(categoryMap, newItem.parent);

      if (categoryMap.has(newItem.category) || hasParent) {
        if (!hasParent) usedItem.root = true;
        multilevelSearchList.push(usedItem);
      }
    });
  }

  return multilevelSearchList;
}

function getItemList({ itemList: itemListProp, insertable, onFilter, lsi }, searchValue) {
  const itemList = [];

  itemListProp.forEach((item) => {
    if (item.value === undefined && item.children === undefined) return;
    const newItem = replaceItemProps(item);
    const text = getItemText(newItem);
    const usedItem = { ...newItem, text };

    let showInPicker = true;
    if (searchValue) {
      if (typeof onFilter === "function") {
        showInPicker = !!onFilter(new Utils.Event({ item: newItem, value: searchValue }));
      } else {
        showInPicker = text ? normalizeString(text).indexOf(searchValue) > -1 : false;
      }
    }

    if (showInPicker) itemList.push(usedItem);
  });

  if (!insertable) {
    // if there is not corresponding item return new itemList with placeholder
    const fullLsi = { ...DEFAULT_LSI, ...lsi };
    if (searchValue && itemListProp.length && !itemList.length) return getItemListWithPlaceholder(fullLsi.noMatch);
    if (!itemList.length) return getItemListWithPlaceholder(fullLsi.noItems);
  }

  return itemList;
}

function getSelectedItemList(itemListMap, valueParam, insertable) {
  const value = !Array.isArray(valueParam) ? [valueParam] : valueParam || [];
  const selectedItemList = [];

  value.forEach((v) => {
    const matchingItem = itemListMap.get(v);
    if (
      (matchingItem === undefined && !insertable) ||
      (matchingItem && matchingItem.value === undefined && matchingItem.children === undefined)
    ) {
      return;
    }
    if (matchingItem && !matchingItem.divider && !matchingItem.category) {
      selectedItemList.push({ ...matchingItem, children: matchingItem.selectedChildren ?? matchingItem.children });
      return;
    }
    if ((insertable || insertable === "add") && isValidValue(v)) {
      selectedItemList.push({ value: v, children: v, text: v });
    }
  });

  return selectedItemList;
}

function getItemListWithPlaceholder(lsi) {
  return [
    {
      children: <Lsi lsi={lsi} />,
      disabled: true,
      colorScheme: ITEM_DEFAULT_COLOR_SCHEME,
      significance: ITEM_DEFAULT_SIGNIFICANCE,
    },
  ];
}
//@@viewOff:helpers

const _TextSelectInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TextSelect.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...textSelectFieldViewPropTypes,
    value: PropTypes.any,
    onFilter: PropTypes.func,
    insertable: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(["add"])]),
    lsi: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...textSelectFieldViewDefaultProps,
    itemList: [],
    value: undefined,
    onFilter: undefined,
    insertable: false,
    lsi: DEFAULT_LSI,
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onChange, itemList, lsi, width, ...otherProps } = props;
    const { multiple, insertable, multilevel, displayOptions, size } = otherProps;

    const [searchValue, setSearchValue] = useState();

    const [open, setOpen] = useOpenPicker();

    // Check if bottomSheet is active
    const { isBottomSheet } = useBottomSheet();

    // Create and memorize hashMap from itemList for better manipulation
    const itemListMap = useMemo(() => getItemListMap(itemList), [itemList]);

    const normalizeSearchValue = searchValue ? normalizeString(searchValue) : searchValue;
    const selectedItemListValue = getSelectedItemList(itemListMap, value, insertable);

    // Normalize list (filter value by searchValue)
    let normalizeItemList = getItemList(props, normalizeSearchValue);
    // Normalize list again for multilevel
    if (multilevel && normalizeSearchValue) {
      normalizeItemList = getMultilevelSearchList(normalizeItemList, itemList);
    }

    useUpdateEffect(() => {
      if (multiple && !insertable) checkValuesAndCallOnChange(value, itemList, onChange);
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [itemList]);

    function handleSearch(event) {
      // If bottomSheet is open, final value should not be change by changing searchValue
      if (!isBottomSheet && value && !multiple && event.data.value !== searchValue) {
        if (typeof onChange === "function") onChange(new Utils.Event({ value: undefined }));
      }
      setSearchValue(event.data.value);
    }

    const onValidate = useValidatorMap(props, {
      valueNotCommitted: () => {
        if (isBottomSheet) return true; // skip validation if bottomSheet is active
        return insertable === true && !multiple ? searchValue : !searchValue;
      },
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const textSelectProps = {
      ...otherProps,
      open,
      value: selectedItemListValue,
      itemList: normalizeItemList,
      originalItemList: itemList,
      onChange,
      searchValue,
      onSearch: handleSearch,
      onOpen: (e) => setOpen(e.data.value),
      onValidate,
      isBottomSheet: displayOptions && isBottomSheet,
      width: width ?? INPUT_WIDTH_MAP[size],
    };

    return <_TextSelectInputValidationInput {...textSelectProps} />;
    //@@viewOff:render
  },
});

const TextSelectInput = withFlattenedList(
  withValidationMap(withItemListValidation(_TextSelectInput), {
    required: required(),
    mismatch: {
      message: { import: importLsi, path: ["Validation", "mismatchSelect"] },
      feedback: "error",
    },
    valueNotCommitted: {
      message: { import: importLsi, path: ["Validation", "valueNotCommitted"] },
      feedback: "warning",
    },
  }),
);

// delete props which are not on API
["_formattedValue"].forEach((prop) => {
  delete TextSelectInput.propTypes[prop];
  delete TextSelectInput.defaultProps[prop];
});

export { TextSelectInput };
export default TextSelectInput;
