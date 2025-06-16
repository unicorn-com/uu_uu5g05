import { createComponent, Utils } from "uu5g05";
import Config from "./config/config.js";
import { useSelectContext } from "./_internal/select/select-context.js";
import SelectFieldView from "./_internal/select/select-field-view.js";

//@@viewOn:helpers
//@@viewOff:helpers

const SelectField = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Select.Field",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    // deprecated, move to SelectInput
    displayOptions: SelectFieldView.propTypes.displayOptions,
    displayTags: SelectFieldView.propTypes.displayTags,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    // deprecated, move to SelectInput
    displayOptions: undefined,
    displayTags: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { elementRef, className, ...otherProps } = props;
    const { elementRef: _elementRef, className: _className, ...selectContext } = useSelectContext();

    const displayTags = otherProps.displayTags != null ? otherProps.displayTags : selectContext.displayTags;
    const displayOptions = otherProps.displayOptions != null ? otherProps.displayOptions : selectContext.displayOptions;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <SelectFieldView
        {...otherProps}
        {...selectContext}
        displayTags={displayTags}
        displayOptions={displayOptions}
        elementRef={Utils.Component.combineRefs(_elementRef, elementRef)}
        className={Utils.Css.joinClassName(_className, className)}
      />
    );
    //@@viewOff:render
  },
});

export { SelectField };
export default SelectField;
