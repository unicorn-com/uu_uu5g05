//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice } from "uu5g05";
import Uu5Elements, { Popover, UuGds, _IconPalette as IconPalette } from "uu5g05-elements";
import Config from "../config/config.js";
import IconPicker from "../_internal/icon-picker.js";
import InputBoxExtension from "../_internal/input-box-extension.js";
import withValidationMap from "../with-validation-map.js";
import withValidationInput from "../with-validation-input.js";
import { required } from "../config/validations.js";
import usePicker from "../_internal/use-picker.js";
//@@viewOff:imports

const ValidationInput = withValidationInput(InputBoxExtension);

const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;

const _IconInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "IconInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...IconPicker.propTypes,
    ...InputBoxExtension.propTypes,
    iconOpen: PropTypes.string,
    iconClosed: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...IconPicker.defaultProps,
    ...InputBoxExtension.defaultProps,
    iconOpen: "uugds-menu-up",
    iconClosed: "uugds-menu-down",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      categoryList,
      initialCategory,
      value,
      iconRight,
      iconOpen,
      iconClosed,
      onIconRightClick,
      onChange,
      iconRightList: propsIconRightList,
      required: propsRequired,
      ...otherProps
    } = props;
    const { size } = otherProps;

    const { isMobileOrTablet, browserName } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;

    let { displayPicker, setDisplayPicker, inputProps, popoverProps, pickerProps, input } = usePicker(
      props,
      null,
      null,
      { preserveInputFocus: false },
    );

    function handleIconPickerChange(e) {
      setDisplayPicker(false);

      if (typeof onChange === "function") {
        onChange(e);
      }

      // temp fix, need to solve better handling of onFocus & onBlur
      input.focus();
    }

    let iconRightList = propsIconRightList || [];
    if (!iconRightList.length && iconRight) {
      // Use iconRight only if iconRightList isnt defined (same behavior as withExtensionInput)
      iconRightList = [{ icon: iconRight, onClick: onIconRightClick }];
    }

    if (!props.readOnly && !props.disabled) {
      let openStateIcon = displayPicker ? iconOpen : iconClosed;
      if (openStateIcon) {
        iconRightList = [...iconRightList, { icon: openStateIcon }];
      }

      // remove clear button
      let { iconRight, onIconRightClick, onIconLeftClick, ...otherInputProps } = inputProps;
      inputProps = otherInputProps;
    }
    //@@viewOff:private

    //@@viewOn:render
    const padding = UuGds.SpacingPalette.getValue(["relative", "c"], { height: 32 });

    return (
      <>
        <ValidationInput
          {...otherProps}
          {...inputProps}
          iconRightList={iconRightList}
          padding={{ left: padding }}
          onClick={() => setDisplayPicker(true)}
          role="combobox"
          width="max-content"
          value={value}
          required={propsRequired}
          validateOnChange
        >
          {renderIcon(value, containerSize, props.borderRadius, props.categoryList)}
        </ValidationInput>
        {displayPicker && (
          <Popover {...popoverProps} className={CLASS_NAMES.popover({ browserName })}>
            {({ scrollRef }) => {
              return (
                <IconPicker
                  {...pickerProps}
                  categoryList={categoryList}
                  onSelect={handleIconPickerChange}
                  value={value}
                  initialCategory={initialCategory}
                  className={CLASS_NAMES.iconPicker()}
                  scrollElementRef={scrollRef}
                  maxHeight={376}
                  required={propsRequired}
                  colorScheme={otherProps.colorScheme}
                />
              );
            }}
          </Popover>
        )}
      </>
    );
    //@@viewOff:render
  },
});
//@@viewOn:helpers
const CLASS_NAMES = {
  icon: (customComponent) =>
    Config.Css.css({
      pointerEvents: "none",
      fontSize: customComponent ? undefined : "1.7em",
    }),
  popover: ({ browserName }) =>
    Config.Css.css({
      width: browserName === "safari" ? 316 : 312,
      display: "flex",
      flexDirection: "column",
    }),
  iconPicker: () => Config.Css.css({ minHeight: 0 }),
};

function renderIcon(value, size, borderRadius, categoryList = []) {
  let customCategories = categoryList.filter((category) => typeof category === "object");
  let foundIcon;
  for (let i = 0; i < customCategories.length; i++) {
    foundIcon = customCategories[i].itemList?.find((icon) => icon.value === value);
    if (foundIcon) break;
  }
  if (!foundIcon && value) {
    foundIcon = { icon: value };
  }
  return (
    <IconPalette.Item
      data={foundIcon}
      size={size}
      borderRadius={borderRadius}
      insideInputBox
      className={CLASS_NAMES.icon(!!foundIcon?.component)}
    />
  );
}
//@@viewOff:helpers
const IconInput = withValidationMap(_IconInput, { required: required() });

export { IconInput };
export default IconInput;
