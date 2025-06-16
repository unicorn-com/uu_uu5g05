//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import { useSelectContext } from "./_internal/select/select-context.js";
import SelectOptionsView from "./_internal/select/select-options-view.js";
import MultilevelSelectOptionsView from "./_internal/select/multilevel-select-options-view.js";
//@@viewOff:imports

const SelectOptions = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Select.Options",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    height: SelectOptionsView.propTypes.height,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    height: null,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { elementAttrs, ...otherProps } = props;
    const {
      itemList,
      onChange,
      value,
      multiple,
      level,
      onChangeLevel,
      multilevel,
      size,
      displayCheckboxes,
      colorScheme,
    } = useSelectContext();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const componentProps = {
      ...otherProps,
      itemList,
      onChange,
      value,
      multiple,
      size,
      displayCheckboxes,
      colorScheme,
      elementAttrs: {
        ...elementAttrs,
        onMouseDown: (e) => {
          if (typeof elementAttrs?.onMouseDown === "function") elementAttrs.onMouseDown(e);
          // Prevent input field to lost focus
          e.preventDefault();
        },
      },
    };

    let Comp = SelectOptionsView;
    if (multilevel) {
      Comp = MultilevelSelectOptionsView;
      componentProps.level = level;
      componentProps.onChangeLevel = onChangeLevel;
    }

    return <Comp {...componentProps} />;
    //@@viewOff:render
  },
});

export { SelectOptions };
export default SelectOptions;
