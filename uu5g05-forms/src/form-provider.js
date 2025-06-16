//@@viewOn:imports
import {
  createComponent,
  PropTypes,
  useEffect,
  useUnmountedRef,
  Utils,
  useRef,
  useMemo,
  useRouteLeave,
  useDevice,
  useLsiValues,
  useLsi,
  useValueChange,
  useCallback,
} from "uu5g05";
import Config from "./config/config.js";
import FormContext from "./_internal/form-context.js";
import FormFormContext from "./_internal/form-form-context.js";
import FormItemContext from "./_internal/form-item-context.js";
import FormUnhandledError from "./form-unhandled-error.js";
import { getFormItemMap, getFormValue, normalizeValidatorResult, sortErrorList } from "./_internal/tools.js";
import { _withValidationMap } from "./with-validation-map.js";
import useComplexState from "./_internal/use-complex-state.js";
import State, {
  INITIAL_FORM_ITEM,
  SYMBOL_INTERNAL,
  processReset,
  processSetItemState,
  processSetItemValue,
} from "./form-provider-state.js";
import importLsi from "./lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const ERROR_FEEDBACK = "error";

const DEFAULT_LSI = {
  submitFailed: { import: importLsi, path: ["Form", "submitFailed"] },
  accessDenied: { import: importLsi, path: ["Validation", "accessDenied"] },
  invalidDtoIn: { import: importLsi, path: ["Validation", "invalidDtoIn"] },
};

// !!! Do not use useState() in this file (so that we properly support props-controlled variant of FormProvider), use useNamedState instead.
const useState = null; // eslint-disable-line no-unused-vars
//@@viewOff:constants

//@@viewOn:helpers
function getVisualProps(props) {
  const visualProps = {};
  Config.FORM_ITEM_VISUAL_PROPS.forEach((prop) => {
    if (props[prop] !== undefined) visualProps[prop] = props[prop];
  });
  return visualProps;
}

