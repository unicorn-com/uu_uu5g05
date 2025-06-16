//@@viewOn:imports
import { Utils, createVisualComponent, useState, useEffect, useRef, useUpdateEffect, PropTypes } from "uu5g05";
import Config from "../../config/config.js";
import usePersistFocus from "../use-persist-focus.js";
import useSelectKeyboardHandling from "./use-select-keyboard-handling.js";
import InputSelectBase from "./input-select-base.js";
import InputTextSelectContent from "./input-text-select-content.js";
import { getItemText, normalizeString, removeItem, filterOutDisabledItems } from "./tools.js";
//@@viewOff:imports

//@@viewOn:constants
const { onClosePicker, ...inputPropTypes } = InputSelectBase.propTypes;
const { onClosePicker: _onClosePicker, ...inputDefaultProps } = InputSelectBase.defaultProps;
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function getSearchedItem(itemList, searchValue) {
  let result;

  for (let i = 0; i < itemList.length; i++) {
    let item = itemList[i];
    let itemSearchValue = getItemSearchValue(item);
    if (itemSearchValue === searchValue) {
      result = item;
      break;
    }
    if (!result && itemSearchValue && itemSearchValue.startsWith(searchValue)) {
      result = item;
    }
  }

  return result;
}

function getAutocomplete(searchValue, itemList, focusedItemIndex) {
  let autocomplete;

  if (searchValue && focusedItemIndex > -1 && (searchValue.length >= 3 || itemList.length <= 10)) {
    const item = itemList[focusedItemIndex];
    const itemText = getItemText(item);
    const normalizedItemSearchValue = normalizeString(getItemSearchValue(item));
    const normalizedSearchValue = normalizeString(searchValue);

    if (
      normalizedItemSearchValue &&
      normalizedItemSearchValue.startsWith(normalizedSearchValue) &&
      normalizedItemSearchValue !== normalizedSearchValue
    ) {
      autocomplete = itemText;
    }
  }

  return autocomplete;
}

function getItemSearchValue(item) {
  let itemSearchValue = getItemText(item);
  if (itemSearchValue) itemSearchValue = normalizeString(itemSearchValue);
  return itemSearchValue;
}

function removeAll(onChange) {
  return (e) => {
    e.stopPropagation();
    onChange(new Utils.Event({ value: [] }, e));
  };
}
//@@viewOff:helpers

