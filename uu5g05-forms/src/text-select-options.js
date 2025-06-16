//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import { useTextSelectContext } from "./_internal/select/text-select-context.js";
import SelectOptionsView from "./_internal/select/select-options-view.js";
import MultilevelSelectOptionsView from "./_internal/select/multilevel-select-options-view.js";
//@@viewOff:imports

const TextSelectOptions = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TextSelect.Options",
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
      searchValue,
      onSearch,
      onChangeLevel,
      multilevel,
      level,
      displayTags,
      displayCheckboxes,
      colorScheme,
    } = useTextSelectContext();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    if (!itemList?.length) return null;

    const componentProps = {
      ...otherProps,
      itemList,
      onChange,
      value,
      multiple,
      level,
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

    if (displayTags && !multiple && itemList.length > 1) componentProps.onSearch = onSearch;

    let Comp = SelectOptionsView;
    if (multilevel) {
      Comp = MultilevelSelectOptionsView;
      componentProps.searchValue = searchValue;
      componentProps.onChangeLevel = onChangeLevel;
    }

    return <Comp {...componentProps} />;
    //@@viewOff:render
  },
});

export { TextSelectOptions };
export default TextSelectOptions;
