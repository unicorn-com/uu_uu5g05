//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import ToggleButton from "./_internal/toggle-button";
import ToggleSpot from "./_internal/toggle-spot";
import withTooltip from "./with-tooltip.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Toggle = withTooltip(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Toggle",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...ToggleSpot.propTypes,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      size: ToggleSpot.defaultProps.size,
      borderRadius: undefined, // "moderate"
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { size, ...restProps } = props;
      //@@viewOff:private

      //@@viewOn:render
      let result;
      if (size == null) {
        result = <ToggleButton {...restProps} />;
      } else {
        result = <ToggleSpot {...props} />;
      }

      return result;
      //@@viewOff:render
    },
  }),
);

Toggle.Button = ToggleButton;

//@@viewOn:exports
export { Toggle };
export default Toggle;
//@@viewOff:exports
