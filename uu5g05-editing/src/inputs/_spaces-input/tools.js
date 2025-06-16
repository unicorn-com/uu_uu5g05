//@@viewOn:imports
import { PropTypes } from "uu5g05";
//@@viewOff:imports

const SPACES_INPUT_PROP_TYPES = {
  value: PropTypes.shape({
    margin: PropTypes.sizeOf(PropTypes.space),
    padding: PropTypes.sizeOf(PropTypes.space),
  }),
  onChange: PropTypes.func,
  displayVerticalMargin: PropTypes.bool,
  displayHorizontalMargin: PropTypes.bool,
  displayVerticalPadding: PropTypes.bool,
  displayHorizontalPadding: PropTypes.bool,
};

const SPACES_INPUT_DEFAULT_PROPS = {
  value: undefined,
  onChange: undefined,
  displayVerticalMargin: false,
  displayHorizontalMargin: true,
  displayVerticalPadding: false,
  displayHorizontalPadding: false,
};

const SLIDER_ITEM_LIST = [
  { value: 0, children: "None" },
  { value: "a" },
  { value: "b", children: "Medium" },
  { value: "c" },
  { value: "d", children: "Largest" },
];

const SIMPLE_VIEW = "simple";
const ADVANCED_VIEW = "advanced";
const ADAPTIVE_VALUE_LIST = SLIDER_ITEM_LIST.map((item) => item.value);
const SCREEN_SIZE_LIST = ["xs", "s", "m", "l", "xl"];
const DEFAULT_VALUE = { top: undefined, right: undefined, bottom: undefined, left: undefined };
const NUMBER_REGEXP = /^[0-9.]+$/;

function getScreenSizeObjectFromString(text) {
  let result = text;
  let regexp = /[:;]/;
  if (typeof text === "string" && regexp.test(text)) {
    result = Object.fromEntries(
      text
        .replace(/;$/, "")
        .split(";")
        .map((screenSizeDef) =>
          screenSizeDef.split(":").map((v) => {
            v = v.trim();
            const num = +v;
            if (!isNaN(num)) v = num;
            return v;
          }),
        ),
    );
  }
  return result;
}

function getStringFromScreenSizeObject(value) {
  let text;
  for (let screenSize in value) {
    let prevScreenSize = text ? text + " " : "";
    let newScreenSize = screenSize + ": " + value[screenSize] + ";";
    text = prevScreenSize + newScreenSize;
  }
  return text;
}

function getValuesForAllSides(originalValue, defaultValue, isNecessaryAddUnit) {
  let value = originalValue || defaultValue;
  let valueParts;
  let unit = isNecessaryAddUnit ? "px" : undefined;
  // adding units only on the first render, then adding units resolves the Unit input using the onBlur function
  // unit must defined due to remove future bugs with missing unit (e.g. padding="10 20" is not valid)

  if (typeof value === "number" || NUMBER_REGEXP.test(value)) {
    valueParts = [value != 0 && unit ? value + unit : Number(value)];
  } else {
    let splitedValue = value.split(" ");
    valueParts = splitedValue.map((v) => (NUMBER_REGEXP.test(v) && v != 0 && unit ? v + unit : v == 0 ? Number(v) : v));
  }

  let [top, right, bottom, left] = [
    valueParts[0] ?? defaultValue,
    valueParts[1] ?? valueParts[0] ?? defaultValue,
    valueParts[2] ?? valueParts[0] ?? defaultValue,
    valueParts[3] ?? valueParts[1] ?? valueParts[0] ?? defaultValue,
  ];
  return [top, right, bottom, left];
}

function getStyles(top, right, bottom, left) {
  let value;
  // css syntax
  if (top === right && right === bottom && bottom === left) {
    value = top;
  } else if (top !== bottom && right === left) {
    value = `${top} ${right} ${bottom}`;
  } else if (top === bottom && right === left) {
    value = `${top} ${right}`;
  } else {
    value = `${top} ${right} ${bottom} ${left}`;
  }
  return value;
}

function testScreenSizeObject(value) {
  return Object.keys(value).some((key) => SCREEN_SIZE_LIST.includes(key));
}

function testSameValues(value) {
  let result = false;
  if (value.right === value.left && value.bottom === value.top) {
    // only vertical and horizontal
    result = true;
  }
  return result;
}

//@@viewOn:exports
export {
  SPACES_INPUT_PROP_TYPES,
  SPACES_INPUT_DEFAULT_PROPS,
  SIMPLE_VIEW,
  ADVANCED_VIEW,
  ADAPTIVE_VALUE_LIST,
  SLIDER_ITEM_LIST,
  SCREEN_SIZE_LIST,
  DEFAULT_VALUE,
  NUMBER_REGEXP,
  getScreenSizeObjectFromString,
  getStringFromScreenSizeObject,
  getValuesForAllSides,
  getStyles,
  testScreenSizeObject,
  testSameValues,
};
//@@viewOff:exports
