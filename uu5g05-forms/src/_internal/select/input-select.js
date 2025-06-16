import { createVisualComponent, PropTypes, Utils, useRef, useEffect } from "uu5g05";
import Config from "../../config/config.js";
import usePersistFocus from "../use-persist-focus.js";
import useSelectKeyboardHandling from "./use-select-keyboard-handling.js";
import InputSelectBase from "./input-select-base.js";
import InputSelectTagList from "./input-select-tag-list.js";
import { removeItem } from "./tools.js";

//@@viewOn:constants
const { onClosePicker, displayEmptyPicker, ...inputPropTypes } = InputSelectBase.propTypes;
const {
  onClosePicker: _onClosePicker,
  displayEmptyPicker: _displayEmptyPicker,
  ...inputDefaultProps
} = InputSelectBase.defaultProps;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  singleValue: () =>
    Config.Css.css({
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function removeAll(onChange) {
  return (e) => {
    e.stopPropagation();
    onChange(new Utils.Event({ value: [] }, e));
  };
}
//@@viewOff:helpers

const InputSelect = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputSelect",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...inputPropTypes,
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        icon: PropTypes.icon,
        iconRight: PropTypes.oneOfType([PropTypes.bool, PropTypes.icon]),
        text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
        focused: PropTypes.bool,
      }),
    ),
    itemFocus: PropTypes.shape({
      value: PropTypes.any,
      index: PropTypes.number,
      setByValue: PropTypes.func,
    }),
    selectedItemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        icon: PropTypes.icon,
        iconRight: PropTypes.oneOfType([PropTypes.bool, PropTypes.icon]),
        text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        children: PropTypes.any,
        focused: PropTypes.bool,
      }),
    ),
    selectedItemFocus: PropTypes.shape({
      value: PropTypes.any,
      index: PropTypes.number,
      setByValue: PropTypes.func,
    }),
    onOpen: PropTypes.func,
    displayTags: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...inputDefaultProps,
    itemList: [],
    itemFocus: {},
    selectedItemList: [],
    selectedItemFocus: {},
    onOpen: () => {},
    displayTags: true,
    displayOptions: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      onChange: onChangeProp,
      elementRef,
      elementAttrs,
      itemList,
      itemFocus,
      selectedItemList,
      selectedItemFocus,
      onFocus,
      onBlur,
      displayClearButton,
      displayTags,
      onOpen,
      onInternalFocus,
      displayedValue,
      iconRightList,
      iconRight,
      onIconRightClick,
      iconOpen,
      iconClosed,
      ...otherProps
    } = props;
    const { value, multiple, size, disabled, readOnly, open, displayOptions, required, isBottomSheet } = otherProps;

    const inputBoxRef = useRef();

    const [focus, handleFocus, handleBlur] = usePersistFocus({ onFocus, onBlur, disabled: disabled || readOnly });

    useEffect(() => {
      onInternalFocus(new Utils.Event({ value: focus }));
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [focus]);

    function openPicker(newValue) {
      onOpen(new Utils.Event({ value: newValue }));
    }

    function handleChange(e) {
      if (!multiple) openPicker(false);

      onChangeProp(e);
    }

    function handleClickInputBox(e) {
      if (e.defaultPrevented) return;
      openPicker(!open);
    }

    function handlePickerItemFocus(e) {
      itemFocus.setByValue(e.data.value?.value);
      itemFocus.setByChildren(e.data.value?.children);
    }

    function handleSelectedItemFocus(e) {
      selectedItemFocus.setByValue(e.data.value?.value);
      selectedItemFocus.setByChildren(e.data.value?.children);
    }

    const handlePickerKeyDown = useSelectKeyboardHandling(
      itemList,
      selectedItemList,
      itemFocus.value,
      itemFocus.children,
      handlePickerItemFocus,
      handleChange,
      {
        multiple,
        required,
        shouldHandleKey: (e) => {
          if (
            open &&
            ["Tab", "Enter", "NumpadEnter", " ", "End", "Home", "ArrowUp", "ArrowDown", "a", "Escape"].indexOf(e.key) >
              -1
          ) {
            return true;
          }
          return !displayOptions && ["Enter", "NumpadEnter", "ArrowUp", "ArrowDown", "End", "Home"].indexOf(e.key) > -1;
        },
        openPicker,
      },
    );

    const handleInputBoxKeyDown = useSelectKeyboardHandling(
      selectedItemList,
      selectedItemList,
      selectedItemFocus.value,
      selectedItemFocus.children,
      handleSelectedItemFocus,
      handleChange,
      {
        multiple,
        reverseSelectionOrder: true,
        shouldHandleKey: (e) => {
          return ["Backspace", "Delete", "ArrowLeft", "ArrowRight"].indexOf(e.key) > -1;
        },
        openPicker,
      },
    );

    function handleKeyDown(e) {
      if (typeof elementAttrs?.onKeyDown === "function") elementAttrs?.onKeyDown(e);
      if (e.defaultPrevented) return;

      if (!open && displayOptions && ["Enter", "NumpadEnter", " "].indexOf(e.key) > -1) {
        e.preventDefault();
        openPicker(true);
        return;
      }

      handlePickerKeyDown(e);
      handleInputBoxKeyDown(e);
    }

    function getIconRightList() {
      let newIconRightList = iconRightList ?? [];
      if (!iconRightList.length && iconRight) {
        newIconRightList = [{ icon: iconRight, onClick: onIconRightClick }];
      }

      if (readOnly) return newIconRightList;

      if (!disabled && !required && displayClearButton) {
        const _displayedValue = displayedValue ?? value;
        if (_displayedValue.length && _displayedValue[0].value !== undefined) {
          if (displayTags) {
            newIconRightList = [{ icon: "uugds-close", onClick: removeAll(handleChange) }, ...newIconRightList];
          }
        }
      }

      if (displayOptions) {
        const openStateIcon = open ? iconOpen : iconClosed;
        if (openStateIcon) {
          newIconRightList = [...newIconRightList, { icon: openStateIcon }];
        }
      }

      return newIconRightList;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    function renderTags() {
      if (!displayTags) return;

      if (multiple && selectedItemList.length) {
        return (
          <InputSelectTagList
            size={size}
            tagList={selectedItemList}
            onRemoveTag={removeItem(onChangeProp, value)}
            readOnly={readOnly}
            elementAttrs={{ role: "list" }}
            colorScheme={otherProps.colorScheme}
          />
        );
      }

      if (selectedItemList[0]?.children) {
        return Utils.Element.isValid(selectedItemList[0]?.children) ? (
          selectedItemList[0]?.children
        ) : (
          <div className={Css.singleValue()}>{selectedItemList[0]?.children}</div>
        );
      }
    }

    return (
      <InputSelectBase
        {...otherProps}
        displayedValue={!displayTags ? [] : displayedValue}
        value={value}
        itemList={itemList}
        focused={focus}
        onClick={handleClickInputBox}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onClosePicker={() => {
          openPicker(false);
          isBottomSheet && inputBoxRef.current?.focus();
        }}
        elementRef={Utils.Component.combineRefs(elementRef, inputBoxRef)}
        elementAttrs={{
          ...elementAttrs,
          onKeyDown: readOnly ? undefined : handleKeyDown,
          onMouseDown: (e) => {
            if (typeof elementAttrs?.onMouseDown === "function") elementAttrs?.onMouseDown(e);
            if (focus) e.preventDefault();
          },
        }}
        displayClearButton={displayTags && displayClearButton}
        iconRightList={getIconRightList()}
      >
        {renderTags()}
      </InputSelectBase>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { InputSelect };
export default InputSelect;
//@@viewOff:exports
