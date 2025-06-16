//@@viewOn:imports
import { createComponent, PropTypes, Utils, useRef, useWillMount, useUpdateEffect, Lsi } from "uu5g05";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import withFlattenedList from "../_internal/select/with-flattened-list.js";
import withValidationMap from "../with-validation-map.js";
import withItemListValidation from "../_internal/select/with-item-list-validation.js";
import withValidationInput from "../with-validation-input.js";
import SelectInputView from "../_internal/select/select-input-view.js";
import {
  checkValuesAndCallOnChange,
  getItemChildren,
  getOutputValue,
  removeDuplicates,
  replaceItemProps,
} from "../_internal/select/tools.js";
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

const { displayClearButton, ...selectFieldViewPropTypes } = SelectInputView.propTypes;
const { displayClearButton: _displayClearButton, ...selectFieldViewDefaultProps } = SelectInputView.defaultProps;
//@@viewOff:constants

//@@viewOn:helpers
function getItemList(itemListParam) {
  const itemList = [];

  itemListParam.forEach((item) => {
    if (item.value === undefined && item.children === undefined) return;
    if (item.children && typeof item.children === "object" && !Utils.Element.isValid(item.children)) {
      item.children = <Lsi lsi={item.children} />;
    }
    itemList.push(replaceItemProps(item));
  });

  return itemList;
}

function getSelectedItemList(itemList, valueParam) {
  const value = !Array.isArray(valueParam) ? [valueParam] : valueParam || [];
  const selectedItemList = [];

  // Create hashMap for better searching
  const itemListMap = itemList.reduce((map, item) => map.set(item.value, item), new Map());

  value.forEach((v) => {
    const matchingItem = itemListMap.get(v);
    if (matchingItem === undefined || (matchingItem.value === undefined && matchingItem.children === undefined)) return;
    if (matchingItem && !matchingItem.divider && !matchingItem.category) {
      selectedItemList.push({
        ...matchingItem,
        iconRight: typeof matchingItem.iconRight === "boolean" ? undefined : matchingItem.iconRight,
        children: matchingItem.selectedChildren ?? getItemChildren(matchingItem),
      });
    }
  });

  return selectedItemList;
}
//@@viewOff:helpers

const _SelectInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Select.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...selectFieldViewPropTypes,
    value: PropTypes.any,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...selectFieldViewDefaultProps,
    value: undefined,
    itemList: [],
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onChange, value, itemList, width, ...otherProps } = props;
    const { multiple, required, size } = otherProps;

    const displayClearButton = useRef(false);

    const normalizeItemList = getItemList(itemList);
    const selectedItemListValue = getSelectedItemList(itemList, value);

    useWillMount(() => {
      // hide clear button when input is required
      if (!required) displayClearButton.current = true;
    });

    useUpdateEffect(() => {
      if (multiple) checkValuesAndCallOnChange(value, itemList, onChange);
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [itemList]);

    function handleChange(event) {
      let eventData;
      let eventValue = getOutputValue(event.data.value, value, itemList);

      if (multiple) {
        eventValue = removeDuplicates(eventValue);
        eventData = { value: eventValue?.map((item) => item.value) };
      } else {
        eventData = { value: eventValue ? eventValue[0].value : eventValue };
      }

      onChange(new Utils.Event(eventData, event));
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const selectProps = {
      ...otherProps,
      value: selectedItemListValue,
      itemList: normalizeItemList,
      onChange: handleChange,
      displayClearButton: displayClearButton.current,
      width: width ?? INPUT_WIDTH_MAP[size],
    };

    return <SelectInputView {...selectProps} />;
    //@@viewOff:render
  },
});

const SelectInput = withFlattenedList(
  withValidationMap(withItemListValidation(withValidationInput(_SelectInput)), {
    required: required(),
    mismatch: {
      message: { import: importLsi, path: ["Validation", "mismatchSelect"] },
      feedback: "error",
    },
  }),
);

// delete props which are not on API
["_formattedValue"].forEach((prop) => {
  delete SelectInput.propTypes[prop];
  delete SelectInput.defaultProps[prop];
});

export { SelectInput, _SelectInput as SelectInputNoValidation };
export default SelectInput;
