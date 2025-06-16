//@@viewOn:imports
import { createComponent } from "uu5g05";
import Config from "./config/config.js";
import { useTextSelectContext } from "./_internal/select/text-select-context.js";
import SelectSelectedOptionsView from "./_internal/select/select-selected-options-view.js";
//@@viewOff:imports

const TextSelectSelectedOptions = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TextSelect.SelectedOptions",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onChange } = useTextSelectContext();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <SelectSelectedOptionsView {...props} value={value} onChange={onChange} />;
    //@@viewOff:render
  },
});

export { TextSelectSelectedOptions };
export default TextSelectSelectedOptions;
