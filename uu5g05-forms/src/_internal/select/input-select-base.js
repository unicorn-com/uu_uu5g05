//@@viewOn:imports
import { createVisualComponent, useRef, PropTypes, Utils, useState } from "uu5g05";
import Config from "../../config/config.js";
import InputBoxExtension from "../input-box-extension.js";
import InputSelectPicker from "./input-select-picker.js";
import InputSelectPickerBottomSheet from "./input-select-picker-bottom-sheet.js";
import MultilevelSelectOptionsView from "./multilevel-select-options-view.js";
import SelectOptionsView from "./select-options-view.js";
import { TAG_SPACE } from "./tools.js";
//@@viewOff:imports

//@@viewOn:css
const Css = {
  inputBox: ({ itemList }) =>
    Config.Css.css({
      "& > div": {
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        cursor: itemList?.length ? undefined : "text",
      },
      flex: "none",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const InputSelectBase = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputSelectBase",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputBoxExtension.propTypes,
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        icon: PropTypes.icon,
        iconRight: PropTypes.icon,
        selectedChildren: PropTypes.node,
        colorScheme: PropTypes.colorScheme,
        disabled: PropTypes.bool,
        heading: PropTypes.bool,
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
        text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      }),
    ).isRequired,
    value: PropTypes.array.isRequired,
    multiple: PropTypes.bool,
    iconOpen: PropTypes.string,
    iconClosed: PropTypes.string,
    open: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    displayClearButton: PropTypes.bool,
    pickerProps: PropTypes.shape({
      header: PropTypes.node,
      footer: PropTypes.node,
    }),
    displayEmptyPicker: PropTypes.bool,
    displayOptions: PropTypes.bool,
    multilevel: PropTypes.bool,
    onChangeLevel: MultilevelSelectOptionsView.propTypes.onChangeLevel,
    level: MultilevelSelectOptionsView.propTypes.level,
    searchValue: MultilevelSelectOptionsView.propTypes.searchValue,
    displayCheckboxes: SelectOptionsView.propTypes.displayCheckboxes,
    isBottomSheet: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputBoxExtension.defaultProps,
    itemList: [],
    multiple: undefined,
    iconOpen: "uugds-menu-up",
    iconClosed: "uugds-menu-down",
    value: [],
    open: false,
    onChange: undefined,
    displayClearButton: false,
    displayEmptyPicker: false,
    displayOptions: true,
    multilevel: false,
    onChangeLevel: MultilevelSelectOptionsView.defaultProps.onChangeLevel,
    level: MultilevelSelectOptionsView.defaultProps.level,
    searchValue: MultilevelSelectOptionsView.defaultProps.searchValue,
    displayCheckboxes: SelectOptionsView.defaultProps.displayCheckboxes,
    isBottomSheet: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      elementAttrs,
      multiple,
      itemList,
      elementRef,
      onChange,
      value,
      className,
      open,
      children,
      focused,
      displayedValue,
      pickerProps,
      displayOptions,
      picker,
      onClosePicker,
      displayEmptyPicker,
      onChangeLevel,
      multilevel,
      level,
      searchValue,
      displayCheckboxes,
      isBottomSheet,
      ...otherProps
    } = props;
    const { size, colorScheme } = otherProps;

    const [id] = useState(() => Utils.String.generateId());
    const inputBoxRef = useRef();

    const _displayedValue = displayedValue || value;
    const margin = TAG_SPACE[size] / 2;
    const pickerId = (otherProps.id || id) + "-picker";
    const displayPicker = displayOptions && open && (displayEmptyPicker || itemList.length > 0);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const PickerComponent = isBottomSheet ? InputSelectPickerBottomSheet : InputSelectPicker;

    return (
      <>
        <InputBoxExtension
          {...otherProps}
          className={Utils.Css.joinClassName(Css.inputBox(props), className)}
          elementRef={Utils.Component.combineRefs(elementRef, inputBoxRef)}
          extensionPosition={multiple ? "top" : undefined}
          multipleRows={multiple}
          focused={focused}
          padding={multiple && _displayedValue.length ? { left: margin, right: margin } : undefined}
          role="combobox"
          elementAttrs={{
            ...elementAttrs,
            "aria-live": "polite",
            "aria-haspopup": "listbox",
            "aria-expanded": open,
            "aria-controls": pickerId,
            "aria-labelledby": otherProps.id ? [otherProps.id, otherProps.id + "-label"].join(" ") : undefined,
          }}
        >
          {children}
        </InputBoxExtension>
        {displayPicker ? (
          <PickerComponent
            {...pickerProps}
            element={inputBoxRef.current}
            id={pickerId}
            onClose={onClosePicker}
            elementAttrs={{ onMouseDown: (e) => e.preventDefault() }}
            multilevel={multilevel}
          >
            {(selectOptionsProps, reposition) => {
              const newSelectOptionsProps = {
                ...selectOptionsProps,
                value,
                itemList,
                multiple,
                size,
                onChange,
                colorScheme,
              };
              return multilevel ? (
                <MultilevelSelectOptionsView
                  {...newSelectOptionsProps}
                  scrollIndicator={"disappear"}
                  level={level}
                  onChangeLevel={onChangeLevel}
                  searchValue={searchValue}
                  displayCheckboxes={displayCheckboxes}
                  onReposition={reposition}
                />
              ) : (
                <SelectOptionsView
                  scrollIndicator={"disappear"}
                  {...newSelectOptionsProps}
                  displayCheckboxes={displayCheckboxes}
                />
              );
            }}
          </PickerComponent>
        ) : null}
      </>
    );
    //@@viewOff:render
  },
});

export { InputSelectBase };
export default InputSelectBase;
