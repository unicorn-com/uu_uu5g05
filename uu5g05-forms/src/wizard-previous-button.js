//@@viewOn:imports
import { createVisualComponent, PropTypes, Lsi } from "uu5g05";
import { useWizard } from "./use-wizard.js";
import Config from "./config/config.js";
import ResetButton from "./reset-button";
import importLsi from "./lsi/import-lsi";
//@@viewOff:imports

const DEFAULT_LSI = {
  previous: { import: importLsi, path: ["previous"] },
};

const WizardPreviousButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "WizardPreviousButton",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    lsi: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    lsi: DEFAULT_LSI,
  },
  //@@viewOff:defaultProps

  render(props) {
    const { lsi } = props;
    const fullLsi = { ...DEFAULT_LSI, ...lsi };

    //@@viewOn:hooks
    const { stepIndex, setStepIndex } = useWizard();
    //@@viewOff:hooks

    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return stepIndex > 0 ? (
      <ResetButton
        children={<Lsi lsi={fullLsi.previous} />}
        onClick={(event) => {
          event.preventDefault();
          setStepIndex(stepIndex - 1);
        }}
      />
    ) : null;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { WizardPreviousButton };
export default WizardPreviousButton;
