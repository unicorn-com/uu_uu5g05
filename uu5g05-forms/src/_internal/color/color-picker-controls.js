//@@viewOn:imports
import { createVisualComponent, PropTypes, Lsi, Utils, useState, useUpdateEffect, useDevice } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import Text from "../../text.js";
import Number from "../../number.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

const ColorPickerControls = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ColorPickerControls",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onChange: PropTypes.func,
    rgba: PropTypes.string,
    hex: PropTypes.string,
    opacity: PropTypes.number,
    displayOpacity: PropTypes.bool,
    displayCustomColor: PropTypes.bool,
    colorScheme: PropTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onChange: undefined,
    rgba: undefined,
    hex: undefined,
    opacity: undefined,
    colorScheme: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { rgba, opacity, hex, onChange, displayOpacity, displayCustomColor, colorScheme } = props;

    const { isMobileOrTablet } = useDevice();

    const [hexState, setHexState] = useState(hex);
    const [opacityState, setOpacityState] = useState(opacity || 100);
    const [error, setError] = useState();

    useUpdateEffect(() => {
      setHexState(hex);
      setOpacityState(opacity);
    }, [hex, opacity]);

    function handleHexChange(e) {
      let { value } = e.data;
      if (value?.startsWith("#")) value = value.substring(1);
      if (value.match(/^$|^[0-9a-fA-F]*$/)) setHexState(value);
    }

    function handleOpacityChange(e) {
      if ((e.data.value >= 0 && e.data.value <= 100) || e.data.value === undefined) {
        let newOpacity = e.data.value === undefined ? 0 : e.data.value;
        setOpacityState(newOpacity);
        if (typeof onChange === "function" && (hexState !== hex || newOpacity !== opacity)) {
          onChange(new Utils.Event({ hex: hexState, opacity: newOpacity }), e);
        }
      }
    }

    function handleBlur(e) {
      if (typeof onChange === "function" && (hexState !== hex || opacityState !== opacity)) {
        onChange(new Utils.Event({ hex: hexState, opacity: opacityState }), e);
      }
    }
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, CLASS_NAMES.main(displayCustomColor && displayOpacity));

    return (
      <div {...attrs}>
        {displayCustomColor && (
          <Text
            label="HEX"
            value={hexState}
            prefix="#"
            pattern="^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
            size={isMobileOrTablet ? "l" : "m"}
            layout="vertical" // We need something like min-content:auto, but thats is not currently supported
            onChange={handleHexChange}
            onBlur={handleBlur}
            onValidationEnd={(e) => {
              if (Array.isArray(e.data.errorList) && e.data.errorList.length) {
                setError({
                  code: "invalidValue",
                  feedback: "error",
                  message: {
                    en: "Invalid HEX.",
                  },
                });
                //setHexState(undefined);
              } else {
                setError(undefined);
              }
            }}
            feedback={error ? error.feedback : undefined}
            message={error ? error.message : undefined}
            colorScheme={colorScheme}
          />
        )}
        {displayOpacity && (
          <Number
            label={<Lsi import={importLsi} path={["Color", "opacity"]} />}
            value={opacityState}
            suffix="%"
            min={0}
            max={100}
            step={1}
            size={isMobileOrTablet ? "l" : "m"}
            layout="vertical" // We need something like min-content:auto, but thats is not currently supported
            onChange={handleOpacityChange}
            onBlur={handleBlur}
            colorScheme={colorScheme}
          />
        )}
        <div className={CLASS_NAMES.sample()}>
          <Uu5Elements.ColorPalette.Item color={rgba} borderRadius="moderate" size={isMobileOrTablet ? "l" : "m"} />
        </div>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const CLASS_NAMES = {
  main: (showBothInputs) =>
    Config.Css.css({
      maxWidth: Utils.ScreenSize.XS,
      display: "grid",
      minWidth: 0,
      gridTemplateColumns: showBothInputs ? "7fr 5fr auto" : "1fr auto",
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]),
    }),
  sample: () =>
    Config.Css.css({
      display: "grid",
      alignSelf: "end",
    }),
  button: () =>
    Config.Css.css({
      gridColumn: "1/4",
    }),
};
//@@viewOff:helpers

export { ColorPickerControls };
export default ColorPickerControls;
