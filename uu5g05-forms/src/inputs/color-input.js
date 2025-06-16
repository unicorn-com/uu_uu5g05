//@@viewOn:imports
import { PropTypes, Utils, createVisualComponent, useState, useUpdateEffect, useDevice } from "uu5g05";
import Uu5Elements, { ColorPalette, Popover, UuGds } from "uu5g05-elements";
import Config from "../config/config.js";
import ColorPicker from "../_internal/color/color-picker.js";
import InputBoxExtension from "../_internal/input-box-extension.js";
import withValidationMap from "../with-validation-map.js";
import withValidationInput from "../with-validation-input.js";
import { required } from "../config/validations.js";
import usePicker from "../_internal/use-picker.js";
import useValidatorMap from "../use-validator-map.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

const ValidationInput = withValidationInput(InputBoxExtension);

const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;

const _ColorInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ColorInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputBoxExtension.propTypes,
    ...ColorPicker.propTypes,
    value: PropTypes.oneOfType([PropTypes.string, ColorPicker.propTypes.value]),
    iconOpen: PropTypes.string,
    iconClosed: PropTypes.string,
    iconRight: PropTypes.string,
    valueType: PropTypes.oneOf(["cssColor", "object", "colorScheme"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputBoxExtension.defaultProps,
    ...ColorPicker.defaultProps,
    iconOpen: "uugds-menu-up",
    iconClosed: "uugds-menu-down",
    valueType: "cssColor",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      value,
      valueType,
      iconRight,
      iconOpen,
      iconClosed,
      onIconRightClick,
      onChange,
      displayShade,
      displayOpacity,
      displayCustomColor,
      required: propsRequired,
      presetList,
      ...otherProps
    } = props;
    const { size } = otherProps;

    const { isMobileOrTablet } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;

    let { displayPicker, setDisplayPicker, inputProps, popoverProps, pickerProps, input } = usePicker(
      props,
      null,
      null,
      { preserveInputFocus: false },
    );

    const normalizedValue = normalizeInputValue(value, valueType);
    // const normalizedValue = getNormalizedValue(value); // Normalize into rgba to be stable
    const [pickerValue, setPickerValue] = useState(normalizedValue);

    const _value = valueType === "colorScheme" ? normalizedValue?.colorScheme : normalizedValue?.cssColor;
    useUpdateEffect(() => {
      // only valid dependency is css color of normalized value .. all other values are computed from it
      setPickerValue(normalizeInputValue(_value, valueType));
    }, [_value, valueType]);

    function handleColorPickerChange(e) {
      let value = e.data.value;
      if (
        typeof onChange === "function" &&
        ((valueType === "colorScheme" && value !== normalizedValue?.colorScheme) ||
          (valueType === "object" && value?.cssColor !== normalizedValue?.cssColor) ||
          (valueType === "cssColor" && value !== normalizedValue?.cssColor))
      ) {
        // Only call onChange when color (state) is different from normalized value (props)
        if (value && valueType === "cssColor") value = value.cssColor;
        onChange(new Utils.Event({ value }, e));
      }
      // close picker if there is no other option to select or value is cleared
      if ((!displayCustomColor && !displayOpacity && !displayShade) || !e.data.value) {
        handlePopoverClose();
      } else {
        setPickerValue(e.data.value);
      }
    }

    function handlePopoverClose() {
      setDisplayPicker(false);
      // temp fix, need to solve better handling of onFocus & onBlur
      input.focus();
    }
    //@@viewOff:private

    //@@viewOn:render
    const padding = UuGds.SpacingPalette.getValue(["relative", "c"], { height: 32 });

    let iconRightList = props.iconRightList || [];
    if (!iconRightList.length && iconRight) {
      // Use iconRight only if iconRightList isnt defined (same behavior as withExtensionInput)
      iconRightList = [{ icon: iconRight, onClick: onIconRightClick }];
    }

    // add select icon to iconRightList and remove clear button (not used in this input)
    if (!props.readOnly) {
      const openStateIcon = displayPicker ? iconOpen : iconClosed;
      if (openStateIcon) {
        iconRightList = [...iconRightList, { icon: openStateIcon }];
      }
      // remove clear button
      let { iconRight, onIconRightClick, onIconLeftClick, ...otherInputProps } = inputProps;
      inputProps = otherInputProps;
    }

    const onValidate = useValidatorMap(props, {
      badValue: () => value == null || !!pickerValue,
    });

    return (
      <>
        <ValidationInput
          {...otherProps}
          {...inputProps}
          elementAttrs={{ ...inputProps.elementAttrs, ...otherProps.elementAttrs }}
          onValidate={onValidate}
          iconRightList={iconRightList}
          padding={{ left: padding }}
          onClick={() => setDisplayPicker(true)}
          role="combobox"
          width="auto"
          value={_value}
          required={propsRequired}
          validateOnChange
        >
          <ColorPalette.Item
            color={
              normalizedValue?.cssColor && valueType === "colorScheme"
                ? `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.2) 100%), ${normalizedValue.cssColor}`
                : normalizedValue?.cssColor
            }
            borderRadius={props.borderRadius}
            size={containerSize}
            insideInputBox
          />
        </ValidationInput>
        {displayPicker && (
          <Popover
            {...popoverProps}
            onClose={(e) => handlePopoverClose(e, valueType === "colorScheme" ? pickerValue?.colorScheme : pickerValue)}
            className={CLASS_NAMES.popover(props)}
          >
            <ColorPicker
              {...pickerProps}
              tabIndex="1"
              onSelect={handleColorPickerChange}
              value={valueType === "colorScheme" ? pickerValue?.colorScheme : pickerValue}
              valueType={valueType === "colorScheme" ? "colorScheme" : "object"}
              displayShade={displayShade}
              displayOpacity={displayOpacity}
              displayCustomColor={displayCustomColor}
              required={propsRequired}
              className={isMobileOrTablet ? CLASS_NAMES.picker() : undefined}
              colorScheme={otherProps.colorScheme}
              presetList={presetList}
            />
          </Popover>
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const CLASS_NAMES = {
  popover: () =>
    Config.Css.css({
      width: 280,
      padding: UuGds.SpacingPalette.getValue(["fixed", "d"]),
    }),
  picker: () => Config.Css.css({ padding: "4px 4px 0 4px" }), // add paddings to display border around selected item
};

const normalizeInputValue = (value, valueType) => {
  if (value && valueType === "colorScheme") {
    value = { colorScheme: value };
  }
  let result = ColorPalette._normalizeInputValue(
    value,
    valueType === "colorScheme" || (valueType === "object" && value?.colorScheme),
  );
  return result;
};
//@@viewOff:helpers

const ColorInput = withValidationMap(_ColorInput, {
  required: required(),
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueColor"] },
    feedback: "error",
  },
});

export { ColorInput };
export default ColorInput;
