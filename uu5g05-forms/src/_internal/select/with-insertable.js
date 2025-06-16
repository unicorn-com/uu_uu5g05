//@@viewOn:imports
import { createComponent, Utils, useState, useEffect, useRef } from "uu5g05";
import Config from "../../config/config.js";
import { normalizeString, getMap, checkInsertedItemCandidate } from "./tools.js";
//@@viewOff:imports

//@@viewOn:helpers
function filterItemListBySearchValue(itemList, searchValue) {
  if (!searchValue) return itemList;

  return itemList.filter((item) => normalizeString(item.value).indexOf(searchValue) > -1);
}
//@@viewOff:helpers

function withInsertable(Input) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withInsertable(${Input.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: Input.propTypes,
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: Input.defaultProps,
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      let {
        itemList,
        originalItemList,
        value,
        onChange,
        onBlur,
        elementAttrs,
        tempSearchValue,
        searchPlaceholder: searchPlaceholderProp,
        ...otherProps
      } = props;
      const { readOnly, multiple, searchValue, onSearch, open, onOpen, insertable } = otherProps;
      if (value && !Array.isArray(value)) value = [value];

      const valueRef = useRef();
      valueRef.current = value;

      const [tempList, setTempList] = useState([]);

      const normalizedSearchValue = normalizeString(searchValue);

      // Filter tempList by searchValue and merge it with itemList
      const itemListMap = getMap(itemList);

      tempSearchValue = originalItemList?.length ? tempSearchValue : normalizedSearchValue;
      let filteredTempList = filterItemListBySearchValue(tempList, tempSearchValue);
      filteredTempList = filteredTempList.filter((item) => !itemListMap.has(item.value));

      const mergedList = [...itemList, ...filteredTempList];

      useEffect(() => {
        if (open) {
          const valueMap = valueRef.current && getMap(valueRef.current);
          setTempList((prevState) => {
            return prevState.filter((item) => valueMap?.has(item.value));
          });
        }
      }, [open]);

      function getInsertedItemCandidate() {
        return checkInsertedItemCandidate(mergedList, value, searchValue) ? { value: searchValue } : undefined;
      }

      function getInsertOption(insertedItem) {
        return {
          insertCandidate: true,
          icon: insertable === "add" ? "uugds-plus-circle" : undefined,
          children: searchValue,
          onClick: (e) => handleInsertItem(e, insertedItem),
          value: searchValue,
        };
      }

      function getOptionList() {
        const optionList = [];

        if (!searchValue || (searchValue && !multiple && insertable === true)) return optionList;

        // Add relevant insertCandidate
        const insertedItem = getInsertedItemCandidate();
        if (insertedItem) optionList.push(getInsertOption(insertedItem));

        return optionList;
      }

      function handleAddTempItem(e) {
        setTempList((prevState) => [
          ...prevState,
          {
            value: searchValue,
            children: searchValue,
            text: searchValue,
          },
        ]);
        onSearch(new Utils.Event({ value: undefined }, e));
      }

      function handleInsertItem(e, item) {
        onChange(new Utils.Event(multiple ? { value: [...(value || []), item] } : { value: [item] }, e));

        handleAddTempItem(e);

        if (!multiple) onOpen(new Utils.Event({ value: false }));
      }

      function handleKeyDown(e) {
        if (typeof elementAttrs?.onKeyDown === "function") elementAttrs?.onKeyDown(e);
        if (e.defaultPrevented) return;

        if ((e.key === "Enter" || e.key === "NumpadEnter") && searchValue) {
          let insertedItem = getInsertedItemCandidate();
          if (insertedItem) {
            e.preventDefault();
            handleInsertItem(e, insertedItem);
          }
        }
      }

      function handleChange(e) {
        // Prevent onChange calling when there is searchValue and blur was performed - originally this resets the value to undefined,
        // but we want to perform our own onChange in the handleBlur method.
        if (
          !(!multiple && e.type === "blur" && value.length && !e.data.value.length && searchValue) &&
          typeof onChange === "function"
        ) {
          onChange(e);
        }
      }

      function handleBlur(e) {
        if (typeof onBlur === "function") onBlur(e);
        if (searchValue && !multiple && insertable === true) {
          const insertedItem = getInsertedItemCandidate();
          handleInsertItem(e, insertedItem);
        }
      }
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      const optionList = getOptionList();
      const searchPlaceholder = optionList.length ? undefined : searchPlaceholderProp;

      return (
        <Input
          {...otherProps}
          value={value}
          itemList={mergedList}
          optionList={optionList}
          searchPlaceholder={searchPlaceholder}
          onChange={handleChange}
          onBlur={handleBlur}
          onAddTempItem={handleAddTempItem}
          elementAttrs={{
            ...elementAttrs,
            onKeyDown: readOnly ? undefined : handleKeyDown,
          }}
        />
      );
      //@@viewOff:render
    },
  });
}

export { withInsertable };
export default withInsertable;
