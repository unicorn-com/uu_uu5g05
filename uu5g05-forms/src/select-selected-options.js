//@@viewOn:imports
import { createComponent } from "uu5g05";
import Config from "./config/config.js";
import { useSelectContext } from "./_internal/select/select-context.js";
import SelectSelectedOptionsView from "./_internal/select/select-selected-options-view.js";
//@@viewOff:imports

const SelectSelectedOptions = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Select.SelectedOptions",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onChange, size } = useSelectContext();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <SelectSelectedOptionsView {...props} value={value} onChange={onChange} size={size} />;
    //@@viewOff:render
  },
});

export { SelectSelectedOptions };
export default SelectSelectedOptions;
