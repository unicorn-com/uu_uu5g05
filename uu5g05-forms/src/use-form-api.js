import { useFormFormContext } from "./_internal/form-form-context.js";

function useFormApi() {
  // return only subset of values from context
  const {
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
    itemMap,
  } = useFormFormContext();
  return {
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
    itemMap,
  };
}

export { useFormApi };
export default useFormApi;
