//@@viewOn:imports
import { createVisualComponent, Utils, useState, PropTypes, Lsi, useUnmountedRef, useRef } from "uu5g05";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import withValidationMap from "../with-validation-map.js";
import withValidationInput from "../with-validation-input.js";
import withInsertable from "../_internal/select/with-insertable.js";
import useOpenPicker from "../_internal/use-open-picker.js";
import TextSelectAsyncInputView from "../_internal/select/text-select-async-input-view.js";
import {
  getItemChildren,
  getItemText,
  normalizeString,
  getOutputValue,
  getMap,
  replaceItemProps,
} from "../_internal/select/tools.js";
import useValidatorMap from "../use-validator-map.js";
import useBottomSheet from "../_internal/select/use-bottom-sheet.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const DEFAULT_LSI = {
  loading: { import: importLsi, path: ["loading"] },
  loadingError: { import: importLsi, path: ["TextSelect", "loadingError"] },
};
const DEBOUNCE_INTERVAL = 1000;
const STATES = {
  loading: "loading",
  error: "error",
};

const INPUT_WIDTH_MAP = {
  xxs: 180,
  xs: 200,
  s: 220,
  m: 240,
  l: 260,
  xl: 280,
};

const { open, onOpen, itemList, internalPending, isBottomSheet, ...textSelectFieldViewPropTypes } =
  TextSelectAsyncInputView.propTypes;
const {
  open: _open,
  onOpen: _onOpen,
  itemList: _itemList,
  internalPending: _internalPending,
  isBottomSheet: _isBottomSheet,
  ...textSelectFieldViewDefaultProps
} = TextSelectAsyncInputView.defaultProps;
//@@viewOff:constants

//@@viewOn:helpers
const TextSelectAsyncInputViewInsertable = withInsertable(TextSelectAsyncInputView);

const _TextSelectAsyncInputValidationInput = withValidationInput((props) => {
  const { onChange, originalItemList, ...propsToPass } = props;
  const { value, insertable, multiple } = propsToPass;

  function handleChange(event) {
    let eventValue = getOutputValue(event.data.value, value, originalItemList);

    let eventData;
    if (multiple) {
      eventData = { value: eventValue, viewValue: event.data.value };
    } else {
      eventData = { value: eventValue ? eventValue[0] : eventValue, viewValue: event.data.value };
    }

    onChange(new Utils.Event(eventData, event));
  }

  let Component;
  if (!insertable) {
    Component = TextSelectAsyncInputView;
  } else {
    Component = TextSelectAsyncInputViewInsertable;
    propsToPass.originalItemList = originalItemList;
  }

  return <Component {...propsToPass} onChange={typeof onChange === "function" ? handleChange : undefined} />;
}, isValidValue);

function getErrorItem(lsi) {
  const fullLsi = { ...DEFAULT_LSI, ...lsi };
  return [
    {
      disabled: true,
      colorScheme: "problem",
      significance: "highlighted",
      children: <Lsi lsi={fullLsi.loadingError} />,
    },
  ];
}

function getFilteredItemList(itemList, tempList, searchValue) {
  let filteredItemList = itemList.map((item) => replaceItemProps(item));

  if (!filteredItemList.length) {
    filteredItemList = searchValue ? filterItemListLocally(tempList, searchValue) : tempList;
  }

  return filteredItemList;
}

function getFilteredInitialItemList(initialItemList, searchValue, tempSearchValue, isInitialState) {
  if (isInitialState) {
    return searchValue ? filterItemListLocally(initialItemList, searchValue) : initialItemList;
  }

  return filterItemListLocally(initialItemList, tempSearchValue);
}

function getValueList(value) {
  return value && !Array.isArray(value) ? [value] : value || [];
}

function getSelectedItemList(itemList = [], value = []) {
  const itemListMap = getMap(itemList);
  const selectedItemList = [];

  value.forEach((val) => {
    const item = itemListMap.get(val.value);
    if (item) {
      selectedItemList.push(item);
      return;
    }
    selectedItemList.push(val);
  });

  return selectedItemList;
}

