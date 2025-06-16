//@@viewOn:imports
import { Lsi, Utils } from "uu5g05";
import {
  ADAPTIVE_VALUE_LIST,
  getScreenSizeObjectFromString,
  getStringFromScreenSizeObject,
  getValuesForAllSides,
  getStyles,
  testScreenSizeObject,
  DEFAULT_VALUE,
  SIMPLE_VIEW,
  ADVANCED_VIEW,
  NUMBER_REGEXP,
} from "./tools.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

function adjustValueByProps(value, displayVertical, displayHorizontal) {
  let filteredValue = { top: value.top, right: value.right, bottom: value.bottom, left: value.left };

  if (!displayVertical) {
    filteredValue.left = undefined;
    filteredValue.right = undefined;
  }
  if (!displayHorizontal) {
    filteredValue.top = undefined;
    filteredValue.bottom = undefined;
  }
  return filteredValue;
}

function getFormattedValue(value, displayVertical, displayHorizontal, isNecessaryAddUnit) {
  if (value === undefined) return value;
  let result;

  // value can have one of the following formats:
  // value=5
  // value="5px"
  // value="5px 10px"
  // value="5px 10px 8px"
  // value="5px 10px 8px 12px"
  // value="a"
  // value="xs: 5px; m: 5px 10px 8px 12px"
  // value={xs: 5, m: 10}
  // value={left: 5, right: 10}
  // value={xs: {left: 5, right: 10}}

  if (typeof value === "number") {
    // value is number
    // unit must defined due to remove future bugs with missing unit (e.g. padding="10 20" is not valid)
    let modifiedValue = isNecessaryAddUnit && value != 0 ? value + "px" : value;
    result = adjustValueByProps(
      { top: modifiedValue, right: modifiedValue, bottom: modifiedValue, left: modifiedValue },
      displayVertical,
      displayHorizontal,
    );
  } else if (typeof value === "object") {
    if (testScreenSizeObject(value)) {
      // value is object with screen sizes
      let valueWithScreenSize = {};
      for (let screenSize in value) {
        valueWithScreenSize[screenSize] = getFormattedValue(value[screenSize], displayVertical, displayHorizontal);
      }
      result = valueWithScreenSize;
    } else {
      // value is object with positions
      let modifiedValue = isNecessaryAddUnit ? {} : value;
      if (isNecessaryAddUnit) {
        for (let position in value) {
          if ((typeof value[position] === "number" || NUMBER_REGEXP.test(value[position])) && value[position] != 0) {
            // unit must defined due to remove future bugs with missing unit (e.g. padding="10 20" is not valid)
            modifiedValue[position] = value[position] + "px";
          } else modifiedValue[position] = value[position];
        }
      }
      result = adjustValueByProps(modifiedValue, displayVertical, displayHorizontal);
    }
  } else if (typeof value === "string") {
    let modifiedValue = getScreenSizeObjectFromString(value);
    if (typeof modifiedValue === "object") {
      // e.g. "xs: 5px; m: 5px 10px 8px 12px" => {xs: "5px", m: "5px 10px 8px 12px"}
      // value is object as string in uu5string
      // modifiedValue is object with screen sizes
      let valueWithScreenSize = {};
      for (let screenSize in modifiedValue) {
        valueWithScreenSize[screenSize] = getFormattedValue(
          modifiedValue[screenSize],
          displayVertical,
          displayHorizontal,
        );
      }
      result = valueWithScreenSize;
    } else {
      // value is normal string
      let [top, right, bottom, left] = getValuesForAllSides(value, undefined, isNecessaryAddUnit);
      result = adjustValueByProps({ top, right, bottom, left }, displayVertical, displayHorizontal);
    }
  }

  // result must have one of the following formats:
  // result={top: "5", right: "10px", bottom: "8px", left: undefined}
  // result={xs: {left: undefined, right: "10px"}, m: {top: "5", bottom: "8px"}}
  return result;
}

function getValue(
  value,
  displayVerticalMargin,
  displayHorizontalMargin,
  displayVerticalPadding,
  displayHorizontalPadding,
  isNecessaryAddUnit,
) {
  if (value === undefined) return value;

  return {
    margin: getFormattedValue(value.margin, displayVerticalMargin, displayHorizontalMargin, isNecessaryAddUnit),
    padding: getFormattedValue(value.padding, displayVerticalPadding, displayHorizontalPadding, isNecessaryAddUnit),
  };
}

function testSimpleView(value) {
  let areOnlyAdaptiveValues = true; // default simple view

  if (value !== undefined) {
    if (testScreenSizeObject(value)) {
      // value is object with screen sizes
      // this type of value is specified for advanced view
      areOnlyAdaptiveValues = false;
    } else {
      // value is object with positions
      for (let position in value) {
        if (!areOnlyAdaptiveValues) continue; // if one value is not adaptive automatically it is not necessary to perform another search
        if (typeof value[position] === "number" && value[position] > 0) {
          areOnlyAdaptiveValues = false;
        } else if (typeof value[position] === "string") {
          let isAdaptiveValueInSomePosition = ADAPTIVE_VALUE_LIST.includes(value[position]);
          if (!isAdaptiveValueInSomePosition) areOnlyAdaptiveValues = false;
        }
      }
    }
  }
  return areOnlyAdaptiveValues;
}

function getView(value) {
  if (value === undefined) return SIMPLE_VIEW;

  return testSimpleView(value.margin) && testSimpleView(value.padding) ? SIMPLE_VIEW : ADVANCED_VIEW;
}

