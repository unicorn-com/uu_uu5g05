//@@viewOn:imports
import { createVisualComponent, PropTypes, Lsi } from "uu5g05";
import { useWizard } from "./use-wizard.js";
import Config from "./config/config.js";
import SubmitButton from "./submit-button";
import importLsi from "./lsi/import-lsi";
//@@viewOff:imports

const DEFAULT_LSI = {
  next: { import: importLsi, path: ["next"] },
  submit: { import: importLsi, path: ["submit"] },
};

const WizardSubmitButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "WizardSubmitButton",
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
    //@@viewOn:private
    const { lsi, children, onClick, ...otherProps } = props;
    const fullLsi = { ...DEFAULT_LSI, ...lsi };

    const { itemList, stepIndex, setStepIndex } = useWizard();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return stepIndex < itemList?.length - 1 ? (
      <SubmitButton
        {...otherProps}
        type="step"
        onClick={(e) => {
          if (typeof onClick === "function") onClick(e);
          e.preventDefault();
          setStepIndex(stepIndex + 1);
        }}
      >
        {children !== undefined ? children : <Lsi lsi={fullLsi.next} />}
      </SubmitButton>
    ) : (
      <SubmitButton {...otherProps} type="submit" onClick={onClick}>
        {children !== undefined ? children : <Lsi lsi={fullLsi.submit} />}
      </SubmitButton>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { WizardSubmitButton };
export default WizardSubmitButton;
