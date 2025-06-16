import { Utils, useMemo, useValueChange, createComponent, PropTypes, useCallback } from "uu5g05";
import Config from "./config/config.js";
import WizardContext from "./_internal/wizard-context.js";
import { useFormApi } from "./use-form-api.js";

const WizardProvider = createComponent({
  uu5Tag: Config.TAG + "WizardProvider",

  propTypes: {
    validationMode: PropTypes.oneOf(["wizard", "loose", "strict"]),
    itemList: PropTypes.array,
    stepIndex: PropTypes.number,
    progressIndex: PropTypes.number,
    validityList: PropTypes.arrayOf(PropTypes.bool),
    onItemListChange: PropTypes.func,
    onStepIndexChange: PropTypes.func,
    onProgressIndexChange: PropTypes.func,
    onValidityListChange: PropTypes.func,
  },

  defaultProps: {
    validationMode: "wizard",
    itemList: undefined,
    stepIndex: undefined,
    progressIndex: undefined,
    validityList: undefined,
    onItemListChange: undefined,
    onStepIndexChange: undefined,
    onProgressIndexChange: undefined,
    onValidityListChange: undefined,
  },

  render(props) {
    const { children, validationMode } = props;
    const { validateStep, submitStep } = useFormApi();

    const onItemListChange =
      typeof props.onItemListChange === "function" ? (itemList) => props.onItemListChange({ itemList }) : null;
    const [itemList, setItemList] = useValueChange(props.itemList, onItemListChange);

    const onStepIndexChange =
      typeof props.onStepIndexChange === "function" ? (stepIndex) => props.onStepIndexChange({ stepIndex }) : null;
    const [stepIndex, _setStepIndex] = useValueChange(
      props.stepIndex ?? (itemList?.length ? 0 : undefined),
      onStepIndexChange,
    );

    const onProgressIndexChange =
      typeof props.onProgressIndexChange === "function"
        ? (stepIndex) => props.onProgressIndexChange({ stepIndex })
        : null;
    const [progressIndex, setProgressIndex] = useValueChange(props.progressIndex ?? stepIndex, onProgressIndexChange);

    const onValidityListChange =
      typeof props.onValidityListChange === "function"
        ? (validityList) => props.onValidityListChange({ validityList })
        : null;
    const [validityList, setValidityList] = useValueChange(
      props.validityList ?? new Array(itemList?.length).fill(null),
      onValidityListChange,
    );

    const setStepIndex = useCallback(
      async (newIndex) => {
        if (stepIndex === newIndex) return;

        const _setStepHelper = (newIndex, valid) => {
          setValidityList((validityList) => {
            let newList = [...validityList];
            newList[stepIndex] = valid;
            return newList;
          });
          _setStepIndex(newIndex);
          if (newIndex > progressIndex) setProgressIndex(newIndex);
        };

        let valid;
        switch (validationMode) {
          case "wizard": // when active step is invalid, only previous steps are available
            if (newIndex < stepIndex) {
              ({ valid } = validateStep && (await validateStep()));
              _setStepHelper(newIndex, valid);
            } else {
              ({ valid } = submitStep && (await submitStep()));
              if (valid) _setStepHelper(newIndex, valid);
            }
            break;
          case "loose": // all steps are available regardless validity or progressIndex
            ({ valid } = validateStep && (await validateStep()));
            _setStepHelper(newIndex, valid);
            break;
          case "strict": // when active step is invalid, it can't be left
            ({ valid } = submitStep && (await submitStep()));
            if (valid) _setStepHelper(newIndex, valid);
            break;
        }
      },
      [
        _setStepIndex,
        progressIndex,
        setProgressIndex,
        setValidityList,
        stepIndex,
        submitStep,
        validateStep,
        validationMode,
      ],
    );

    let value = useMemo(
      () => ({
        itemList,
        stepIndex,
        progressIndex,
        validityList,
        setStepIndex,
      }),
      [itemList, stepIndex, progressIndex, validityList, setStepIndex],
    );

    return (
      <WizardContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </WizardContext.Provider>
    );
  },
});

export { WizardProvider };
export default WizardProvider;
