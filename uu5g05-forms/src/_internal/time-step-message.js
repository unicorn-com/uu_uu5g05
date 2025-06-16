//@@viewOn:imports
import { createVisualComponent, PropTypes, Lsi } from "uu5g05";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const TimeStepMessage = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TimeStepMessage",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    step: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    step: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { step } = props;

    function getLsi(type, param) {
      return <Lsi import={importLsi} path={["Validation", "stepTimeOptions", type]} params={[param]} />;
    }
    //@@viewOff:private

    //@@viewOn:render
    if (step === 86400) return getLsi("day", 1);
    if (step === 3600) return getLsi("hour", 1);
    if (step === 60) return getLsi("minute", 1);
    if (step > 60 && step < 3600) return getLsi("minutes", step / 60);
    return getLsi("default", step);
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TimeStepMessage };
export default TimeStepMessage;
//@@viewOff:exports
