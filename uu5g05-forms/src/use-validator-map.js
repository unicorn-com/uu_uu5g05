import { useRef, Utils } from "uu5g05";
import { ERROR_FEEDBACK, normalizeValidatorResult, sortErrorList } from "./_internal/tools.js";
import useStableMemo from "./_internal/use-stable-memo.js";

function useValidatorMap(props, validatorItemMap = {}, options = {}) {
  let items = Object.keys(validatorItemMap).map((code) => {
    let item = validatorItemMap[code];
    if (!item || typeof item !== "object") item = { validator: item };
    let autoDependencies = [props[code], props.validationMap?.[code]];
    return {
      skipInitial: code.startsWith("required"),
      ...item,
      // TODO We pass just 'value' to validator functions. Only onValidate will get full event.
      // Think through if useValidatorMap goes to API.
      validator: (value, extraEventData) => item.validator(value),
      code,
      deps: item.dependencies ? item.dependencies.concat(autoDependencies) : autoDependencies,
      getResultOpts: (errorCode) => ({ ...props.validationMap?.[code], messageParams: [props[code]] }), // ignore errorCode (in-component validators should always use their own "code"; only onValidate can return arbitrary error code - see below)
    };
  });
  return useValidator(props.onValidate, props.value, props.validationMap, items, options);
}

const validationItemsSymbol = Symbol();
const validationFinalFlagSymbol = Symbol();

function useValidator(onValidate, value, validationMap, newValidationItems, options) {
  let lockedResult;
  let newDeps = [];
  let existingValidationItems = [];
  if (typeof onValidate === "function") {
    if (onValidate[validationFinalFlagSymbol]) {
      // locked (no additional validators are allowed to be added) => return current
      lockedResult = onValidate;
    } else {
      if (onValidate[validationItemsSymbol]) {
        newDeps.push(onValidate);
        existingValidationItems = onValidate[validationItemsSymbol];
      } else {
        // we don't want to revalidate if developer-provided props.onValidate changes => don't add it as "deps"
        newValidationItems.unshift({
          code: "onValidate",
          async: true,
          validator: (value, extraEventData) => onValidate(new Utils.Event({ ...extraEventData, value })),
          deps: [],
          getResultOpts(errorCode) {
            return errorCode ? validationMap?.[errorCode] : undefined;
          },
        });
      }
    }
  }

  let currentValuesRef = useRef();
  if (!lockedResult) {
    for (let { code, deps } of newValidationItems) newDeps = newDeps.concat([code], deps || []);

    let validators = {};
    let allValidationItems = [...existingValidationItems];
    for (let item of newValidationItems) {
      validators[item.code] = (extraEventData) => item.validator(value, extraEventData);
      allValidationItems.unshift({
        async: false,
        ...item,
        validator: (...args) => currentValuesRef.current.validators[item.code]?.(...args),
      });
    }
    currentValuesRef.current = { onValidate, allValidationItems, validators };
  }

  // we want resulting onValidate to change its reference only if dependencies change (not when e.g. value changes),
  // because reference change is considered as "constraints changed" and therefore revalidation will be triggerred
  let resultOnValidate = useStableMemo(() => {
    if (!lockedResult) {
      const { allValidationItems } = currentValuesRef.current;
      const uniqueValidationItems = getUniqueValidationItems(allValidationItems);
      let result = async function run(opts = {}, callback = null) {
        return runValidations(uniqueValidationItems, opts, callback);
      };
      result[validationItemsSymbol] = uniqueValidationItems;
      return result;
    }
  }, newDeps);

  if (!lockedResult) {
    if (options?.final) {
      resultOnValidate[validationFinalFlagSymbol] = true;
    } else {
      delete resultOnValidate[validationFinalFlagSymbol];
    }
  }

  return lockedResult || resultOnValidate;
}

function getUniqueValidationItems(allValidationItems = []) {
  const uniqueMap = allValidationItems.reduce((map, item) => {
    map.set(item.code, item);
    return map;
  }, new Map());

  return [...uniqueMap.values()];
}

async function runValidations(items, opts, callback = null) {
  const { validatorFilter = null, ...extraEventData } = opts;
  let errorList = [];
  // badValue validation must be first (value might be not parsable and running other validators then makes no sense)
  for (let item of items) {
    if (item.code !== "badValue") continue;
    if (item.async) throw new Error("Validator with code 'badValue' can be only synchronous.");
    let validatorResult = item.validator(extraEventData);
    if (typeof validatorResult?.then === "function") validatorResult = await validatorResult;
    errorList = errorList.concat(normalizeValidatorResult(validatorResult, item));
  }
  if (errorList.every((it) => it.feedback !== ERROR_FEEDBACK)) {
    // sync validations
    for (let item of items) {
      if (item.async || item.code === "badValue") continue;
      if (validatorFilter && !validatorFilter(item)) continue;
      let validatorResult = item.validator(extraEventData);
      if (typeof validatorResult?.then === "function") validatorResult = await validatorResult;
      errorList = errorList.concat(normalizeValidatorResult(validatorResult, item));
    }
    // async validation
    if (errorList.every((it) => it.feedback !== ERROR_FEEDBACK)) {
      for (let item of items) {
        if (!item.async || item.code === "badValue") continue;
        if (validatorFilter && !validatorFilter(item)) continue;
        let validatorResult = item.validator(extraEventData);
        if (typeof validatorResult?.then === "function") validatorResult = await validatorResult;
        errorList = errorList.concat(normalizeValidatorResult(validatorResult, item));
      }
    }
  }

  errorList = sortErrorList(errorList);

  let result = { errorList, valid: errorList[0]?.feedback !== ERROR_FEEDBACK };
  return typeof callback === "function" ? callback(result) : result;
}

export { useValidatorMap };
export default useValidatorMap;
