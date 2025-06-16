//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { useWizard } from "./use-wizard.js";
import Config from "./config/config.js";
import ResetButton from "./reset-button";
import SubmitButton from "./submit-button";
import importLsi from "./lsi/import-lsi";
//@@viewOff:imports

const DEFAULT_LSI = {
  previous: { import: importLsi, path: ["previous"] },
  next: { import: importLsi, path: ["next"] },
  submit: { import: importLsi, path: ["submit"] },
};

const Css = {
  main: Config.Css.css({
    display: "flex",
    // flexDirection: vertical ? "column" : "row",
    // alignItems: vertical ? "flex-start" : "center",
    columnGap: Uu5Elements.UuGds.getValue(["SpacingPalette", "fixed", "c"]),
    rowGap: Uu5Elements.UuGds.getValue(["SpacingPalette", "fixed", "c"]),
    marginTop: Uu5Elements.UuGds.getValue(["SpacingPalette", "fixed", "e"]),
    marginBottom: Uu5Elements.UuGds.getValue(["SpacingPalette", "fixed", "e"]),
  }),
};

const WizardControls = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "WizardControls",
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
    const { itemList, stepIndex, setStepIndex } = useWizard();
    //@@viewOff:hooks

    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props);

    return (
      <div {...attrs} className={Css.main}>
        {stepIndex > 0 && (
          <ResetButton
            children={<Lsi lsi={fullLsi.previous} />}
            onClick={(event) => {
              event.preventDefault();
              setStepIndex(stepIndex - 1);
            }}
          />
        )}
        {stepIndex < itemList?.length - 1 ? (
          <SubmitButton
            children={<Lsi lsi={fullLsi.next} />}
            type="step"
            significance="highlighted"
            colorScheme="primary"
            onClick={(event) => {
              event.preventDefault();
              setStepIndex(stepIndex + 1);
            }}
          />
        ) : (
          <SubmitButton
            children={<Lsi lsi={fullLsi.submit} />}
            type="submit"
            significance="highlighted"
            colorScheme="primary"
          />
        )}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { WizardControls };
export default WizardControls;
