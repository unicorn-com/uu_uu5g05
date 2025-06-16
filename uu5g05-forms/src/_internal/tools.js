import { _Tools as Uu5Tools } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UuDateTime } from "uu_i18ng01";

const ERROR_FEEDBACK = "error";
const WARNING_FEEDBACK = "warning";
const FEEDBACK_ORDER = [ERROR_FEEDBACK, WARNING_FEEDBACK];

const FORM_ITEM_PUBLIC_STATE_PROPS = ["value", "initialValue", "errorList", "pending"];

function normalizeValidatorResult(validatorResult, item = {}) {
  let result;
  if (validatorResult == null) result = [];
  else {
    let list = Array.isArray(validatorResult) ? validatorResult : [validatorResult];
    result = list
      .map((it) => {
        if (typeof it === "boolean") it = it === false ? { code: item.code } : null;
        else if (!it || typeof it !== "object") it = null;
        if (!it) return null; // unrecognized validation result
        let resultOpts = item.getResultOpts?.(it.code || item.code);
        let itemResult = {
          code: item.code,
          ...resultOpts,
          async: item.async,
          ...it,
          feedback: resultOpts?.feedback ?? it?.feedback ?? ERROR_FEEDBACK,
        };
        if (itemResult.code == null) delete itemResult.code;
        return itemResult;
      })
      .filter(Boolean);
  }
  return result;
}

function indexOfFeedback(feedback) {
  let index = FEEDBACK_ORDER.indexOf(feedback);
  return index === -1 ? FEEDBACK_ORDER.length : index; // unknown / other feedback at the end
}

function sortErrorList(errorList) {
  // stable sort by feedback severity (errors first, then warnings)
  return errorList
    .map((it, i) => [it, i])
    .sort(([it1, i], [it2, j]) => indexOfFeedback(it1.feedback) - indexOfFeedback(it2.feedback) || i - j)
    .map(([it]) => it);
}

function getPlaceholderStyles(background) {
  return {
    color: Uu5Elements.UuGds.Shape.getValue(["text", background, "building", "subdued"]).default.colors.foreground,
    fontStyle: "italic",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  };
}

function getFormValue(internalItemMap) {
  const value = {};
  for (const name in internalItemMap) value[name] = internalItemMap[name].value;
  return value;
}

function getFormItemMap(internalItemMap) {
  const apiItemMap = {};
  Object.entries(internalItemMap).map(([name, itemState]) => {
    apiItemMap[name] = {};
    for (let k of FORM_ITEM_PUBLIC_STATE_PROPS) apiItemMap[name][k] = itemState[k];
    apiItemMap[name].errorList ||= [];
    apiItemMap[name].valid = itemState.errorList?.[0]?.feedback !== ERROR_FEEDBACK;
  });
  return apiItemMap;
}

function getStackInfo(thisFileName) {
  let stackInfo;
  let stack = new Error().stack;
  if (stack) {
    let lines = stack.split(/\n/);
    let i = 0;
    while (i < lines.length && !lines[i].match(/^\s*at\s+/)) i++; // skip error message
    while (
      i < lines.length &&
      !lines[i].match(new RegExp(Uu5Tools.regexpEscape(thisFileName) + "|tools\\.js|uu5g05[-.]"))
    ) {
      i++; // skip until this file (or bundled uu5g05*.js) gets encountered in stack
    }
    while (
      i < lines.length &&
      lines[i].match(new RegExp(Uu5Tools.regexpEscape(thisFileName) + "|tools\\.js|uu5g05[-.]"))
    ) {
      i++; // skip while in this file (or in bundled uu5g05*.js)
    }
    if (process.env.NODE_ENV === "test") {
      while (i < lines.length && lines[i].match(/[/\\]expect[/\\]/)) i++; // skip while in `expect` (if running in test)
    }
    if (i < lines.length) stackInfo = lines[i];
  }
  return stackInfo;
}

function validateMonthInputValue(value) {
  value = value?.split("-");
  if (value && value.length === 2 && value[0].match(/^[0-9]{4}$/) && value[1].match(/^[0-9]{2}$/)) {
    let month = Number(value[1]);
    return month >= 1 && month <= 12;
  }
  return false;
}

function validateQuarterInputValue(value) {
  value = value.split("-Q");
  return value.length === 2 && !!value[0].match(/^[0-9]{4}$/) && !!value[1].match(/^[1-4]$/);
}