function handleSubmitReentrancy(
  submitChainRef,
  submitButtonComponentElementRef,
  nativeSubmitButtonElementRef,
  e,
  mountedOnly,
) {
  // submit re-entrancy:
  // - if user pressed Enter, then Form.View will call submit(). At this point we don't actually know, whether
  //   we want submit() or submitStep() => try clicking SubmitButton if there's one in the Form (the button will know
  //   whether to call submit() or submitStep() or use developer-specified onClick with event.preventDefault() and developer's
  //   own submit()/submitStep() call)
  // - in all other cases also do native <form> submit via <input type="submit"> (nativeSubmitButtonElementRef)
  //   so that values for autofill get saved by browser
  //
  // a) developer calls submit() -> nativeSubmitButtonElementRef.click() -> submit("submit")
  // b) Enter in input -> submit("submit") -> submitButtonComponentElementRef.click() ->
  //      might call submit() or submitStep() or nothing (if developer does event.preventDefault() and doesn't call submit() himself) ->
  //      nativeSubmitButtonElementRef.click() -> submit("submit")
  // c) user clicks SubmitButton -> submit("click") -> nativeSubmitButtonElementRef.click() -> submit("submit")

  let doReturn;
  if (!submitChainRef.current) {
    let resolve, reject;
    let promise = new Promise((res, rej) => ((resolve = res), (reject = rej)));
    submitChainRef.current = {
      phase: "initial",
      submitOptions: null,
      resolve,
      reject,
      promise,
      reentrancyDepth: 0,
    };
    doReturn = () => {
      let { reentrancyDepth } = submitChainRef.current || {};
      submitChainRef.current = null;
      return reentrancyDepth ? promise.catch((e) => null) : promise;
    };
  }
  const submitChainInfo = submitChainRef.current;
  if (!doReturn) {
    doReturn = () =>
      submitChainInfo.reentrancyDepth ? submitChainInfo.promise.catch((e) => null) : submitChainInfo.promise;
  }

  if (e?.type === "submit") {
    submitChainInfo.isNestedInSubmitEvent = true;
  }
  if (!submitChainInfo.submitOptions && e?.type !== "submit") {
    submitChainInfo.submitOptions = { mountedOnly };
  }
  const { resolve, reject } = submitChainInfo;
  if (submitChainInfo.phase === "initial") {
    submitChainInfo.phase = "submitButtonComponent";
    // click on SubmitButton component only if submitChain was started by Enter (i.e. native "submit" event)
    if (submitButtonComponentElementRef.current && submitChainInfo.isNestedInSubmitEvent) {
      if (!submitButtonComponentElementRef.current.disabled) {
        submitChainInfo.reentrancyDepth++;
        submitButtonComponentElementRef.current.click(); // this will call submit again, or possibly do preventDefault() in developer's onClick (and possibly call submitStep() there as well)
        submitChainInfo.reentrancyDepth--;
        if (submitChainInfo.phase === "submitButtonComponent") {
          // submit got interrupted by e.preventDefault() in SubmitButton (without calling submit/submitStep() in developer's onClick) => simply stop
          reject(new Error("Form submit prevented in SubmitButton."));
        }
      } else {
        const error = new Error("Form submit prevented as SubmitButton is disabled (another input is likely invalid).");
        error.code = "abortSubmitButtonDisabled";
        reject(error);
      }
      return { shouldReturn: true, doReturn };
    }
  }
  if (submitChainInfo.phase === "submitButtonComponent") {
    submitChainInfo.phase = "nativeFormSubmit";
    // click on native <input type="submit"> so that browser stores values in autofill storage
    // (note that if we're already nested in native "submit" event, clicking the <input> would do nothing so skip in such case)
    if (!submitChainInfo.isNestedInSubmitEvent && nativeSubmitButtonElementRef.current) {
      submitChainInfo.reentrancyDepth++;
      nativeSubmitButtonElementRef.current.click();
      submitChainInfo.reentrancyDepth--;
      if (submitChainInfo.phase === "nativeFormSubmit") {
        // this should never happen (unless Form.View implementation is broken)
        reject(new Error("Form submit got interrupted during native DOM <form> submit event."));
      }
      return { shouldReturn: true, doReturn };
    }
  }
  if (submitChainInfo.phase === "nativeFormSubmit") {
    submitChainInfo.phase = "final";
  }
  if (submitChainInfo.phase === "final") {
    if (submitChainInfo.submitProcessed) return { shouldReturn: true, doReturn };
    submitChainInfo.submitProcessed = true;
  }

  return { doReturn, submitOptions: { ...submitChainInfo.submitOptions, resolve, reject } };
}

// lsi = { [path]: string }
function getMessageFromLsi(lsi, path, params) {
  let value = lsi;
  for (let i = 0; i < path.length; i++) {
    // 1st level of `lsi` can contain "*" character, e.g. "*/invalidDtoIn"
    value = i === 0 ? Utils.Object.matchByKey(value, path[i]) : value?.[path[i]];
    if (value == null) break;
  }

  if (value && params) value = Utils.String.format(value, ...params);
  return value;
}

function setErrorToInputs(error, setItemState, lsiError) {
  // in case of Error.Message, original error is in the "cause"
  const errCode = error.code ?? error.cause?.code;

  const paramMap = error.paramMap ?? error.cause?.paramMap;
  if (paramMap) {
    const errorMap = {};
    ["missingKeyMap", "invalidTypeKeyMap", "invalidValueKeyMap", "invalidKeyMap"].forEach((errKey) => {
      Object.keys(paramMap?.[errKey] ?? {}).forEach((k) => {
        const [, ...keys] = k.split(".");
        const name = keys.join(".");
        if (name) {
          const errors = paramMap[errKey][k];
          errorMap[name] ??= [];
          errorMap[name].push(
            ...Object.keys(errors).map((code) => ({
              code,
              feedback: "error",
              message: (lsiError ? getMessageFromLsi(lsiError, [errCode, code]) : undefined) ?? errors[code], // TODO add params after https://uuapp.plus4u.net/uu-sls-maing01/3f1ef221518d49f2ac936f53f83ebd84/issueDetail?id=667565a763b8680035e2570c
            })),
          );
        }
      });
    });
    for (let name in errorMap) {
      setItemState(name, { errorList: errorMap[name] });
    }
  }
}

