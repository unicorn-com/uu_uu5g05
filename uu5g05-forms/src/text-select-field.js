//@@viewOn:imports
import { createComponent, Utils } from "uu5g05";
import Config from "./config/config.js";
import { useTextSelectContext } from "./_internal/select/text-select-context.js";
import TextSelectFieldView from "./_internal/select/text-select-field-view.js";
//@@viewOff:imports

//@@viewOn:helpers
//@@viewOff:helpers

const TextSelectField = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TextSelect.Field",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    // deprecated, move to TextSelectInput
    displayOptions: TextSelectFieldView.propTypes.displayOptions,
    displayTags: TextSelectFieldView.propTypes.displayTags,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    // deprecated, move to TextSelectInput
    displayOptions: undefined,
    displayTags: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { elementRef, className, ...otherProps } = props;
    const { elementRef: _elementRef, className: _className, ...textSelectContext } = useTextSelectContext();

    const displayTags = otherProps.displayTags != null ? otherProps.displayTags : textSelectContext.displayTags;
    const displayOptions =
      otherProps.displayOptions != null ? otherProps.displayOptions : textSelectContext.displayOptions;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <TextSelectFieldView
        {...otherProps}
        {...textSelectContext}
        displayTags={displayTags}
        displayOptions={displayOptions}
        elementRef={Utils.Component.combineRefs(_elementRef, elementRef)}
        className={Utils.Css.joinClassName(_className, className)}
      />
    );
    //@@viewOff:render
  },
});

export { TextSelectField };
export default TextSelectField;
