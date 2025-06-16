//@@viewOn:imports
import { createVisualComponent, useMemo } from "uu5g05";
import { useFormApi } from "./use-form-api.js";
import { useWizard } from "./use-wizard.js";
import FormView from "./form-view";
import Config from "./config/config.js";
//@@viewOff:imports

const WizardContent = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "WizardContent",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:hooks
    const { value } = useFormApi();
    const { itemList, stepIndex } = useWizard();
    //@@viewOff:hooks

    //@@viewOn:private
    const activeStep = itemList[stepIndex];

    const inputMap = useMemo(
      () => (activeStep.inputMap ? getInputMapWithFormValue(activeStep.inputMap, value) : undefined),
      [itemList, stepIndex, value],
    );
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const StepComponent = activeStep?.component;

    return StepComponent ? (
      <StepComponent {...props} data={value} />
    ) : inputMap ? (
      <FormView {...props} inputMap={inputMap} gridLayout={activeStep.gridLayout} />
    ) : null;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const getInputMapWithFormValue = (inputMap, formValue) =>
  Object.keys(inputMap).reduce(
    (map, name) => ({
      ...map,
      [name]: {
        ...inputMap[name],
        formValue,
      },
    }),
    {},
  );
//@@viewOff:helpers

export { WizardContent };
export default WizardContent;
