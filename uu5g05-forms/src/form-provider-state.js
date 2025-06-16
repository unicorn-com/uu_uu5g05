import { FORM_ITEM_PUBLIC_STATE_PROPS, getFormItemMap, getFormValue } from "./_internal/tools.js";

const SYMBOL_INTERNAL = Symbol("internal");

const INITIAL_FORM_ITEM = { itemMap: {}, dirty: false };

function processSetItemValue(formItem, name, value) {
  // if value didn't change then do nothing (but ensure that form item actually exists even if value===undefined)
  if (formItem.itemMap[name] && formItem.itemMap[name].value === value) return formItem;
  let newOrUpdatedItem = {
    initialValue: value,
    ...formItem.itemMap[name],
    value,
    errorList: undefined,
    lastValidationPromise: undefined,
  };
  return {
    ...formItem,
    itemMap: { ...formItem.itemMap, [name]: newOrUpdatedItem },
    dirty: true,
  };
}

function processSetItemState(prevState, name, itemState) {
  let { itemMap: prevItemMap } = prevState;
  if (!itemState && !prevItemMap[name]) return prevState;
  let itemMap = { ...prevItemMap };
  if (!itemState) {
    delete itemMap[name];
  } else {
    let knownFields = new Set(FORM_ITEM_PUBLIC_STATE_PROPS);
    itemMap[name] = { ...itemMap[name] };
    for (let k in itemState) {
      if (k === "errorList" && itemMap[name][k] !== itemState[k]) {
        delete itemMap[name]["lastValidationPromise"];
      }
      if (knownFields.has(k)) itemMap[name][k] = itemState[k];
    }
  }
  return {
    ...prevState,
    itemMap,
    dirty: prevState.dirty || itemMap[name]?.value !== prevItemMap[name]?.value,
  };
}

function processReset(formState, resetArgs) {
  const [mountedOnly, valueOverrideMap = {}] = resetArgs;
  let newFormState;
  if (formState.submitError !== null) {
    newFormState ??= { ...formState };
    newFormState.submitError = null;
  }
  if (formState.submitCallResult !== null) {
    newFormState ??= { ...formState };
    newFormState.submitCallResult = null;
  }
  if (formState.errorList?.length !== 0) {
    newFormState ??= { ...formState };
    newFormState.errorList = [];
  }
  let { dirty, itemMap, ...other } = formState.formItem;
  let changedItemMap;
  let newDirty = !mountedOnly ? false : Object.values(itemMap).some((it) => it?.value !== it?.initialValue);
  let newItemMap = Object.fromEntries(
    Object.entries(itemMap).map(([k, item]) => {
      const { pending, errorList, ...restItemState } = item;
      if (mountedOnly && !item.mounted) return [k, item];
      changedItemMap = true;
      return [
        k,
        {
          ...restItemState,
          key: (restItemState.key || 0) + 1,
          value: k in valueOverrideMap ? valueOverrideMap[k] : restItemState.initialValue,
        },
      ];
    }),
  );
  if (changedItemMap || dirty !== newDirty) {
    newFormState ??= { ...formState };
    newFormState.formItem = { ...other, dirty: newDirty, itemMap: newItemMap };
  }
  return newFormState || formState;
}

class State {
  constructor(initialValue) {
    this[SYMBOL_INTERNAL] = { formItem: INITIAL_FORM_ITEM };
    if (initialValue) {
      let itemMap = { ...this[SYMBOL_INTERNAL].formItem.itemMap };
      this[SYMBOL_INTERNAL].formItem = { ...this[SYMBOL_INTERNAL].formItem, itemMap };
      for (let k in initialValue) {
        itemMap[k] = {
          value: initialValue[k],
          initialValue: initialValue[k],
          mounted: false,
          pending: false,
        };
      }
    }
  }

  update(callback) {
    let initialStateObject = this[SYMBOL_INTERNAL];
    let rollingStateObject = initialStateObject;
    const setItemState = (name, itemState) => {
      let { formItem } = rollingStateObject;
      let newFormItem = processSetItemState(formItem, name, itemState);
      if (newFormItem !== formItem) {
        rollingStateObject = { ...rollingStateObject, formItem: newFormItem };
      }
    };
    const setItemValue = (name, value) => {
      let { formItem } = rollingStateObject;
      let newFormItem = processSetItemValue(formItem, name, value);
      if (newFormItem !== formItem) {
        rollingStateObject = { ...rollingStateObject, formItem: newFormItem };
      }
    };
    const reset = (...args) => {
      rollingStateObject = processReset(rollingStateObject, [false, ...args]);
    };
    const resetStep = (...args) => {
      rollingStateObject = processReset(rollingStateObject, [true, ...args]);
    };

    callback({ setItemValue, setItemState, reset, resetStep });

    let result = this;
    if (rollingStateObject !== initialStateObject) {
      result = new State();
      result[SYMBOL_INTERNAL] = rollingStateObject;
    }
    return result;
  }

  get value() {
    return getFormValue(this[SYMBOL_INTERNAL].formItem?.itemMap);
  }

  get itemMap() {
    return getFormItemMap(this[SYMBOL_INTERNAL].formItem?.itemMap);
  }

  get errorList() {
    return this[SYMBOL_INTERNAL].errorList ?? [];
  }

  get submitError() {
    return this[SYMBOL_INTERNAL].submitError;
  }

  // NOTE We might want to add these methods for (de)serialization support:
  // static from JSON() {}
  // toJSON() {}
}

export { State, SYMBOL_INTERNAL, INITIAL_FORM_ITEM, processSetItemValue, processSetItemState, processReset };
export default State;
