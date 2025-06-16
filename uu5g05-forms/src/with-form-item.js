//@@viewOn:imports
import {
  createComponent,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  PropTypes,
  Utils,
  useMemo,
  useUpdateEffect,
} from "uu5g05";
import Config from "./config/config.js";
import { useFormItemContext } from "./_internal/form-item-context.js";
import { getFormValue, getStackInfo } from "./_internal/tools.js";
import useForm from "./use-form.js";
//@@viewOff:imports

let warnedAccessingValueMap;
let warnedAccessingSetValue;

function useFormItem(props) {
  const {
    name,
    initialValue: propsInitialValue,
    onChange: propsOnChange,
    onValidationStart: propsOnValidationStart,
    onValidationEnd: propsOnValidationEnd,
    onValidate: propsOnValidate,
    onFocus: propsOnFocus,
    onBlur: propsOnBlur,
    validateOnMount: propsValidateOnMount,
  } = props;

  const contextValue = useFormItemContext();
  const {
    addItem,
    removeItem,
    updateItem,
    itemMap,
    onItemChange,
    onItemValidationStart,
    onItemValidationEnd,
    setItemValue,
  } = contextValue;

  // use item state from form or initialize it
  // NOTE Initialization is here, not in Form.Provider, because if we're returning in wizard to a step,
  // we want to re-acquire the state such as errorList, resp. validateOnMount setting (which is taken
  // into account only during 1st render, so we cannot wait until re-registration happens).
  let validationRef = useRef();
  let inputRef = useRef();
  let initialItemState;
  let itemState = itemMap?.[name];
  if (!itemState || !itemState.mounted) {
    // `!itemState.mounted` is e.g. when returning to a wizard tab/step, i.e. input was present
    // in the past and now should re-acquire state (and re-register its validationRef, inputRef)
    itemState = { value: propsInitialValue, ...itemState, validationRef, inputRef };
    if (propsInitialValue !== undefined) itemState.initialValue = propsInitialValue;
    if (itemState && "errorList" in itemState) itemState.validateOnMount = false;
    initialItemState = itemState;
  }
  if (!Utils.Object.deepEqual(propsInitialValue, itemState.initialValue)) {
    if (itemState === itemMap?.[name]) itemState = { ...itemState };
    itemState.initialValue = propsInitialValue;
  }

  let reregisterRef = useRef(0);
  if (initialItemState) reregisterRef.current++;
  useLayoutEffect(() => {
    if (addItem) {
      // NOTE initialItemState can be undefined in case that input got moved from 1 place to another, i.e.
      // old input got removed and new (same) was added within the same React commit. The new input would
      // still see filled-in itemState from form's context during its mount so initialItemState above wouldn't
      // be filled. We'll use the filled-in itemState for addItem call in such case.
      addItem(name, initialItemState || { ...itemState, validationRef, inputRef, validateOnMount: false });
      return () => removeItem(name);
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [name, reregisterRef.current]);
  useUpdateEffect(() => {
    if (updateItem) updateItem(name, { initialValue: itemState.initialValue });
  }, [name, itemState.initialValue]);

  const currentValuesRef = useRef();
  function toEventWithFormData(anEvent, omitSetItemValue = false) {
    let { value, itemMap, setItemValue } = currentValuesRef.current;
    let formValue = getFormValue(itemMap);
    let data = {
      value,
      ...anEvent?.data,
      name,
      form: { value: formValue },
    };
    if (process.env.NODE_ENV === "production") {
      data.form.valueMap = formValue; // backward compatibility
    } else {
      Object.defineProperty(data.form, "valueMap", {
        get: () => {
          if (!warnedAccessingValueMap) {
            warnedAccessingValueMap = true;
            let stackInfo = getStackInfo("with-form-item.js");
            Utils.LoggerFactory.get("Uu5Forms.withFormItem").warn(
              `Accessing event.data.form.valueMap is deprecated. Use event.data.form.value instead.${
                stackInfo ? "\n" + stackInfo : ""
              }`,
            );
          }
          return formValue;
        },
      });
    }

    if (name != null && name in formValue) formValue[name] = data.value; // onChange might have sent new value which isn't in itemMap yet
    if (!omitSetItemValue) {
      data.form.setItemValue = setItemValue;
      if (process.env.NODE_ENV === "production") {
        data.form.setValue = setItemValue; // backward compatibility
      } else {
        Object.defineProperty(data.form, "setValue", {
          get: () => {
            if (!warnedAccessingSetValue) {
              warnedAccessingSetValue = true;
              let stackInfo = getStackInfo("with-form-item.js");
              Utils.LoggerFactory.get("Uu5Forms.withFormItem").warn(
                `Accessing event.data.form.setValue is deprecated. Use event.data.form.setItemValue instead.${
                  stackInfo ? "\n" + stackInfo : ""
                }`,
              );
            }
            return setItemValue;
          },
        });
      }
    }
    return new Utils.Event(data, anEvent);
  }

  const lastOnChangeValueRef = useRef(itemState.value);
  const onChange = useCallback(
    (e) => {
      e = toEventWithFormData(e);
      onItemChange?.(name, e);
      lastOnChangeValueRef.current = e.data.value;
      typeof propsOnChange === "function" && propsOnChange(e);
    },
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
    [name, onItemChange, propsOnChange],
  );

  const onValidationEnd = useCallback(
    (e) => {
      onItemValidationEnd?.(name, e);
      typeof propsOnValidationEnd === "function" && propsOnValidationEnd(e);
    },
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
    [name, onItemValidationEnd, propsOnValidationEnd],
  );

  const onValidationStart = useCallback(
    (e) => {
      onItemValidationStart?.(name, e);
      typeof propsOnValidationStart === "function" && propsOnValidationStart(e);
    },
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
    [name, onItemValidationStart, propsOnValidationStart],
  );

  // optional events, enriched by form's valueMap
  const onValidate = useMemo(() => {
    if (typeof propsOnValidate !== "function") return;
    return (e) => {
      e = toEventWithFormData(e, true);
      return propsOnValidate(e);
    };
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [propsOnValidate]);

  const onFocus = useMemo(() => {
    if (typeof propsOnFocus !== "function") return;
    return (e) => {
      e = toEventWithFormData(e);
      propsOnFocus(e);
    };
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [propsOnFocus]);

  const onBlur = useMemo(() => {
    if (typeof propsOnBlur !== "function") return;
    return (e) => {
      e = toEventWithFormData(e);
      propsOnBlur(e);
    };
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [propsOnBlur]);

  // return relevant props, i.e. not initialValue or others that Form uses for internal stuff
  let { value, errorList, pending, key, validateOnMount = propsValidateOnMount } = itemState;
  pending ||= props.pending;

  const form = useForm();
  const visualProps = {};
  if (form) {
    Config.FORM_ITEM_VISUAL_PROPS.forEach((prop) => {
      if (prop === "disabled") visualProps[prop] = form[prop] || props[prop];
      else visualProps[prop] = props[prop] === undefined ? form[prop] : props[prop];
    });
  }

  // value can change directly in Form (e.g. form reset) - we need to run props.onChange on component in such case
  useEffect(() => {
    if (lastOnChangeValueRef.current !== value) {
      lastOnChangeValueRef.current = value;
      if (typeof propsOnChange === "function") {
        let e = toEventWithFormData();
        propsOnChange(e);
      }
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [value]);

  let feedback, message, messageParams;
  if (errorList?.[0]) ({ feedback, message, messageParams } = errorList[0]);
  else ({ message, messageParams } = props);

  currentValuesRef.current = { value, itemMap, setItemValue };

  return {
    key,
    props: {
      value,
      feedback,
      message,
      messageParams,
      pending,
      validateOnMount,
      ...visualProps,
      onChange,
      onValidationStart,
      onValidationEnd,
      onValidate,
      onFocus,
      onBlur,
      inputRef: Utils.Component.combineRefs(inputRef, props.inputRef),
      validationRef: Utils.Component.combineRefs(validationRef, props.validationRef),
    },
  };
}

const memoTypeof = Utils.Component.memo(() => {}).$$typeof;

function withFormItem(FormInput) {
  const { onChange, onValidationEnd, ...propTypes } = FormInput.propTypes || {};
  const MemoedFormInput = FormInput.$$typeof === memoTypeof ? FormInput : Utils.Component.memo(FormInput);
  const wrappeeUu5Tag = FormInput.uu5Tag || FormInput.displayName || "";
  const wrappeeTagOnly = wrappeeUu5Tag.split("(").pop().replace(/\)/g, ""); // withXyz(withXyz2(Uu5Something.Name)) -> Uu5Something.Name
  const wrappeeTagOnlyNoInput = wrappeeTagOnly.replace(/\.Input$/, "");
  const wrappeeTagLastPart = wrappeeTagOnlyNoInput.split(".").pop();
  const wrappeeTagPrefix = wrappeeTagOnlyNoInput.slice(0, -wrappeeTagLastPart.length);
  const ResultComponent = createComponent({
    //@@viewOn:statics
    uu5Tag: wrappeeTagPrefix + `Form${wrappeeTagLastPart}`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...propTypes,
      name: PropTypes.string.isRequired,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {},
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { initialValue, ...otherProps } = props;
      let { key, props: formInputProps } = useFormItem(props);
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return <MemoedFormInput key={key} {...otherProps} {...formInputProps} />;
      //@@viewOff:render
    },
  });
  Utils.Component.mergeStatics(ResultComponent, FormInput);
  return ResultComponent;
}

//@@viewOn:helpers
//@@viewOff:helpers

export { withFormItem };
export default withFormItem;
