//@@viewOn:imports
import { createVisualComponent, PropTypes, useRef, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import Unit from "../unit.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const AdvancedInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AdvancedInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    iconLeft: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func,
    tooltip: PropTypes.node,
    placeholder: PropTypes.unit,
    errorProps: PropTypes.shape({
      feedback: PropTypes.string,
      message: PropTypes.node,
      messagePosition: PropTypes.string,
    }),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    iconLeft: undefined,
    value: undefined,
    onChange: undefined,
    tooltip: undefined,
    placeholder: undefined,
    errorProps: {},
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { tooltip, placeholder, errorProps, ...otherProps } = props;
    const [isHovered, setIsHovered] = useState(false);
    const tooltipRef = useRef();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <>
        <Unit
          {...otherProps}
          placeholder={placeholder !== undefined && typeof placeholder === "number" ? placeholder + "" : placeholder}
          inputRef={tooltipRef}
          inputAttrs={{
            onMouseEnter: () => setIsHovered(true),
            onMouseLeave: () => setIsHovered(false),
          }}
          // there is feedback in otherProps so it is necessary to insert feedback from errorProps
          feedback={errorProps.feedback}
          message={errorProps.message}
          messagePosition={errorProps.messagePosition}
        />
        {isHovered && <Uu5Elements.Tooltip element={tooltipRef.current}>{tooltip}</Uu5Elements.Tooltip>}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { AdvancedInput };
export default AdvancedInput;
//@@viewOff:exports
