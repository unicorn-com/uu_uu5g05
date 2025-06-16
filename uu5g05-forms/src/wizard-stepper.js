//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { useWizard } from "./use-wizard.js";
//@@viewOff:imports

const WizardStepper = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "WizardStepper",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: Uu5Elements.Stepper.propTypes,
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:hooks
    const { itemList, stepIndex, progressIndex, validityList, setStepIndex } = useWizard();
    //@@viewOff:hooks

    //@@viewOn:private
    const stepperItemList = itemList.map(
      ({ component, inputMap, gridLayout, ...stepperItemProps }) => stepperItemProps,
    );
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Elements.Stepper
        {...props}
        itemList={stepperItemList}
        stepIndex={stepIndex}
        progressIndex={progressIndex}
        validityList={validityList}
        onChange={(event) => setStepIndex(event.data.stepIndex)}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { WizardStepper };
export default WizardStepper;
