//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { SLIDER_ITEM_LIST } from "./tools.js";
import Config from "../../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const SimpleSlider = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SimpleSlider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func,
    errorProps: PropTypes.shape({
      feedback: PropTypes.string,
      message: PropTypes.node,
      messagePosition: PropTypes.string,
    }),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: undefined,
    onChange: undefined,
    errorProps: {},
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { errorProps, ...otherProps } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Forms.Slider
        {...otherProps}
        itemList={SLIDER_ITEM_LIST}
        // there is feedback in otherProps so it is necessary to insert feedback from errorProps
        feedback={errorProps.feedback}
        message={errorProps.message}
        messagePosition={errorProps.messagePosition}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SimpleSlider };
export default SimpleSlider;
//@@viewOff:exports
