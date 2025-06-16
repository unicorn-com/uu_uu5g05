//@@viewOn:imports
import { createVisualComponent, useEffect, Utils } from "uu5g05";
import Config from "../../config/config.js";
import InputSelect from "./input-select.js";
import withSelectBottomSheet from "./with-select-bottom-sheet.js";
import useBottomSheet from "./use-bottom-sheet.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:helpers
const InputSelectWithBottomSheet = withSelectBottomSheet(InputSelect);
//@@viewOff:helpers

const SelectFieldView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SelectFieldView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: InputSelect.propTypes,
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: InputSelect.defaultProps,
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onOpen, ...otherProps } = props;
    const { value, displayOptions } = otherProps;

    const { isBottomSheet: _isBottomSheet } = useBottomSheet();
    const isBottomSheet = displayOptions && _isBottomSheet;

    useEffect(() => {
      if (!displayOptions) onOpen(new Utils.Event({ value: true }));
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [displayOptions]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const Component = isBottomSheet ? InputSelectWithBottomSheet : InputSelect;

    const compProps = {
      ...otherProps,
      displayedValue: value,
      onOpen: displayOptions ? onOpen : undefined,
      isBottomSheet,
    };

    return <Component {...compProps} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SelectFieldView };
export default SelectFieldView;
//@@viewOff:exports
