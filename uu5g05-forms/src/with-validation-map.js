//@@viewOn:imports
import { createComponent, PropTypes, useMemoObject, Utils } from "uu5g05";
import Config from "./config/config.js";
import useStableMemo from "./_internal/use-stable-memo.js";
import useValidatorMap from "./use-validator-map.js";

//@@viewOff:imports

function withValidationMap(Input, defaultValidationMap = {}) {
  return _withValidationMap(Input, defaultValidationMap, true);
}

function _withValidationMap(Input, defaultValidationMap, _initValidatorList) {
  const ResultInput = createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withValidationMap(${Input.uu5Tag || Input.displayName})`,
    validationMap: defaultValidationMap,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Input.propTypes,
      validationMap: PropTypes.shape(
        Object.fromEntries(
          Object.keys(defaultValidationMap).map((k) => [
            k,
            PropTypes.shape({
              message: PropTypes.lsi,
              feedback: PropTypes.oneOf(["error", "warning"]),
            }),
          ]),
        ),
      ),
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Input.defaultProps,
      validationMap: undefined,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { validationMap, ...otherProps } = props;

      // compute final validation map and memoize it because changes in validationMap cause re-validation
      let propValidationMap = useMemoObject(validationMap);
      let sources = [defaultValidationMap, ResultInput.validationMap, propValidationMap];
      let mergedValidationMap = useStableMemo(() => {
        let result;
        for (let map of sources) {
          if (!result) result = map;
          else if (map && result !== map) result = mergeValidationMaps(result, map);
        }
        return result;
      }, sources);

      const onValidate = _initValidatorList ? useValidatorMap(props) : props.onValidate;
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return <Input {...otherProps} validationMap={mergedValidationMap} onValidate={onValidate} />;
      //@@viewOff:render
    },
  });

  return ResultInput;
}

//@@viewOn:helpers
function mergeValidationMaps(a, b) {
  let result = {};
  for (let type in a) {
    if (!(type in b)) {
      result[type] = a[type];
    } else {
      // shallow, except for "message" key
      result[type] = { ...a[type], ...b[type] };
      result[type].message = mergeLsiObjects(a[type]?.message, b[type]?.message);
    }
  }
  for (let type in b) {
    if (type in a) continue; // already processed
    result[type] = b[type];
  }
  return result;
}

function mergeLsiObjects(fallbackLsi, mainLsi) {
  if (!fallbackLsi || !mainLsi) return mainLsi || fallbackLsi;
  let result;
  if (!fallbackLsi.import && !mainLsi.import) {
    result = { ...fallbackLsi, ...mainLsi };
  } else {
    result = mergeLsiObjectsWithImports(fallbackLsi, mainLsi);
  }
  return result;
}

// TODO This creates new "importLsi()" method at each call, which is then stored in useLazyLsi's lsiStore,
// without cleaning itself up when it's no longer needed. Maybe the useLazyLsi should use WeakMap with the import
// function as a key?
let idCounter = 0;
function mergeLsiObjectsWithImports(fallbackLsi, mainLsi) {
  let resultImport = async (language) => {
    let mainLsiLoaded = typeof mainLsi.import === "function" ? (await mainLsi.import(language))?.default : mainLsi;
    let mainIsUsingPath = typeof mainLsi.import === "function";
    let mainFinalValue = mainIsUsingPath
      ? getFieldByPath(mainLsiLoaded, mainLsi.path)
      : Utils.Language.getItem(mainLsiLoaded, language);
    let fallbackLsiLoaded =
      typeof fallbackLsi.import === "function" ? (await fallbackLsi.import(language))?.default : fallbackLsi;
    let fallbackIsUsingPath = typeof fallbackLsi.import === "function";
    let fallbackFinalValue = fallbackIsUsingPath
      ? getFieldByPath(fallbackLsiLoaded, fallbackLsi.path)
      : Utils.Language.getItem(fallbackLsiLoaded, language);
    let result = { mergedValue: mainFinalValue || fallbackFinalValue };
    return { default: result }; // must wrap into "default" key as that what useLazyLsi expects
  };
  let id = idCounter++;
  resultImport.libraryCode = `uu5g05-forms (merge of ${
    mainLsi?.import?.libraryCode ? mainLsi.import.libraryCode + "[" + mainLsi.path + "]" : "<direct lsi object>"
  } and ${
    fallbackLsi?.import?.libraryCode
      ? fallbackLsi.import.libraryCode + "[" + fallbackLsi.path + "]"
      : "<direct lsi object>"
  }, id-${id})`; // must have unique name because it serves as a cache-scope too in useLazyLsi
  Utils.Lsi.setDefaultLsi(resultImport.libraryCode, {});
  let result = { import: resultImport, path: ["mergedValue"] };
  return result;
}
function getFieldByPath(obj, path) {
  let result = obj;
  for (let i = 0; i < path.length && result !== undefined; i++) result = result?.[path[i]];
  return result;
}

//@@viewOff:helpers

export { withValidationMap, _withValidationMap };
export default withValidationMap;
