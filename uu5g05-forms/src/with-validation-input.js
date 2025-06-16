//@@viewOn:imports
import {
  createComponent,
  PropTypes,
  useEffect,
  Utils,
  useRef,
  useUpdateEffect,
  usePreviousValue,
  useState,
  useCallback,
} from "uu5g05";
import Config from "./config/config.js";
import useValidatorMap from "./use-validator-map.js";
import useFocus from "./_internal/use-focus.js";
import { ERROR_FEEDBACK, getStackInfo } from "./_internal/tools.js";
//@@viewOff:imports

const BLOCK_EVENT_FN = (e) => e.preventDefault();
const EMPTY_FN = () => {};

let warnedAccessingResultAsIfArray;

//@@viewOn:helpers
function withFocusedInput(Input) {
  return ({ elementRef, onFocus, onBlur, autoFocus, ...propsToPass }) => {
    const { disabled, type } = propsToPass;
    const prevType = usePreviousValue(type, type);

    const ref = useRef();
    const [focus, handleFocus, handleBlur] = useFocus({ onFocus, onBlur, disabled });

    // because of showing calendar on mobile by first click on input
    useEffect(() => {
      if (type !== prevType && focus) {
        // click and focus are also for mobile usage to automatically open picker
        // NOTE For unknown reason, using `focus({ preventScroll: true })` doesn't prevent the scroll
        // in scenario where we submitted form and there is invalid DateInput which we try to re-focus (without
        // scroll) and then smooth-scroll it into view.
        let scrollTop = document.scrollingElement?.scrollTop;
        ref.current.focus({ preventScroll: true });
        if (document.scrollingElement?.scrollTop !== scrollTop) {
          document.scrollingElement.scrollTop = scrollTop;
        }
        ref.current.click();
      }
    }, [type, focus]);

    // must be here, because if input is re-mount, autoFocus is used again, so it is not possible to blur input
    const autoFocusRef = useRef(autoFocus);
    useEffect(() => {
      autoFocusRef.current = false;
    }, []);

    return (
      <Input
        {...propsToPass}
        key={type || "text"}
        autoFocus={autoFocusRef.current}
        onFocus={handleFocus}
        onBlur={handleBlur}
        elementRef={Utils.Component.combineRefs(elementRef, ref)}
      />
    );
  };
}

function isValidValueDefault(value) {
  return value != null && value !== "" && (!Array.isArray(value) || value.length > 0);
}
//@@viewOff:helpers