const InputTextSelect = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputTextSelect",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...inputPropTypes,
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        icon: PropTypes.icon,
        iconRight: PropTypes.oneOfType([PropTypes.bool, PropTypes.icon]),
        text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        children: PropTypes.any,
        focused: PropTypes.bool,
      }),
    ),
    itemFocus: PropTypes.shape({
      value: PropTypes.any,
      index: PropTypes.number,
      setByValue: PropTypes.func,
    }),
    selectedItemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        icon: PropTypes.icon,
        iconRight: PropTypes.oneOfType([PropTypes.bool, PropTypes.icon]),
        text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        children: PropTypes.any,
        focused: PropTypes.bool,
      }),
    ),
    selectedItemFocus: PropTypes.shape({
      value: PropTypes.any,
      index: PropTypes.number,
      setByValue: PropTypes.func,
    }),
    searchValue: PropTypes.string,
    displayTags: PropTypes.bool,
    onSearch: PropTypes.func,
    onOpen: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...inputDefaultProps,
    itemList: [],
    itemFocus: {},
    selectedItemList: [],
    selectedItemFocus: {},
    searchValue: undefined,
    onSearch: undefined,
    onOpen: () => {},
    displayTags: true,
    displayOptions: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      value,
      onChange: propsOnChange,
      elementAttrs,
      elementRef,
      itemList,
      itemFocus,
      selectedItemList,
      selectedItemFocus,
      onFocus,
      onBlur,
      autoFocus,
      placeholder,
      onSearch,
      displayClearButton,
      displayTags,
      onOpen,
      onInternalFocus,
      inputRef,
      displayedValue,
      iconRightList,
      iconRight,
      onIconRightClick,
      iconOpen,
      iconClosed,
      ...otherProps
    } = props;
    const {
      multiple,
      size,
      disabled,
      readOnly,
      displayOptions,
      open,
      searchValue: searchValueProps,
      required,
      pending,
      isBottomSheet,
    } = otherProps;

    const inputBoxRef = useRef();
    const searchInputRef = useRef();
    const openRef = useRef();
    openRef.current = open;

    const [searchValue, setSearchValue] = useState(searchValueProps);

    const [focus, handleFocus, handleBlur] = usePersistFocus({
      onFocus,
      onBlur: (e) => {
        if (typeof onBlur === "function") onBlur(e);
      },
      disabled: disabled,
    });

    useEffect(() => {
      onInternalFocus(new Utils.Event({ value: focus }));
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [focus]);

    useEffect(() => {
      if (autoFocus) searchInputRef.current?.focus();
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, []);

    useEffect(() => {
      if (searchValue) {
        let itemToFocus = getSearchedItem(itemList, searchValue);
        if (itemToFocus) itemFocus.setByValue(itemToFocus.value);
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [searchValue]);

    useUpdateEffect(() => {
      updateSearchValue(searchValueProps);
    }, [searchValueProps]);

    useUpdateEffect(() => {
      if (searchValue && !open.current) openPicker(true);
    }, [searchValue]);

    function openPicker(newValue) {
      const newOpenValue = newValue === undefined ? !open : newValue;

      onOpen(new Utils.Event({ value: newOpenValue }));
    }

    function onChange(event) {
      if (typeof propsOnChange === "function") propsOnChange(event);
    }

    function updateSearchValue(value) {
      if (!isBottomSheet) setSearchValue(value);
    }

    function handleChangeSearchValue(event) {
      updateSearchValue(event.data.value);
      if (typeof onSearch === "function") onSearch(event);
    }

    function handleChangeSearch(e) {
      let { value } = e.target;
      handleChangeSearchValue(new Utils.Event({ value }, e));
    }

    function handleChange(event) {
      if (!multiple) openPicker(false);

      const filteredDisabledValues = filterOutDisabledItems(event.data.value);

      if (!(isBottomSheet && open) && !(!displayTags && multiple && itemList.length > 1)) {
        handleChangeSearchValue(new Utils.Event({ value: undefined }));
      }

      onChange(new Utils.Event({ value: filteredDisabledValues }, event));
    }

    function handleClickInputBox(e) {
      if (e.defaultPrevented) return;
      openPicker();
      if (document.activeElement !== searchInputRef.current) {
        // Focus search input when input box is clicked (but not directly input)
        searchInputRef.current?.focus();
      }
    }

    function handlePickerItemFocus(e) {
      itemFocus.setByValue(e.data.value?.value);
      itemFocus.setByChildren(e.data.value?.children);
    }

    function handleSelectedItemFocus(e) {
      selectedItemFocus.setByValue(e.data.value?.value);
      selectedItemFocus.setByChildren(e.data.value?.children);
    }

    const handlePickerKeyDown = useSelectKeyboardHandling(
      itemList,
      selectedItemList,
      itemFocus.value,
      itemFocus.children,
      handlePickerItemFocus,
      handleChange,
      {
        multiple,
        required,
        shouldHandleKey: (e) => {
          if (open) {
            if (
              ["Tab", "Enter", "NumpadEnter", " ", "End", "Home", "ArrowUp", "ArrowDown", "Escape"].indexOf(e.key) > -1
            )
              return true;
            if (e.key === "a" && !searchValue) return true;
            if (e.key === "Tab") return true;
          }
          if (!displayOptions && ["Enter", "NumpadEnter", "ArrowUp", "ArrowDown", "End", "Home"].indexOf(e.key) > -1)
            return true;
          return e.key === " " && !searchValue;
        },
        openPicker,
      },
    );

    const handleInputBoxKeyDown = useSelectKeyboardHandling(
      selectedItemList,
      selectedItemList,
      selectedItemFocus.value,
      selectedItemFocus.children,
      handleSelectedItemFocus,
      (e) => handleChange(new Utils.Event({ value: multiple ? e.data.value : e.data.value[0] }, e)),
      {
        multiple,
        reverseSelectionOrder: true,
        shouldHandleKey: (e) => {
          if (["Backspace", "Delete"].indexOf(e.key) > -1) return true;
          if (["ArrowLeft", "ArrowRight"].indexOf(e.key) > -1 && !searchValue) return true;
          return !!(e.key === "Tab" && open);
        },
        openPicker,
      },
    );

    function handleKeyDown(e) {
      if (typeof elementAttrs?.onKeyDown === "function") elementAttrs?.onKeyDown(e);
      if (e.defaultPrevented) return;

      if ((e.key === "Enter" || e.key === "NumpadEnter") && !open && displayOptions) {
        e.preventDefault();
        openPicker(true);
        return;
      }

      if (e.key === " ") {
        if (!open && !searchValue) {
          e.preventDefault();
          openPicker(true);
        }
        return;
      }

      if (e.key === "Backspace" && !e.repeat && multiple && !searchValue && value.length) {
        e.preventDefault();
        let lastValueItem = value[value.length - 1];
        removeItem(onChange, value)(new Utils.Event({ value: lastValueItem.value }, e));
        handleChangeSearchValue(new Utils.Event({ value: getItemText(lastValueItem) }, e));
        return;
      }

      handlePickerKeyDown(e);
      handleInputBoxKeyDown(e);
    }

    function getIconRightList() {
      let newIconRightList = iconRightList ?? [];
      if (!iconRightList.length && iconRight) {
        newIconRightList = [{ icon: iconRight, onClick: onIconRightClick }];
      }

      if (readOnly) return newIconRightList;

      if (!disabled && !pending && !required && displayClearButton) {
        const _displayedValue = displayedValue ?? value;
        if (displayTags && _displayedValue.length && _displayedValue[0].value !== undefined) {
          newIconRightList = [{ icon: "uugds-close", onClick: removeAll(handleChange) }, ...newIconRightList];
        } else if (searchValue) {
          newIconRightList = [
            { icon: "uugds-close", onClick: () => handleChangeSearchValue(new Utils.Event({ value: undefined })) },
            ...newIconRightList,
          ];
        }
      }

      if (displayOptions) {
        const openStateIcon = open ? iconOpen : iconClosed;
        if (openStateIcon) {
          newIconRightList = [...newIconRightList, { icon: openStateIcon }];
        }
      }

      return newIconRightList;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <span style={{ display: "contents" }} onBlur={handleBlur} onFocus={handleFocus}>
        <InputSelectBase
          {...otherProps}
          displayedValue={!displayTags ? [] : displayedValue}
          value={value}
          itemList={itemList}
          focused={focus}
          onClick={handleClickInputBox}
          onChange={handleChange}
          onClosePicker={() => {
            openPicker(false);
            isBottomSheet && inputBoxRef.current?.focus();
          }}
          elementRef={Utils.Component.combineRefs(elementRef, inputBoxRef)}
          elementAttrs={{
            ...elementAttrs,
            tabIndex: -1,
            onKeyDown: readOnly ? undefined : handleKeyDown,
          }}
          displayClearButton={displayTags && displayClearButton}
          iconRightList={getIconRightList(props)}
        >
          <InputTextSelectContent
            selectedItemList={selectedItemList}
            focused={focus}
            size={size}
            multiple={multiple}
            searchValue={searchValue}
            placeholder={placeholder}
            readOnly={readOnly}
            inputRef={Utils.Component.combineRefs(inputRef, searchInputRef)}
            onChange={handleChangeSearch}
            onRemoveTag={removeItem(onChange, value)}
            displayTags={displayTags}
            autoCompleteValue={getAutocomplete(searchValue, itemList, itemFocus.index)}
            isBottomSheet={isBottomSheet}
            colorScheme={otherProps.colorScheme}
            disabled={otherProps.disabled}
          />
        </InputSelectBase>
      </span>
    );
    //@@viewOff:render
  },
});

export { InputTextSelect };
export default InputTextSelect;
