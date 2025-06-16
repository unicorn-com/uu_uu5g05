//@@viewOn:imports
import { createVisualComponent, useEffect, Utils } from "uu5g05";
import Config from "../../config/config.js";
import InputTextSelect from "./input-text-select.js";
import withTextSelectBottomSheet from "./with-text-select-bottom-sheet.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:helpers
const InputTextSelectWithBottomSheet = withTextSelectBottomSheet(InputTextSelect);
//@@viewOff:helpers

const TextSelectFieldView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TextSelectFieldView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: InputTextSelect.propTypes,
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: InputTextSelect.defaultProps,
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onAddTempItem, onOpen, ...otherProps } = props;
    const { displayOptions, isBottomSheet } = otherProps;

    useEffect(() => {
      if (!displayOptions) onOpen(new Utils.Event({ value: true }));
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [displayOptions]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let Component;
    let compProps = {
      ...otherProps,
      isBottomSheet,
      displayClearButton: true,
      onOpen: displayOptions ? onOpen : undefined,
    };

    if (isBottomSheet) {
      Component = InputTextSelectWithBottomSheet;
      compProps.onAddTempItem = onAddTempItem;
    } else {
      Component = InputTextSelect;
    }

    return <Component {...compProps} />;
    //@@viewOff:render
  },
});

export { TextSelectFieldView };
export default TextSelectFieldView;
