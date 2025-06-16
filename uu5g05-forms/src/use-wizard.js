import { useWizardContext } from "./_internal/wizard-context.js";

const useWizard = () => {
  const contextValue = useWizardContext();

  const itemList = contextValue.itemList ?? [];
  const stepIndex = contextValue.stepIndex ?? null;
  const progressIndex = contextValue.progressIndex ?? null;
  const validityList = contextValue.validityList ?? null;

  const setItemList = contextValue.setItemList;
  const setActiveIndex = contextValue.setActiveIndex;
  const setProgressIndex = contextValue.setProgressIndex;
  const setValidityList = contextValue.setValidityList;

  const setStepIndex = contextValue.setStepIndex;

  return {
    itemList,
    stepIndex,
    progressIndex,
    validityList,

    setItemList,
    setActiveIndex,
    setProgressIndex,
    setValidityList,

    setStepIndex,
  };
};

export { useWizard };
export default useWizard;