function filterItemListLocally(itemList = [], searchValue) {
  return itemList.filter((item) => {
    const children = getItemChildren(item);
    let text = getItemText({ ...item, children });
    return text ? normalizeString(text).indexOf(searchValue) > -1 : false;
  });
}

function isValidValue(value) {
  return value
    ? Array.isArray(value)
      ? value.length > 0
      : value.value != null && value.value !== "" && Object.keys(value).length !== 0
    : !!value;
}
//@@viewOff:helpers

const _TextSelectAsyncInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TextSelectAsync.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...textSelectFieldViewPropTypes,
    initialItemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        icon: PropTypes.icon,
        iconRight: PropTypes.icon,
        text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
      }),
    ),
    onSearch: PropTypes.func.isRequired,
    value: PropTypes.any,
    lsi: PropTypes.object,
    debounceInterval: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...textSelectFieldViewDefaultProps,
    initialItemList: [],
    onSearch: undefined,
    value: undefined,
    lsi: DEFAULT_LSI,
    debounceInterval: DEBOUNCE_INTERVAL,
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, initialItemList, onChange, onBlur, onSearch, lsi, debounceInterval, width, ...otherProps } = props;
    const { multiple, displayOptions, size } = otherProps;

    // Check if bottomSheet is active
    const { isBottomSheet: _isBottomSheet } = useBottomSheet();
    const isBottomSheet = displayOptions && _isBottomSheet;

    const [searchState, setSearchState] = useState();
    const [searchDebouncing, setSearchDebouncing] = useState();
    const [searchValue, setSearchValue] = useState();
    const [itemList, setItemList] = useState([]);
    const [tempList, setTempList] = useState([]);
    const [tempSearchValue, setTempSearchValue] = useState();

    const [open, setOpen] = useOpenPicker();

    const memorizedValue = getValueList(value);
    const initialItemListMap = getMap(initialItemList);
    const isInitialState = open && !itemList.length;

    const unmountedRef = useUnmountedRef();
    const lastSearchIdRef = useRef();

    const debouncedSearchRef = useRef();
    const asyncHandleSearchRef = useRef();
    asyncHandleSearchRef.current = asyncHandleSearch;
    // Make sure that debounce function is created only once
    if (debouncedSearchRef.current === undefined) {
      debouncedSearchRef.current = Utils.Function.debounce(
        (event) => asyncHandleSearchRef.current(event),
        debounceInterval,
      );
    }

    const filteredItemList =
      searchState === STATES.error ? getErrorItem(lsi) : getFilteredItemList(itemList, tempList, searchValue);

    const filteredInitialItemList = getFilteredInitialItemList(
      initialItemList,
      searchValue,
      tempSearchValue,
      isInitialState,
    );

    const finalItemList = [...filteredItemList, ...filteredInitialItemList];

    const selectedItemList = getSelectedItemList([...tempList, ...initialItemList], memorizedValue);

    async function asyncHandleSearch(event) {
      if (unmountedRef.current) return;

      setSearchDebouncing(false);
      let onSearchResult = onSearch(event);

      if (typeof onSearchResult?.then !== "function") {
        setSearchState(undefined);
        setItemList(onSearchResult || []);
        return;
      }

      setSearchState(STATES.loading);

      const searchId = Utils.String.generateId();
      lastSearchIdRef.current = searchId;

      try {
        const asyncItemList = await onSearchResult;
        if (unmountedRef.current) return;
        if (searchId === lastSearchIdRef.current) {
          setSearchState(undefined);
          setItemList(asyncItemList || []);
        }
      } catch (e) {
        _TextSelectAsyncInput.logger.error(
          `\x1b[31mLoading item list has failed.\x1b[0m`,
          e.dtoOut && e.dtoOut.uuAppErrorMap ? JSON.stringify(e.dtoOut, null, 2) : e,
        );
        if (searchId === lastSearchIdRef.current) {
          setSearchState(STATES.error);
          setItemList([]);
        }
      }
    }

    function handleSearch(event) {
      // If bottomSheet is open, final value should not be change by changing searchValue
      if (!isBottomSheet && value && !multiple && event.data.value !== searchValue) {
        handleChange(new Utils.Event({ value: undefined }));
      }
      setSearchValue(event.data.value);

      if (event.data.value) {
        setSearchDebouncing(true);
        debouncedSearchRef.current(event);
        setTempSearchValue(event.data.value);
        return;
      }

      setSearchDebouncing(false);
      setSearchState(undefined);
      debouncedSearchRef.current.cancel();
      lastSearchIdRef.current = undefined;
      setItemList([]);
    }

    function handleChange(event) {
      const { viewValue, ...data } = event.data;

      setTempList((prevState) => {
        const tempListMap = getMap(prevState);
        const newTempList = [];

        viewValue?.forEach(({ focused, ...item }) => {
          if (!tempListMap.has(item.value) && !initialItemListMap.has(item.value)) newTempList.push(item);
        });

        return [...prevState, ...newTempList];
      });

      setItemList(itemList);
      if (typeof onChange === "function") onChange(new Utils.Event(data, event));
    }

    function handleBlur(event) {
      if (typeof onBlur === "function") onBlur(event);
    }

    function handleOpen(e) {
      setOpen((prevOpen) => {
        if (prevOpen === e.data.value) return prevOpen;

        setTempList((prevList) => {
          const prevListMap = getMap(prevList);

          if (!prevOpen && e.data.value) {
            const newTempList = [];

            if (!memorizedValue.length) {
              return [];
            }

            memorizedValue.forEach(({ focused, ...item }) => {
              const tempItem = prevListMap.get(item.value) || item;
              if (!initialItemListMap.has(tempItem.value)) newTempList.push(tempItem);
            });

            return newTempList;
          }

          return prevList;
        });

        return e.data.value;
      });
      if (!searchValue) setItemList([]);
    }

    let placeholderResult = isInitialState ? { import: importLsi, path: ["TextSelect", "searchAndSelect"] } : undefined;
    let bottomSheetPlaceholder;
    if (searchValue && finalItemList.length < 1 && searchState !== STATES.loading && !searchDebouncing) {
      placeholderResult = { import: importLsi, path: ["TextSelect", "noResults"] };
      bottomSheetPlaceholder = placeholderResult;
    }

    const onValidate = useValidatorMap(props, {
      valueNotCommitted: () => {
        if (isBottomSheet) return true; // skip validation if bottomSheet is active
        return !searchValue;
      },
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const textSelectProps = {
      ...otherProps,
      open,
      value: selectedItemList,
      itemList: finalItemList,
      originalItemList: itemList,
      searchValue,
      tempSearchValue,
      onChange: handleChange,
      onBlur: handleBlur,
      onSearch: handleSearch,
      onOpen: handleOpen,
      onValidate,
      searchPlaceholder: placeholderResult,
      bottomSheetPlaceholder,
      internalPending: searchState === STATES.loading || searchDebouncing,
      isBottomSheet,
      width: width ?? INPUT_WIDTH_MAP[size],
    };

    return <_TextSelectAsyncInputValidationInput {...textSelectProps} />;
    //@@viewOff:render
  },
});

const TextSelectAsyncInput = withValidationMap(_TextSelectAsyncInput, {
  required: required(),
  valueNotCommitted: {
    message: { import: importLsi, path: ["Validation", "valueNotCommitted"] },
    feedback: "warning",
  },
});

// delete props which are not on API
["_formattedValue"].forEach((prop) => {
  delete TextSelectAsyncInput.propTypes[prop];
  delete TextSelectAsyncInput.defaultProps[prop];
});

export { TextSelectAsyncInput };
export default TextSelectAsyncInput;