function _toErrorMessage(msg, error, lsi) {
  let result;
  if (!error || error instanceof Utils.Error.Message || error instanceof FormUnhandledError) {
    result = error ?? null;
  } else if (msg) {
    result = new Utils.Error.Message(msg, error);
  } else if (error.code?.endsWith("/accessDenied")) {
    result = new Utils.Error.Message(lsi.accessDenied, error);
  } else if (error.code?.endsWith("/invalidDtoIn")) {
    result = new Utils.Error.Message(lsi.invalidDtoIn, error);
  } else {
    result = new Utils.Error.Message(lsi.submitFailed, error);
  }
  return result;
}

//@@viewOff:helpers

let FormProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "FormProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onSubmit: PropTypes.func,
    onSubmitted: PropTypes.func,
    onValidate: PropTypes.func,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    size: PropTypes.string,
    borderRadius: PropTypes.string,
    layout: PropTypes.string,
    messagePosition: PropTypes.string,
    autoComplete: PropTypes.bool,
    disableLeaveConfirmation: PropTypes.bool,
    preserveValueOnUnmount: PropTypes.bool,
    initialValue: PropTypes.object,
    lsi: PropTypes.object,
    lsiError: PropTypes.oneOfType([
      PropTypes.shape({
        import: PropTypes.func,
        path: PropTypes.arrayOf(PropTypes.string),
      }),
      PropTypes.object,
    ]), //{ import, path } || { [path]: lsiObject }
    state: PropTypes.object,
    onStateChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onSubmit: undefined,
    onSubmitted: undefined,
    onValidate: undefined,
    disabled: undefined,
    messagePosition: undefined,
    autoComplete: true,
    disableLeaveConfirmation: false,
    preserveValueOnUnmount: false,
    initialValue: undefined,
    lsi: DEFAULT_LSI,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      children,
      onSubmit,
      onSubmitted,
      onValidate,
      disableLeaveConfirmation,
      preserveValueOnUnmount,
      initialValue,
      lsi,
      lsiError,
      state,
      onStateChange,
    } = props;
    const unmountedRef = useUnmountedRef();

    const [formState, setFormState] = useValueChange(
      (state || new FormProvider.State(initialValue))[SYMBOL_INTERNAL],
      typeof onStateChange === "function"
        ? (newFormState) => {
            let state = new FormProvider.State();
            state[SYMBOL_INTERNAL] = newFormState;
            onStateChange(new Utils.Event({ state }));
          }
        : undefined,
    );
    // NOTE We support controlled FormProvider via props.state.
    //   props.state -> instance of FormProvider.State()
    //   formState -> props.state[SYMBOL_INTERNAL], i.e. simple map with sub-states: { submitOptions: null, isSubmittingButEnabled: false, ... }
    // useNamedState is then just hook which is same as useState() but with name so that when value setter is called, it updates the appropriate key in formState
    const { useNamedState } = useComplexState(formState, setFormState);

    const { isMobileOrTablet } = useDevice();
    const [submitOptions, setSubmitOptions] = useNamedState("submitOptions", null);
    const isSubmitting = !!submitOptions;
    const [isSubmittingButEnabled, setIsSubmittingButEnabled] = useNamedState("isSubmittingButEnabled", false);
    const [errorList, setErrorList] = useNamedState("errorList", []); // errors from form's own props.onValidate()
    const [submitError, setSubmitError] = useNamedState("submitError"); // error from props.onSubmit()
    const [submitCallResult, setSubmitCallResult] = useNamedState("submitCallResult"); // result from last submit() operation

    const [submitScrollTo, setSubmitScrollTo] = useNamedState("submitScrollTo", {}); // { inputRef }
    useEffect(() => {
      const { inputRef: submitScrollToRef } = submitScrollTo;
      if (submitScrollToRef?.current) {
        // must be in setTimeout because some inputs (DateInput) do re-mount when they get focused
        // (which will happen in effect below, which would interrupt our scroll); and that's also
        // reason why we remember inputRef instead of element (element will change during remount)
        setTimeout(() => {
          submitScrollToRef?.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "start" });
        }, 0);
      }
    }, [submitScrollTo]);

    const [{ elementToFocus }, setSubmitFocus] = useNamedState("submitFocus", {}); // { elementToFocus, focusedElementAtSubmit, focusedInputRefAtSubmit }
    useEffect(() => {
      if (elementToFocus && !isMobileOrTablet) {
        // move focus back only if developer didn't focus something else at the end of submit
        if (document.activeElement === document.body) {
          elementToFocus.focus({
            preventScroll: submitScrollTo.inputRef && submitScrollTo.inputRef.current === elementToFocus ? true : false,
          });
        }
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [elementToFocus, isMobileOrTablet]);

    const disabled = props.disabled || (isSubmitting && !isSubmittingButEnabled) || false;

    const [formItem, setFormItem] = useNamedState("formItem", INITIAL_FORM_ITEM);

    const setFormItemData = useCallback(
      (name, data) => {
        setFormItem(({ itemMap, ...other }) => {
          const newItemMap = {
            ...itemMap,
            [name]: { ...itemMap[name], ...data },
          };
          return {
            ...other,
            itemMap: newItemMap,
            dirty: other.dirty || (data && "value" in data ? itemMap[name]?.value !== data.value : false),
          };
        });
      },
      [setFormItem],
    );

    const onItemChange = useCallback(
      (name, e) => {
        setFormItemData(name, { value: e.data.value, errorList: [], lastValidationPromise: undefined });
      },
      [setFormItemData],
    );
    const onItemValidationEnd = useCallback(
      (name, e) => {
        setFormItemData(name, { errorList: e.data?.errorList, pending: false, lastValidationPromise: undefined });
      },
      [setFormItemData],
    );
    const onItemValidationStart = useCallback(
      (name, e) => {
        setFormItemData(name, { pending: true, lastValidationPromise: e.data._promise });
      },
      [setFormItemData],
    );

    const addItem = useCallback(
      (name, itemState) => {
        setFormItem(({ itemMap, ...other }) => {
          if (itemMap[name]?.mounted) {
            FormProvider.logger.error(`Duplicit name of form input - '${name}'. Form input names must be unique.`);
          }
          let result = {
            ...other,
            itemMap: { ...itemMap, [name]: { ...itemState, mounted: true } },
          };
          return result;
        });
      },
      [setFormItem],
    );

    const removeItem = useCallback(
      (name) => {
        if (preserveValueOnUnmount) {
          setFormItem((prevState) => {
            const { itemMap } = prevState;
            const itemState = itemMap[name];
            if (!itemState) return prevState;
            return {
              ...prevState,
              itemMap: {
                ...itemMap,
                [name]: {
                  value: itemState.value,
                  initialValue: itemState.initialValue,
                  errorList: itemState.errorList,
                  lastValidationPromise: itemState.lastValidationPromise,
                  mounted: false,
                },
              },
            };
          });
        } else {
          setFormItem(({ itemMap: { [name]: _, ...itemMap }, ...other }) => ({ ...other, itemMap }));
        }
      },
      [preserveValueOnUnmount, setFormItem],
    );

    // allow updating only subset of attributes
    const updateItem = useCallback(
      (name, { initialValue }) => {
        setFormItemData(name, { initialValue });
      },
      [setFormItemData],
    );

    const setItemValue = useCallback(
      (name, value) => {
        setFormItem((formItem) => processSetItemValue(formItem, name, value));
      },
      [setFormItem],
    );

    const setItemState = useCallback(
      (name, itemState) => {
        setFormItem((formItem) => processSetItemState(formItem, name, itemState));
      },
      [setFormItem],
    );

    const currentValuesRef = useRef();
    currentValuesRef.current = { formItem, setItemState, _submit, _validate, _reset, _cancel };

    const [allowLeaveUnsaved, setAllowLeaveUnsaved] = useNamedState("allowLeaveUnsaved", false);

    const fullLsi = { ...DEFAULT_LSI, ...lsi };

    const lazyLsiError = useLsi(lsiError?.import ? lsiError : undefined);
    const valuesLsiError = useLsiValues(lsiError?.import ? undefined : lsiError);
    const fullLsiError = lazyLsiError ?? (Object.keys(valuesLsiError).length ? valuesLsiError : undefined) ?? lsiError;

    useEffect(() => {
      if (isSubmitting) {
        let { mountedOnly, resolve, reject } = submitOptions;
        let submitCallResult;
        let submitError;
        let submitResult;
        (async function () {
          let valid, value, itemMap, errorList;
          try {
            ({ valid, value, itemMap, errorList } = await _validate(mountedOnly, true));
            if (valid && !mountedOnly) {
              try {
                let submitPromise;
                Utils.Dom._batchedUpdates(() => {
                  setAllowLeaveUnsaved(true); // in case that props.onSubmit tries to move away after successful submit
                  submitPromise = onSubmit(new Utils.Event({ value }));
                });
                submitResult = await submitPromise;
              } catch (e) {
                setAllowLeaveUnsaved(false);
                submitError = e;
                if (!(e instanceof Utils.Error.Message)) {
                  FormProvider.logger.error("Form submit failed.", submitError);
                }
              }
            }
          } finally {
            submitCallResult = { valid, value, itemMap, errorList, submitResult, submitError };
            if (!unmountedRef.current) {
              // set error/submitted state and enable items & controls
              Utils.Dom._batchedUpdates(() => {
                let scrollToInputRef;
                if (!valid && itemMap) {
                  for (let name in itemMap) {
                    let { valid } = itemMap[name];
                    if (!valid) {
                      scrollToInputRef = currentValuesRef.current.formItem.itemMap?.[name]?.inputRef;
                      if (scrollToInputRef) break;
                    }
                  }
                  if (scrollToInputRef) {
                    setSubmitScrollTo({ inputRef: scrollToInputRef });
                  }
                }

                let msg;
                if (submitError) {
                  setErrorToInputs(submitError, currentValuesRef.current.setItemState, fullLsiError);

                  const errCode = submitError.code ?? submitError.cause?.code;
                  const submitErrLsi = Utils.Object.matchByKey(fullLsiError, errCode);
                  msg = submitErrLsi?.message ?? (typeof submitErrLsi === "string" ? submitErrLsi : undefined);
                }

                setSubmitError(_toErrorMessage(msg, submitError, fullLsi));

                setSubmitCallResult({ ...submitCallResult, mountedOnly });
                setSubmitOptions(null);
                setSubmitFocus(({ focusedInputRefAtSubmit, focusedElementAtSubmit }) => {
                  let elementToFocus =
                    scrollToInputRef?.current || focusedInputRefAtSubmit?.current || focusedElementAtSubmit; // prefer inputRef because input component might have re-mounted
                  if (elementToFocus && !document.contains(elementToFocus)) elementToFocus = undefined;
                  return { elementToFocus };
                });
              });
            }
          }
          return submitCallResult;
        })().then(resolve, reject);
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [isSubmitting]);

    useEffect(() => {
      if (submitCallResult && typeof onSubmitted === "function") {
        const { value, itemMap, errorList, submitError, submitResult, valid, mountedOnly } = submitCallResult;
        if (valid && !mountedOnly) {
          const submittedData = {
            submitResult,
            form: {
              // eslint-disable-next-line no-use-before-define
              ...formApi,
              errorList,
              submitError,
              value,
              itemMap,
            },
          };
          onSubmitted(new Utils.Event(submittedData));
        }
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [submitCallResult]);

    const submitButtonComponentElementRef = useRef();
    const nativeSubmitButtonElementRef = useRef();
    const submitChainRef = useRef();
    async function _submit(mountedOnly, ...args) {
      const e = typeof args[0]?.preventDefault === "function" ? args.shift() : undefined;

      if (isSubmitting) {
        throw new Error(`Invalid submit${mountedOnly ? "Step" : ""}() call - form is already being submitted.`);
      }
      if (disabled) {
        throw new Error(`Invalid submit${mountedOnly ? "Step" : ""}() call - form is disabled.`);
      }

      const { shouldReturn, doReturn, submitOptions } = handleSubmitReentrancy(
        submitChainRef,
        submitButtonComponentElementRef,
        nativeSubmitButtonElementRef,
        e,
        mountedOnly,
      );
      if (shouldReturn) return doReturn();

      // remember currently focused element, resp. inputRef (& clear elementToFocus)
      let { activeElement } = document;
      setSubmitFocus({
        focusedElementAtSubmit: activeElement,
        focusedInputRefAtSubmit: Object.values(currentValuesRef.current.formItem.itemMap)
          .map((it) => it.inputRef)
          .find((it) => it?.current === activeElement),
      });

      // move focus elsewhere so that props.onBlur happens on input component (if submitted via Enter key)
      let tmpEl = document.createElement("button");
      tmpEl.style.cssText = "position: fixed; top: 0px; left: 0px; opacity: 0;";
      document.body.appendChild(tmpEl);
      tmpEl.focus();
      tmpEl.remove();

      setSubmitError(null);
      setSubmitCallResult(null);
      setSubmitScrollTo({});
      setErrorList([]);
      setSubmitOptions(submitOptions);
      setIsSubmittingButEnabled(false);

      return doReturn();
    }

    function _reset(mountedOnly, valueOverrideMap = {}) {
      setFormState((formState) => processReset(formState, [mountedOnly, valueOverrideMap]));
    }

    async function _validate(mountedOnly, failFast) {
      // failFast: if true, Form gets enabled as soon as 1st validation ends with an error; otherwise it gets
      // enabled only after all validations end

      let hasInvalidItem;
      let hasInvalidFailFastItem;
      let isInvalidForm;

      // validate inputs
      const failFastRejection = {};
      let itemsToValidate = Object.values(formItem.itemMap);
      if (mountedOnly) itemsToValidate = itemsToValidate.filter((it) => it.mounted);
      const validationPromiseList = itemsToValidate.map(
        async ({ value, validationRef, errorList, lastValidationPromise }) => {
          // NOTE validateItem() will trigger onValidationEnd and that's how the result will get into our formItem state
          // (we don't need to set the result to state here).
          const validateItem = validationRef?.current;
          let valid;
          if (typeof validateItem === "function") {
            ({ valid } = await validateItem());
          } else if (lastValidationPromise) {
            // if leaving a wizard step to another step, validation is run on 1st step but wizard does not wait
            // for it - the validation will finish on background and our state gets updated correctly; however, if
            // user tries to submit the wizard before this background validation ends, the submit needs to wait for that background
            // validation (it's not possible to run that validation again, because the components from 1st step are
            // no longer mounted, so we don't have validationRef anymore)
            ({ valid } = await lastValidationPromise);
          } else {
            valid = errorList?.[0]?.feedback !== ERROR_FEEDBACK;
          }
          hasInvalidItem ||= !valid;
          if (!valid && failFast) return Promise.reject(failFastRejection);
        },
      );
      try {
        await Promise.all(validationPromiseList);
      } catch (e) {
        if (e !== failFastRejection) throw e;
        hasInvalidFailFastItem = true;
      }

      // if an input has an error then enable inputs right away, but remain in "isSubmitting" state
      // until all validations end (so that Submit button remains disabled until other validations finish);
      // note that if we didn't wait, it would all work just fine too
      if (hasInvalidFailFastItem) {
        // NOTE We'll let validation continue even if we're unmounted (we won't reject / throw exception). Otherwise it causes
        // issues when validation is called from withSubformItem HOC (nested FormProvider) as a part of component's own validation (onValidate).
        // Problematic scenario would be:
        // 1. In edit modal, go to tab containing withSubformItem-based component.
        // 2. The component gets validated on mount, i.e. it calls our validate() (on nested FormProvider) from component's onValidate().
        //    Note that this stores "lastValidationPromise" for this component into outer FormProvider's state (that should become
        //    resolved/rejected with onValidate() result).
        // 3. User goes to different tab *during* the validation, i.e. component gets unmounted before nested FormProvider finishes.
        // 4. If we threw exception due to unmount, outer FormProvider's "lastValidationPromise" would end up being rejected with this exception.
        // 5. An attempt to submit outer FormProvider would await "lastValidationPromise" (because our component is not currently
        //    mounted - user is looking at different edit modal tab) and therefore got rejected. I.e. user would have to go back to the tab
        //    with our component and re-submit edit modal from there.
        // Because we don't throw exception, step 4 ends up being properly finished (resolved) so submit from other tab works.
        if (!unmountedRef.current) setIsSubmittingButEnabled(true);
        await Promise.all(
          validationPromiseList.map((it) => it.catch((e) => (e === failFastRejection ? null : Promise.reject(e)))),
        );
        if (!unmountedRef.current) setIsSubmittingButEnabled(false);
      }

      // validate form via its own props.onValidate
      let newErrorList = [];
      let { itemMap } = currentValuesRef.current.formItem;
      let value = getFormValue(itemMap);
      let apiItemMap = getFormItemMap(itemMap);
      if (!hasInvalidItem && typeof onValidate === "function") {
        let validatePromise;
        if (!unmountedRef.current) {
          Utils.Dom._batchedUpdates(() => {
            validatePromise = onValidate(new Utils.Event({ value }));
          });
        }
        newErrorList = sortErrorList(
          normalizeValidatorResult(await validatePromise, { code: "onValidate", async: true }),
        );
        isInvalidForm = newErrorList[0]?.feedback === ERROR_FEEDBACK;
      }

      if (!unmountedRef.current) {
        Utils.Dom._batchedUpdates(() => {
          setErrorList(newErrorList);
        });
      }

      let valid = !hasInvalidItem && !isInvalidForm;

      // NOTE These are public API (validate() currently returns these).
      return { valid, value, itemMap: apiItemMap, errorList: newErrorList };
    }

    const formContextValue = useMemo(
      () => ({ isSubmitting, ...getVisualProps(props), disabled }),
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
      [
        isSubmitting,
        disabled,
        // eslint-disable-next-line uu5/hooks-exhaustive-deps
        ...Config.FORM_ITEM_VISUAL_PROPS.filter((v) => v !== "disabled").map((prop) => props[prop]),
      ],
    );

    // form leaving logic - either due to navigation to another route, or due to explicit call from CancelButton
    const [showLeaveDialogData, setShowLeaveDialogData] = useNamedState("showLeaveDialogData"); // { allow, refuse }
    const { allow, refuse, prevent, nextRoute } = useRouteLeave({ initialPrevented: false });
    const askBeforeLeave = formItem.dirty && !allowLeaveUnsaved && !disableLeaveConfirmation;
    useEffect(() => {
      if (askBeforeLeave) prevent();
      else allow();
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [askBeforeLeave]);
    function _cancel(callback) {
      return new Promise((resolve) => {
        // explicit call from CancelButton
        if (!askBeforeLeave) {
          if (typeof callback === "function") callback();
          resolve(true);
        } else {
          setShowLeaveDialogData({
            allow: () => {
              setShowLeaveDialogData(undefined);
              allow?.();
              if (typeof callback === "function") callback();
              resolve(true);
            },
            refuse: () => {
              setShowLeaveDialogData(undefined);
              refuse?.();
              resolve(false);
            },
          });
        }
      });
    }
    const allowLeave = showLeaveDialogData ? showLeaveDialogData.allow : nextRoute ? allow : undefined;
    const refuseLeave = showLeaveDialogData ? showLeaveDialogData.refuse : nextRoute ? refuse : undefined;

    const submit = useRef((...args) => currentValuesRef.current._submit(false, ...args)).current;
    const submitStep = useRef((...args) => currentValuesRef.current._submit(true, ...args)).current;
    const validate = useRef((...args) => currentValuesRef.current._validate(false, true, ...args)).current;
    const validateStep = useRef((...args) => currentValuesRef.current._validate(true, true, ...args)).current;
    const reset = useRef((...args) => currentValuesRef.current._reset(false, ...args)).current;
    const resetStep = useRef((...args) => currentValuesRef.current._reset(true, ...args)).current;
    const cancel = useRef((...args) => currentValuesRef.current._cancel(...args)).current;

    const value = useMemo(() => getFormValue(formItem.itemMap), [formItem.itemMap]);
    const itemMapOnApi = useMemo(() => getFormItemMap(formItem.itemMap), [formItem.itemMap]);
    const formApi = useMemo(
      // !!! Keep in sync with use-form-api.js.
      () => ({
        submit,
        submitStep,
        validate,
        validateStep,
        reset,
        resetStep,
        cancel,
        setItemValue,
        setItemState,
        errorList,
        submitError,
        value,
        itemMap: itemMapOnApi,
      }),
      [
        cancel,
        errorList,
        itemMapOnApi,
        reset,
        resetStep,
        setItemState,
        setItemValue,
        submit,
        submitError,
        submitStep,
        validate,
        validateStep,
        value,
      ],
    );
    const formFormContextValue = useMemo(
      () => ({
        ...formApi,
        setErrorList,
        setSubmitError,
        allowLeave,
        refuseLeave,
        submitButtonComponentElementRef,
        nativeSubmitButtonElementRef,
      }),
      [formApi, setErrorList, setSubmitError, allowLeave, refuseLeave],
    );

    const formItemContextValue = useMemo(
      () => ({
        ...formItem,
        onItemChange,
        onItemValidationEnd,
        onItemValidationStart,
        addItem,
        removeItem,
        updateItem,
        setItemValue,
        setItemState,
      }),
      [
        addItem,
        formItem,
        onItemChange,
        onItemValidationEnd,
        onItemValidationStart,
        removeItem,
        setItemState,
        setItemValue,
        updateItem,
      ],
    );
    //@@viewOff:private

    //@@viewOn:render
    return (
      <FormItemContext.Provider value={formItemContextValue}>
        <FormContext.Provider value={formContextValue}>
          <FormFormContext.Provider value={formFormContextValue}>
            {typeof children === "function"
              ? children({
                  ...formApi,
                  ...formContextValue,
                })
              : children}
          </FormFormContext.Provider>
        </FormContext.Provider>
      </FormItemContext.Provider>
    );
    //@@viewOff:render
  },
});

FormProvider = _withValidationMap(FormProvider, {}, false);
FormProvider.State = State;

export { FormProvider };
export default FormProvider;
