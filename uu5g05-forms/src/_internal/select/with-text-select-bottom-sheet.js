//@@viewOn:imports
import { createComponent, Utils, useState, useUpdateEffect, useRef, useMemo, PropTypes } from "uu5g05";
import Config from "../../config/config.js";
import InputTextSelectHeader from "./input-text-select-header.js";
import InputSelectControls from "./input-select-controls.js";
import { useDependencyValue } from "./use-dependency-value.js";
import { checkInsertedItemCandidate, getMap, sortByArray, getOutputValue } from "./tools.js";
//@@viewOff:imports

//@@viewOn:constants
const HEIGHT_OFFSET = 12; // Divider between itemList and insert candidate
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

function withTextSelectBottomSheet(Input) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withTextSelectBottomSheet(${Input.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Input.propTypes,
      disableOptionReorder: PropTypes.bool,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Input.defaultProps,
      disableOptionReorder: undefined,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const {
        value,
        itemList,
        onChange,
        onOpen,
        onAddTempItem,
        searchPlaceholder,
        internalPending,
        disableOptionReorder: propsDisableOptionReorder,
        elementRef,
        ...otherProps
      } = props;
      const { open, insertable, onSearch, multiple, searchValue, level, multilevel } = otherProps;
      const disableOptionReorder =
        typeof propsDisableOptionReorder === "boolean" ? propsDisableOptionReorder : itemList?.length < 9;

      const elementBoxRef = useRef();

      const [valueBeforeSubmit, setValueBeforeSubmit] = useState(value);
      const [tempList, setTempList] = useState([]);

      const memorizedItemListMap = useMemo(() => getMap(itemList), [itemList]);

      const memorizedPlaceholder = useRef();
      if (searchPlaceholder) memorizedPlaceholder.current = searchPlaceholder;

      // Sorting
      const deps = useMemo(() => {
        // Empty searchValue and undefined searchValue is same for sorting
        const _searchValue = searchValue === "" ? undefined : searchValue;
        return { open, searchValue: _searchValue, level };
      }, [open, searchValue, level]);

      const dependencyValue = useDependencyValue(valueBeforeSubmit, disableOptionReorder ? {} : deps);

      const filteredTempList = tempList.filter((item) => !memorizedItemListMap.has(item.value));
      const itemListToSort = searchValue ? itemList : [...itemList, ...filteredTempList];

      const sortedItemList = sortByArray(itemListToSort, dependencyValue);

      useUpdateEffect(() => {
        if (!open) {
          setValueBeforeSubmit(value);
          setTempList([]);
        }
      }, [value, open]);

      function handleOpen(e) {
        // Clear searchValue
        if (!e.data.value) onSearch(new Utils.Event({ value: undefined }, e));
        onOpen(e);
      }

      function handleTempList(e) {
        setTempList((prevState) => {
          const tempListMap = getMap(prevState);

          const newTempList = [];
          e.data.value?.forEach((item) => {
            if (tempListMap.has(item.value)) return;

            newTempList.push(item);
          });

          return [...prevState, ...newTempList];
        });
      }

      function handleChange(e) {
        if (open && multiple) {
          const eventValue = getOutputValue(e.data.value, valueBeforeSubmit, sortedItemList);
          setValueBeforeSubmit(eventValue);
          handleTempList(e);
          onSearch(new Utils.Event({ value: undefined }, e));
          return;
        }

        onChange(e);
        elementBoxRef.current.focus();
      }

      function handleSubmit(e) {
        onSearch(new Utils.Event({ value: undefined }, e));
        onOpen(new Utils.Event({ value: false }));
        setTempList([]);
        onChange(new Utils.Event({ value: valueBeforeSubmit }, e));
        elementBoxRef.current.focus();
      }

      function handleReset() {
        if (!props.required && !props.readOnly) setValueBeforeSubmit([]);
      }

      function handleCancel(e) {
        handleOpen(new Utils.Event({ value: false }, e));
        elementBoxRef.current.focus();
      }

      function handleAddTempItem() {
        setValueBeforeSubmit((prevState) => [
          ...prevState,
          {
            value: searchValue,
          },
        ]);
        // Add temporary item
        onAddTempItem();
      }

      function getInsertOption() {
        return {
          insertCandidate: true,
          icon: "uugds-plus-circle",
          children: searchValue,
          onClick: (e) => {
            if (multiple) {
              handleAddTempItem();
              return;
            }
            onChange(new Utils.Event({ value: [{ value: searchValue }] }, e));
            onAddTempItem();
            onOpen(new Utils.Event({ value: false }));
            elementBoxRef.current.focus();
          },
        };
      }

      function getUpdatedItemList() {
        // Following code is relevant only for open with insertable, otherwise return itemList
        if (!(open && insertable)) return sortedItemList;

        // Filter out insertCandidate item
        const updatedItemList = sortedItemList.filter((item) => !item.insertCandidate);

        // Prepare new insertCandidate according to valueBeforeSubmit
        if (checkInsertedItemCandidate(updatedItemList, valueBeforeSubmit, searchValue)) {
          updatedItemList.push(getInsertOption());
        }

        return updatedItemList;
      }

      const updatedItemList = getUpdatedItemList();

      function getItemListLength() {
        if (!multilevel) return updatedItemList.length;

        if (searchValue) {
          return updatedItemList.filter((item) => item.root || item.insertCandidate || !item.parent).length;
        }

        const currLevel = level[level.length - 1];

        if (!currLevel) {
          return updatedItemList.filter((item) => !item.parent).length;
        }

        // We need to raise filtered itemList length by 1 because of category
        return updatedItemList.filter((item) => item.parent?.value === currLevel).length + 1;
      }
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <Input
          {...otherProps}
          displayedValue={value}
          value={valueBeforeSubmit}
          itemList={updatedItemList}
          onChange={handleChange}
          onOpen={handleOpen}
          elementRef={Utils.Component.combineRefs(elementRef, elementBoxRef)}
          pickerProps={{
            itemListLength: getItemListLength(),
            heightOffset: insertable && searchValue ? HEIGHT_OFFSET : 0,
            header: (
              <InputTextSelectHeader
                value={searchValue}
                onChange={onSearch}
                pending={internalPending}
                placeholder={memorizedPlaceholder.current}
                onCancel={handleCancel}
              />
            ),
            footer: multiple ? <InputSelectControls onSubmit={handleSubmit} onReset={handleReset} /> : undefined,
          }}
          displayEmptyPicker
        />
      );
      //@@viewOff:render
    },
  });
}

export { withTextSelectBottomSheet };
export default withTextSelectBottomSheet;