function parseQuarterToObject(quarter) {
  let parts = quarter.split("-Q");
  return {
    year: Number(parts[0]),
    quarter: Number(parts[1]),
  };
}

function validateYearInputValue(value) {
  if (typeof value === "number") {
    return value >= 0 && value <= 9999;
  }
  return false;
}

function getValidDateTime(dateTime, timeZone) {
  if (!dateTime) return;

  try {
    return new UuDateTime(dateTime, timeZone);
  } catch (e) {
    // ignore, invalid date
  }
}

function getDaysDiff(fromDate, toDate) {
  // NOTE Assuming that dates are on day boundaries (time is 00:00:00.000, or at least same in both)
  if (fromDate >= toDate) return 0;
  return Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
}

function validateStep(value, step, min) {
  if (step == null || value == null) return true;
  let modulo = Math.abs((value - (min || 0)) % step);
  if (Math.floor(step) !== Math.ceil(step)) {
    const FLOAT_EPSILON = 1e-7;
    // e.g. value=0.11 step=0.01 -> modulo=0.00999999... due to inexact floats (modulo should be 0)
    // => try to convert step to integer if there's not many decimals (so we'll do `11 % 1` instead of `0.11 % 0.01`)
    let decimalCount = (step + "").split(".")[1]?.length;
    if (decimalCount > 0 && decimalCount <= 5) {
      let powerOfTen = Math.pow(10, decimalCount);
      // e.g. value=0.14 step=0.01, we will do 0.14*100 and 0.01*100 ending up with value=14.000000000000002, step=1
      // so round float with tiny difference from an integer to an integer
      let valueMultipliedNorm = value * powerOfTen;
      if (Math.abs(Math.round(valueMultipliedNorm) - valueMultipliedNorm) <= FLOAT_EPSILON) {
        valueMultipliedNorm = Math.round(valueMultipliedNorm);
      }
      let minMultipliedNorm = (min || 0) * powerOfTen;
      if (Math.abs(Math.round(minMultipliedNorm) - minMultipliedNorm) <= FLOAT_EPSILON) {
        minMultipliedNorm = Math.round(minMultipliedNorm);
      }
      modulo = Math.abs((valueMultipliedNorm - minMultipliedNorm) % Math.round(step * powerOfTen));
    } else {
      modulo = Math.min(modulo, step - modulo);
      return modulo <= FLOAT_EPSILON;
    }
  }
  return modulo === 0;
}

function roundToDecimalCount(value, decimalCount) {
  if (value == null) return value;

  // (154.462000008, -2) => 200
  // (154.462000008, -1) => 150
  // (154.462000008, 0) => 154
  // (154.462000008, 1) => 154.5
  // (154.462000008, 2) => 154.46
  // (154.462000008, 3) => 154.462
  let result;
  if (decimalCount > 0) {
    let powerOfTen = Math.pow(10, decimalCount);
    let [integer, decimals = ""] = (Math.round(value * powerOfTen) / powerOfTen + "").split("."); // can get tiny offset due to floats in decimals ("462000008" instead of "462")
    result = Number(integer + "." + (decimals.slice(0, decimalCount) || "0"));
  } else {
    let powerOfTen = Math.pow(10, -decimalCount);
    result = Math.round(value / powerOfTen) * powerOfTen;
  }
  return result;
}

function roundToStepDecimalCount(value, step) {
  let stepDecimalCount;
  if (step != null && step !== 0) {
    let [integer, decimals = ""] = (step + "").split(".");
    stepDecimalCount = decimals.length;
    if (stepDecimalCount === 0) stepDecimalCount = integer.length - integer.replace(/0+$/, "").length;
  }
  return roundToDecimalCount(value, stepDecimalCount);
}

function getInputComponentColorScheme(colorScheme = "building") {
  // Internal components, such as date pickers and select boxes, use the "primary" colorScheme for input with the "building" colorScheme.
  if (colorScheme === "building") return "primary";
  return colorScheme;
}

export {
  validateQuarterInputValue,
  parseQuarterToObject,
  validateMonthInputValue,
  validateYearInputValue,
  validateStep,
  normalizeValidatorResult,
  sortErrorList,
  getPlaceholderStyles,
  getFormValue,
  getFormItemMap,
  getStackInfo,
  ERROR_FEEDBACK,
  FORM_ITEM_PUBLIC_STATE_PROPS,
  getValidDateTime,
  getDaysDiff,
  getInputComponentColorScheme,
  roundToDecimalCount,
  roundToStepDecimalCount,
};
