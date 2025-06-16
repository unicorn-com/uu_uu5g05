//@@viewOn:imports
import { createVisualComponent, PropTypes, useRef, Utils } from "uu5g05";
import withValidationMap from "../with-validation-map.js";
import useValidatorMap from "../use-validator-map.js";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import { validateStep } from "../_internal/tools.js";
import InputSliderMulti from "../_internal/input-slider-multi.js";
import InputSlider from "../_internal/input-slider.js";
import importLsi from "../lsi/import-lsi.js";
import withNumberInputsSlider from "../_internal/with-number-inputs-slider";
//@@viewOff:imports

//@@viewOn:constants
const MAX_VALUE = 100;
const singleValuePropType = PropTypes.oneOfType([InputSlider.propTypes.value, PropTypes.string]);
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function sortValue(numberList) {
  if (numberList.length < 2) return numberList;
  const isOpenLeft = numberList[0] === null;
  const isOpenRight = numberList.length > 1 && numberList[numberList.length - 1] === null;
  const closedRangeList =
    isOpenLeft || isOpenRight ? numberList.slice(isOpenLeft ? 1 : 0, isOpenRight ? -1 : undefined) : [...numberList];
  closedRangeList.sort((a, b) => a - b);
  if (isOpenLeft) closedRangeList.unshift(null);
  if (isOpenRight) closedRangeList.push(null);
  return closedRangeList;
}

function toClosedRange(numberList) {
  const isOpenLeft = numberList[0] === null;
  const isOpenRight = numberList.length > 1 && numberList[numberList.length - 1] === null;
  return isOpenLeft || isOpenRight ? numberList.slice(isOpenLeft ? 1 : 0, isOpenRight ? -1 : undefined) : numberList;
}

//@@viewOff:helpers

const _SliderInput = withNumberInputsSlider(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Slider.Input",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...InputSliderMulti.propTypes,
      value: PropTypes.oneOfType([PropTypes.arrayOf(singleValuePropType), singleValuePropType]),
      itemList: PropTypes.arrayOf(
        PropTypes.shape({
          value: singleValuePropType,
          children: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
          tooltip: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
        }),
      ),
      tickStep: PropTypes.number,
      displayTick: PropTypes.bool,
      displayTooltip: PropTypes.bool,
      maxTickWidth: PropTypes.number,
      valueUnique: PropTypes.bool,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...InputSliderMulti.defaultProps,
      itemList: undefined,
      tickStep: undefined,
      displayTick: true,
      displayTooltip: true,
      maxTickWidth: 30,
      valueUnique: false,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const {
        value: propsValue,
        min: propsMin,
        max: propsMax,
        onChange,
        valueUnique,
        step: propsStep,
        ...otherProps
      } = props;
      const { itemList } = otherProps;
      let thumbSignificanceList = otherProps.thumbSignificanceList;

      const isItemList = Array.isArray(itemList) && itemList.length > 0;
      const isStringInItemList = itemList?.findIndex((item) => typeof item.value === "string") > -1;
      const itemListWithString = isItemList && isStringInItemList;

      const min = itemListWithString ? 0 : propsMin;
      const max = itemListWithString ? itemList.length - 1 : propsMax ? propsMax : MAX_VALUE;
      const step = itemListWithString ? 1 : propsStep;

      // we'll convert value to be always in the form of an array (for easier handling in nested components)
      const valueDimension = Math.max(1, Array.isArray(propsValue) ? propsValue.length : 1);
      let value = propsValue;
      if (value != null && !Array.isArray(value)) {
        value = new Array(valueDimension).fill(value);
      }

      let numberValueList, thumbSignificanceMap;
      if (value) {
        thumbSignificanceMap = {};
        numberValueList = sortValue(
          value.map((it, i) => {
            if (thumbSignificanceList) thumbSignificanceMap[it + ""] = thumbSignificanceList[i];
            return itemListWithString ? itemList.findIndex((tick) => tick.value === it) : it;
          }),
        );
      } else {
        numberValueList = [min];
      }

      // NOTE There's an issue regarding "key" / dragging state if user drags e.g. 1st thumb over 2nd thumb. The dragging state is
      // kept (keyed) based on value index which could actually change because we're sending sorted values from our onChange. Instead of keeping track of
      // these value index changes, we'll remember in handleOnChange the intended new value (in original unsorted order, which is keyed the same as it was
      // before) and if in next render we received that same value (list containing same values in any order), we'll use that original unsorted list instead.
      let lastNumberValueListRef = useRef(numberValueList);
      if (Utils.Object.shallowEqual(sortValue(lastNumberValueListRef.current), numberValueList)) {
        numberValueList = lastNumberValueListRef.current;
      }

      // change thumbSignificanceList if values were changed in the oredr -> min value is gone up to max value (left value is now right value)
      if (thumbSignificanceMap) thumbSignificanceList = numberValueList.map((v) => thumbSignificanceMap[v + ""]);

      function handleOnChange(e) {
        // reverse the conversion (e.g. change itemList value (indices) back to actual values, unwrap from array if having dimension 1, ...)
        let value = e.data.value;
        if (value != null) {
          lastNumberValueListRef.current = value;
          value = sortValue(value);
          if (itemListWithString) value = value.map((it) => itemList[it]?.value);
          if (valueDimension === 1) value = value[0];
        }
        onChange(new Utils.Event({ ...e.data, value }, e));
      }

      const onValidate = useValidatorMap(
        { ...props, value },
        {
          ...(itemListWithString
            ? {
                badValue: (value) => {
                  if (value == null) return value === undefined;
                  return toClosedRange(value).every((it) => itemList.some((tick) => tick.value === it));
                },
              }
            : {
                badValue: (value) => {
                  if (value == null) return value === undefined;
                  return toClosedRange(value).every((it) => typeof it === "number");
                },
                max: (value) => max == null || value == null || toClosedRange(value).every((it) => it <= max),
                min: (value) => min == null || value == null || toClosedRange(value).every((it) => it >= min),
                step: (value) => value == null || toClosedRange(value).every((it) => validateStep(it, step, min)),
              }),
          valueUnique: (value) => {
            if (!valueUnique || value == null) return true;
            let closedRangeValue = toClosedRange(value);
            return new Set(closedRangeValue).size === closedRangeValue.length;
          },
        },
      );
      //@@viewOff:private

      //@@viewOn:render
      return (
        <InputSliderMulti
          {...otherProps}
          min={min}
          max={max}
          step={step}
          value={numberValueList}
          onChange={typeof onChange === "function" ? handleOnChange : undefined}
          onValidate={onValidate}
          thumbSignificanceList={thumbSignificanceList}
        />
      );
      //@@viewOff:render
    },
  }),
);

const SliderInput = withValidationMap(_SliderInput, {
  required: required(),
  badValue: { message: { import: importLsi, path: ["Validation", "badValueNumber"] }, feedback: "error" },
  min: { message: { import: importLsi, path: ["Validation", "minNumber"] }, feedback: "error" },
  max: { message: { import: importLsi, path: ["Validation", "maxNumber"] }, feedback: "error" },
  step: { message: { import: importLsi, path: ["Validation", "stepNumber"] }, feedback: "error" },
});

//@@viewOn:exports
export { SliderInput };
export default SliderInput;
//@@viewOff:exports