function getModifiedValue(value) {
  let result = {};
  for (let screenSize in value) {
    if (!value[screenSize] || Object.keys(value[screenSize]).length === 0) continue;
    result[screenSize] = getStyles(
      value[screenSize].top,
      value[screenSize].right,
      value[screenSize].bottom,
      value[screenSize].left,
    );
  }
  return result;
}

function getValueForOnChange(value, displayVertical, displayHorizontal) {
  if (value === undefined) return value;
  let newValue;

  if (testScreenSizeObject(value)) {
    // value is object with screen sizes
    // e.g. {xs: {top: undefined, right: 10, bottom: "5px", left: 0}}
    let isUndefinedValue = false;
    for (let screenSize in value) {
      if (isUndefinedValue || !value[screenSize]) continue;
      let currentValue = value[screenSize];
      let values = Object.values(currentValue);
      let undefinedValues = values.filter((item) => item === undefined);

      if (undefinedValues.length > 0 && undefinedValues.length !== values.length) {
        // some sides are not defined and some sides are defined in advanced view
        isUndefinedValue = true;
      }
    }

    if (isUndefinedValue || !displayVertical || !displayHorizontal) {
      // value must be object
      let modifiedValue = {};
      for (let screenSize in value) {
        if (value[screenSize]) {
          modifiedValue[screenSize] = adjustValueByProps(value[screenSize], displayVertical, displayHorizontal);
        }
      }
      newValue = modifiedValue;
    } else {
      // e.g. input  {xs: {top: "5px", right: "5px", bottom: "5px", left: "5px"}, m: {top: "5px", right: "10px", bottom: "8px", left: "12px"}}
      let modifiedValue = getModifiedValue(value);
      newValue = getStringFromScreenSizeObject(modifiedValue);
      // e.g. output "xs: 5px; m: 5px 10px 8px 12px"
    }
  } else {
    // value is object with positions
    // e.g. {top: undefined, right: 10, bottom: "5px", left: 0}
    let values = Object.values(value);
    let undefinedValues = values.filter((item) => item === undefined);
    let isUndefinedValue = undefinedValues.length > 0 && undefinedValues.length !== values.length;

    if (isUndefinedValue || !displayVertical || !displayHorizontal) {
      // some sides are not defined and some sides are defined in advanced view -> value must be object
      newValue = adjustValueByProps(value, displayVertical, displayHorizontal);
    } else if (undefinedValues.length === 0) {
      // all sides are defined
      newValue = getStyles(value.top, value.right, value.bottom, value.left);
    }
  }

  let result = {};
  if (newValue && testScreenSizeObject(newValue)) {
    // remove screen size without value
    for (let screenSize in newValue) {
      if (
        newValue[screenSize] &&
        Object.keys(newValue[screenSize]).length > 0 &&
        !Utils.Object.deepEqual(DEFAULT_VALUE, newValue[screenSize])
      ) {
        result[screenSize] = newValue[screenSize];
      }
    }
  } else {
    result = newValue;
  }

  // result is never typeof number
  // result can have one of the following formats:
  // result="5px"
  // result="5px 10px"
  // result="5px 10px 8px"
  // result="5px 10px 8px 12px"
  // result="a"
  // result="xs: 5px; m: 5px 10px 8px 12px"
  // result={left: 5, right: 10}
  // result={xs: {left: 5, right: 10}}

  return result;
}

function testValidValue(value) {
  let isValidValue = true;

  if (value && typeof value === "string") {
    const validUnits = ["px", "em", "rem", "%", "vh", "vw"]
      .map((unit) => unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    let unitsRegexp = new RegExp(`(${validUnits})$`); // valid units according to FormUnit
    let numberRegexp = /^[0-9]+(\.[0-9]+)?$/; // number and decimal number with dot
    let isValidAdaptiveValue = ADAPTIVE_VALUE_LIST.some((adaptiveValue) => adaptiveValue === value); // adaptive values in Slider

    if (!unitsRegexp.test(value) && !numberRegexp.test(value) && !isValidAdaptiveValue) {
      isValidValue = false;
    }
  }
  return isValidValue;
}

function getErrorList(value, spaceType) {
  let errorList = [];

  if (value && testScreenSizeObject(value)) {
    // value is object with screen sizes
    for (let screenSize in value) {
      for (let position in value[screenSize]) {
        if (!testValidValue(value[screenSize][position])) {
          errorList.push({
            spaceType,
            position,
            screenSize,
            props: {
              feedback: "error",
              message: <Lsi import={importLsi} path={["FormUnit", "error"]} />,
              messagePosition: "tooltip",
            },
          });
        }
      }
    }
  } else if (value && !testScreenSizeObject(value)) {
    // value is object with positions
    for (let position in value) {
      if (!testValidValue(value[position])) {
        errorList.push({
          spaceType,
          position,
          props: {
            feedback: "error",
            message: <Lsi import={importLsi} path={["FormUnit", "error"]} />,
            messagePosition: "tooltip",
          },
        });
      }
    }
  }
  return errorList;
}

function checkErrorList(value, spaceType, view, origErrorList) {
  let newErrorList = [];

  if (value && view === ADVANCED_VIEW) {
    // value is always object with screen size - onChange with invalid value is possible only in Advanced view
    let errorListWithOnlyMargin = origErrorList.filter((error) => error.spaceType === spaceType);
    newErrorList = errorListWithOnlyMargin.filter((error) => {
      for (let screensize in value) {
        let existsError = false;
        if (error.screenSize === screensize) existsError = true;
        if (value[screensize][error.position] && !testValidValue(value[screensize][error.position])) {
          existsError = true;
        }
        return existsError;
      }
    });
  }
  return newErrorList;
}

//@@viewOn:exports
export { getValue, getView, getValueForOnChange, getErrorList, checkErrorList };
//@@viewOff:exports