// FIXME: should be up - it should create final component, because it it registered to form!!! So when some component
// use this component as a part of whole behaviour, it will be registered more times!!!
function withValidationInput(Input, isValidValue = isValidValueDefault) {
  const FocusedInput = withFocusedInput(Input);

  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withValidationInput(${Input.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Input.propTypes,
      value: PropTypes.any, // original unformatted value from top-level *Input component
      onValidationStart: PropTypes.func,
      onValidationEnd: PropTypes.func,
      onValidate: PropTypes.func,
      validateOnChange: PropTypes.bool,
      validateOnMount: PropTypes.bool,
      validationRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),

      // TODO renamed to formattedValue, because it could be maybe used in creating input
      _formattedValue: PropTypes.string, // props.value formatted to a string (e.g. number with localized separators)
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      value: undefined,
      onValidationEnd: undefined,
      onValidate: undefined,
      onValidationStart: undefined,
      validateOnChange: false,
      validateOnMount: true,
      validationRef: undefined,

      _formattedValue: undefined,
      ...Input.defaultProps,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const {
        onValidationEnd,
        onValidate: propsOnValidate,
        onBlur,
        onChange,
        onValidationStart,
        validateOnChange,
        validateOnMount,
        validationRef,
        elementAttrs,
        type,
        _formattedValue,
        ...otherProps
      } = props;
      const { value, required, readOnly } = otherProps;

      const onValidate = useValidatorMap(props, {
        required: (value) => !required || isValidValue(value),
      });

      //const onValidate = useValidatorMap(props, {}); // required to call because props.onValidate may be not "our", i.e. we need to turn it into async custom validator

      const validationRunIdRef = useRef();
      const _validate = useCallback(
        async (validatorFilter = null, type) => {
          // NOTE Using callback instead of simple await so that if there's an error in synchronous validator,
          // onValidationEnd would run synchronously too (e.g. suitable for Jest tests).
          let id = Utils.String.generateId();
          validationRunIdRef.current = id;
          let resolve;
          let reject;
          let promise = new Promise((res, rej) => ((resolve = res), (reject = rej)));
          if (typeof onValidationStart === "function") {
            let eventData = {};
            Object.defineProperty(eventData, "_promise", { value: promise }); // see NOTE below
            let event = new Utils.Event(eventData);
            onValidationStart(event);
          }
          let isSync = true;
          let result = onValidate({ validatorFilter, type }, (validationResult) => {
            // TODO Next major - return object. For backward compatibility we must be returning array but
            // we want { valid: ..., errorList: ... } now.
            //   => return array but add { valid, errorList } keys so that it can be used as object
            let promiseResult = [...validationResult.errorList];
            Object.assign(promiseResult, validationResult);
            resolve(promiseResult);
            resolve = null;
            // NOTE We want onValidationEnd to fire even if we're unmounted - this is for case where
            // wizard uses several tabs / steps and user activates another tab (the 1st tab gets validated
            // but we show new tab ASAP, i.e. that validation runs on background and could finish with
            // its components already unmounted; yet we need to know the result of that validation for Form.Provider
            // - it'll know the result thanks to _promise that we sent to onValidationStart).
            if (id === validationRunIdRef.current) {
              if (typeof onValidationEnd === "function") {
                if (isSync) {
                  onValidationEnd(new Utils.Event(validationResult));
                } else {
                  // NOTE We'll flush call to onValidationEnd because FormProvider currently assumes that React already
                  // committed everything after validations.
                  Utils.Dom.flushSync(() => {
                    onValidationEnd(new Utils.Event(validationResult));
                  });
                }
              }
            }
            if (process.env.NODE_ENV !== "production") {
              let firstItem = promiseResult?.[0];
              Object.defineProperty(promiseResult, "0", {
                get: () => {
                  if (!warnedAccessingResultAsIfArray) {
                    warnedAccessingResultAsIfArray = true;
                    let stackInfo = getStackInfo("with-validation-input.js");
                    Utils.LoggerFactory.get("Uu5Forms.withValidationInput").warn(
                      `Deprecated usage of input validation result detected - work with the result as with object, not as an array:\n\n(bad): \`const errorList = await validationRef.current()\`\n(ok):  \`const { valid, errorList } = await validationRef.current()\`${
                        stackInfo ? "\n" + stackInfo : ""
                      }`,
                    );
                  }
                  return firstItem;
                },
              });
            }
            return promiseResult;
          });
          isSync = false;
          return result.catch((e) => {
            if (resolve !== null) reject(e); // callback was not called (or an error happened after resolve() call)
            return Promise.reject(e);
          });
        },
        [onValidate, onValidationEnd, onValidationStart],
      );
      const validate = useCallback((filter) => _validate(filter, undefined), [_validate]);

      const handleChange = onChange
        ? (e) => {
            // HTML Constraints API triggers onChange with value==="" if value is unparsable => change it to null
            if (e.target?.validity?.badInput) e.data.value = null;
            if (e.data.value !== value && typeof onChange === "function") onChange(e);
          }
        : onChange;

      const handleBlur = onValidationEnd
        ? (e) => {
            !readOnly && _validate(undefined, "blur");
            typeof onBlur === "function" && onBlur(e);
          }
        : onBlur;

      useEffect(() => {
        if (typeof validationRef === "function") {
          validationRef(validate);
          return () => validationRef(undefined);
        } else if (validationRef) {
          validationRef.current = validate;
          return () => (validationRef.current = undefined);
        }
        // eslint-disable-next-line uu5/hooks-exhaustive-deps
      }, [validate, validationRef]);

      // validate on mount
      // NOTE Validation is postponed by 1 effect because if we ran it immediately, it would get executed
      // sooner than FormXyz components get registered into Form component (and thus onValidate event
      // would have empty event.data.form.value).
      const [validateOnMountLocked, setValidateOnMountLocked] = useState(true);
      useEffect(() => {
        if (validateOnMount) setValidateOnMountLocked(false);
        // eslint-disable-next-line uu5/hooks-exhaustive-deps
      }, []);
      useEffect(() => {
        if (!validateOnMountLocked) _validate((validatorItem) => !validatorItem.skipInitial, "mount");
        // eslint-disable-next-line uu5/hooks-exhaustive-deps
      }, [validateOnMountLocked]);

      // validate if value changed (synchronous validators only)
      let revalidateRef = useRef();
      revalidateRef.current = null;
      useUpdateEffect(() => {
        if (validateOnChange) {
          revalidateRef.current = { type: "change" };
        }
      }, [value, validateOnChange]);

      // validate if validators changed (all validators except "required")
      useUpdateEffect(() => {
        revalidateRef.current = {
          type: "validatorChange",
          ...revalidateRef.current,
          filters: [
            ...(revalidateRef.current?.filters || []),
            (validatorItem) => validatorItem._skipOnValidatorsChangeTmpFlag === false || !validatorItem.skipInitial,
          ],
        };
      }, [onValidate]);

      useEffect(() => {
        if (revalidateRef.current) {
          const { type, filters } = revalidateRef.current;
          _validate(
            filters && filters.length > 0
              ? (validatorItem) => {
                  for (let filter of filters) {
                    if (!filter(validatorItem)) return false;
                  }
                  return true;
                }
              : undefined,
            type,
          );
        }
      });

      if (type !== undefined) {
        otherProps.type = _formattedValue != null ? "text" : type;
      }
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <FocusedInput
          {...otherProps}
          value={
            _formattedValue != null
              ? _formattedValue
              : typeof type === "string"
                ? value == null
                  ? ""
                  : value + ""
                : value
          }
          elementAttrs={{ ...elementAttrs, onInvalid: BLOCK_EVENT_FN }}
          onChange={handleChange || EMPTY_FN} // so that input is always controlled
          onBlur={handleBlur}
        />
      );
      //@@viewOff:render
    },
  });
}

export { withValidationInput, isValidValueDefault };
export default withValidationInput;
