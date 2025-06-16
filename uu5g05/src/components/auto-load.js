//@@viewOn:imports
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import TriggerIfAlmostVisible from "../_internal/trigger-if-almost-visible.js";
import Config from "../config/config.js";
//@@viewOff:imports

const AutoLoad = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AutoLoad",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    distance: PropTypes.number,
    data: PropTypes.array,
    handleLoadNext: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    distance: 1000,
    data: undefined,
    handleLoadNext: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { distance, data, handleLoadNext } = props;
    const firstNotYetLoadedIndex = data ? data.findIndex((it) => it == null) : -1;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return firstNotYetLoadedIndex !== -1 ? (
      <TriggerIfAlmostVisible key={firstNotYetLoadedIndex} triggerDistance={distance} onTrigger={handleLoadNext} />
    ) : null;
    //@@viewOff:render
  },
});

export { AutoLoad };
export default AutoLoad;
