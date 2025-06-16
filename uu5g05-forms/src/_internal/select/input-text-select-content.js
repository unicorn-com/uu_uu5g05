//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice, Utils } from "uu5g05";
import { Input, UuGds } from "uu5g05-elements";
import Config from "../../config/config.js";
import InputTextAutocomplete from "./input-text-autocomplete.js";
import InputSelectTagList from "./input-select-tag-list.js";
import { TAG_HEIGHT, TAG_SIZE_CFG, TAG_SPACE } from "./tools.js";
//@@viewOff:imports

//@@viewOn:constants
const CONTAINER_SIZE_MAP_MOBILE = Input._CONTAINER_SIZE_MAP_MOBILE;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  singleValue: () =>
    Config.Css.css({
      gridArea: "1 / 1 / auto / auto",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
    }),
  hiddenInput: (height) =>
    Config.Css.css({
      background: "transparent",
      opacity: 1,
      font: "inherit",
      width: 0,
      border: 0,
      margin: 0,
      outline: 0,
      padding: 0,
      height,
    }),
  autocompleteWrapper: (size) =>
    Config.Css.css({ display: "grid", alignItems: "center", flexGrow: 1, flexBasis: 48, margin: TAG_SPACE[size] / 2 }), // min width 48px
  autocompleteHidden: () => Config.Css.css({ width: 0, height: 0, overflow: "hidden" }),
  autocomplete: (height) =>
    Config.Css.css({
      height,
      gridArea: "1 / 1 / auto / auto",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function getItemString({ text, children, value }) {
  let itemString = children;

  if (typeof itemString === "object" && !Utils.Element.isValid(itemString)) {
    itemString = Utils.Language.getItem(itemString);
  }

  if (typeof itemString !== "string") itemString = text || value || undefined;

  return itemString;
}
//@@viewOff:helpers

const InputTextSelectContent = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputTextSelectContent",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputTextAutocomplete.propTypes,
    ...InputSelectTagList.propTypes,
    selectedItemList: PropTypes.array,
    multiple: PropTypes.bool,
    searchValue: PropTypes.string,
    displayTags: PropTypes.bool,
    focused: PropTypes.bool,
    isBottomSheet: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputTextAutocomplete.defaultProps,
    ...InputSelectTagList.defaultProps,
    selectedItemList: [],
    multiple: false,
    searchValue: undefined,
    displayTags: false,
    focused: false,
    isBottomSheet: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      selectedItemList,
      size,
      multiple,
      searchValue,
      placeholder,
      onRemoveTag,
      displayTags,
      focused,
      isBottomSheet,
      readOnly,
      disabled,
      ...otherProps
    } = props;

    const { isMobileOrTablet } = useDevice();

    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
    const [, lineType, lineSize] = TAG_SIZE_CFG[containerSize || "m"] || [];

    let height = TAG_HEIGHT;
    if (containerSize && lineSize) {
      ({ h: height } = UuGds.getValue(["SizingPalette", "spot", lineType, lineSize]));
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let tagList, textValue, usedPlaceholder;
    if (selectedItemList.length && displayTags) {
      if (multiple) {
        tagList = (
          <InputSelectTagList
            tagList={selectedItemList}
            size={size}
            onRemoveTag={onRemoveTag}
            readOnly={readOnly}
            colorScheme={otherProps.colorScheme}
          />
        );
      } else if (searchValue === undefined) {
        if (focused) textValue = getItemString(selectedItemList[0]);
        if (textValue === undefined) {
          tagList = (
            <div className={Css.singleValue()}>
              {/* Input to establish baseline */}
              <input className={Css.hiddenInput(height)} readOnly disabled={disabled} tabIndex={-1} />
              {selectedItemList[0].children}
            </div>
          );
        }
      }
    } else if (placeholder && !searchValue) {
      usedPlaceholder = placeholder;
    }

    if (!textValue) {
      textValue = searchValue;
    }

    return (
      <>
        {multiple ? tagList : null}
        <div
          className={
            isBottomSheet && multiple && displayTags ? Css.autocompleteHidden() : Css.autocompleteWrapper(containerSize)
          }
        >
          {!multiple ? tagList : null}
          <InputTextAutocomplete
            {...otherProps}
            readOnly={isBottomSheet || readOnly}
            value={textValue || ""}
            placeholder={usedPlaceholder}
            className={Css.autocomplete(height)}
            inputDisabled={disabled}
          />
        </div>
      </>
    );
    //@@viewOff:render
  },
});

export default InputTextSelectContent;
