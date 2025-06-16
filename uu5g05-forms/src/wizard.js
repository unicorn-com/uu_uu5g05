//@@viewOn:imports
import WizardProvider from "./wizard-provider";
import WizardStepper from "./wizard-stepper";
import WizardContent from "./wizard-content";
import WizardPreviousButton from "./wizard-previous-button";
import WizardSubmitButton from "./wizard-submit-button";
//@@viewOff:imports

const Wizard = {
  Provider: WizardProvider,
  Stepper: WizardStepper,
  Content: WizardContent,
  PreviousButton: WizardPreviousButton,
  SubmitButton: WizardSubmitButton,
};

//@@viewOn:helpers
//@@viewOff:helpers

export { Wizard };
export default Wizard;
