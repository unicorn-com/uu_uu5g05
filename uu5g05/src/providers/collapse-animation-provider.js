//@@viewOn:imports
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import { useMemo } from "../hooks/react-hooks.js";
import CollapseAnimationContext from "../contexts/collapse-animation-context.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

const CollapseAnimationProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "CollapseAnimationProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    isAnimating: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    isAnimating: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, isAnimating } = props;

    const contextValue = useMemo(() => ({ isAnimating }), [isAnimating]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <CollapseAnimationContext.Provider value={contextValue}>
        {typeof children === "function" ? children(contextValue) : children}
      </CollapseAnimationContext.Provider>
    );
    //@@viewOff:render
  },
});

export { CollapseAnimationProvider };
export default CollapseAnimationProvider;
