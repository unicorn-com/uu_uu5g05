import { useMemo } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import SelectionContext from "../contexts/selection-context.js";

const SelectionProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SelectionProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.number, // 1-based
    count: PropTypes.number.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: undefined,
    count: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { value, count, children } = props;
    count = Math.max(1, Math.floor(count) || 1);
    value = Math.max(1, Math.min(count, Math.floor(value) || 1));
    const contextValue = useMemo(() => ({ value, count }), [value, count]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <SelectionContext.Provider value={contextValue}>
        {typeof children === "function" ? children(contextValue) : children}
      </SelectionContext.Provider>
    );
    //@@viewOff:render
  },
});

export { SelectionProvider };
export default SelectionProvider;
