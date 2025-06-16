//@@viewOn:imports
import { createVisualComponent, PropTypes, useState } from "uu5g05";
import AdvancedPanelView from "./advanced-panel-view.js";
import ContentSizePanel from "../../content-size-panel.js";
import { SCREEN_SIZE_LIST, SPACES_INPUT_DEFAULT_PROPS, SPACES_INPUT_PROP_TYPES } from "./tools.js";
import Config from "../../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const AdvancedPanel = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AdvancedPanel",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...SPACES_INPUT_PROP_TYPES,
    open: PropTypes.bool,
    placeholder: PropTypes.space,
    screenSize: PropTypes.oneOf(SCREEN_SIZE_LIST),
    errorList: PropTypes.array,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...SPACES_INPUT_DEFAULT_PROPS,
    open: false,
    placeholder: undefined,
    screenSize: "xs",
    errorList: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { open: propsOpen, screenSize, ...otherProps } = props;
    const [open, setOpen] = useState(propsOpen);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <ContentSizePanel displayScreenName contentSize={screenSize} open={open} onChange={(e) => setOpen(e.data.open)}>
        {() => <AdvancedPanelView {...otherProps} isPanelOpen={open} screenSize={screenSize} />}
      </ContentSizePanel>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { AdvancedPanel };
export default AdvancedPanel;
//@@viewOff:exports
