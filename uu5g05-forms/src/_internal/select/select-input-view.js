//@@viewOn:imports
import { createComponent, useMemo, useState, Utils, PropTypes } from "uu5g05";
import Config from "../../config/config.js";
import SelectContext from "./select-context.js";
import SelectFieldView from "./select-field-view.js";
import useSelect from "./use-select.js";
import { useDependencyValue } from "./use-dependency-value.js";
import { sortByArray } from "./tools.js";
import { getPath } from "./multi-level-tools.js";
import useOpenPicker from "../use-open-picker.js";
//@@viewOff:imports

//@@viewOn:constants
const { open, onOpen, itemFocus, selectedItemList, selectedItemFocus, onInternalFocus, ...selectFieldViewPropTypes } =
  SelectFieldView.propTypes;
const {
  open: _open,
  onOpen: _onOpen,
  itemFocus: _itemFocus,
  selectedItemList: _selectedItemList,
  selectedItemFocus: _selectedItemFocus,
  onInternalFocus: _onInternalFocus,
  ...selectFieldViewDefaultProps
} = SelectFieldView.defaultProps;
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

const SelectInputView = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SelectInputView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...selectFieldViewPropTypes,
    disableOptionReorder: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...selectFieldViewDefaultProps,
    disableOptionReorder: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, itemList: itemListProp, disableOptionReorder: propsDisableOptionReorder, ...otherProps } = props;
    const { value, multilevel, multiple } = otherProps;
    const disableOptionReorder =
      typeof propsDisableOptionReorder === "boolean" ? propsDisableOptionReorder : itemListProp?.length < 9;

    const [internalFocus, setInternalFocus] = useState(false);
    const [level, setLevel] = useState([]);

    const [open, setOpen] = useOpenPicker();

    // Sorting and temporal duplication in multilevel
    const deps = useMemo(() => ({ open, level }), [open, level]);
    const dependencyValue = useDependencyValue(disableOptionReorder ? [] : value, disableOptionReorder ? {} : deps);

    const sortedItemList = sortByArray(itemListProp, dependencyValue);

    // Focus is necessary handle here to maintain connection between input and options.
    const {
      picker: { itemList, focus: itemFocus },
      selected: { itemList: selectedItemList, focus: selectedItemFocus },
    } = useSelect(sortedItemList, value, open, internalFocus);

    function handleItemMouseDown(e) {
      itemFocus.setByValue(e.data.value?.value);
      itemFocus.setByChildren(e.data.value?.children);
    }

    function getItemFocus() {
      if (!multilevel) return itemFocus;

      return {
        ...itemFocus,
        setByValue: (e) => {
          const focusedItem = sortedItemList.find((item) => item.value === e);

          if (!level.length && !focusedItem?.parent) {
            itemFocus.setByValue(e);
            return;
          }
          if (level.length && focusedItem?.parent?.value === level[level.length - 1]) {
            itemFocus.setByValue(e);
          }
        },
      };
    }

    function handleChangeLevel(e) {
      setLevel((prevState) => {
        const currLevel = e.data.value;

        if (Utils.Object.deepEqual(prevState, currLevel)) return prevState;

        if (prevState.length > currLevel.length) {
          const prevLevel = prevState[prevState.length - 1];
          itemFocus.setByValue(prevLevel);
        } else {
          const nextLevel = currLevel[currLevel.length - 1];
          const focusedItem = sortedItemList.find((item) => item.parent?.value === nextLevel);
          itemFocus.setByValue(focusedItem?.value);
        }

        return e.data.value;
      });
    }

    function handleOpen(e) {
      setOpen(e.data.value);
      if (!multilevel) return;
      if (!e.data.value) return;

      let path = [];
      // For single selection there is always an array with one value, or it is empty
      if (!multiple && value[0]?.parent) path = getPath(value[0].parent);

      setLevel(path);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const textSelectProps = {
      ...otherProps,
      open,
      itemList: itemList.map((item) => ({ ...item, onMouseDown: handleItemMouseDown })),
      itemFocus: getItemFocus(),
      selectedItemList,
      selectedItemFocus,
      onOpen: handleOpen,
      onInternalFocus: (e) => setInternalFocus(e.data.value),
      onChangeLevel: handleChangeLevel,
      level,
    };

    return children ? (
      <SelectContext.Provider value={textSelectProps}>
        {typeof children === "function" ? children(textSelectProps) : children}
      </SelectContext.Provider>
    ) : (
      <SelectFieldView {...textSelectProps} />
    );
    //@@viewOff:render
  },
});

export { SelectInputView };
export default SelectInputView;
