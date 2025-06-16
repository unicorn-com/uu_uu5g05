//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, useDevice, useEffect, useRef, Utils, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import ColorPickerControls from "./color-picker-controls.js";
import { getInputComponentColorScheme } from "../tools.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:css
const CLASS_NAMES = {
  main: (isMobileOrTablet) => {
    return Config.Css.css({
      display: "flex",
      flexDirection: "column",
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", isMobileOrTablet ? "e" : "d"]),
      maxWidth: Utils.ScreenSize.XS,
    });
  },
  line: () => Config.Css.css({ margin: 0 }),
};
//@@viewOff:css

//@@viewOn:helpers
function normalizeInputValue(value, valueType) {
  let result;
  if (valueType === "colorScheme") {
    result = typeof value === "string" ? value : undefined;
  } else {
    result = Uu5Elements.ColorPalette._normalizeInputValue(value, valueType === "object" && value?.colorScheme);
  }
  return result;
}
//@@viewOff:helpers

const ColorPicker = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ColorPicker",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onSelect: PropTypes.func,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        cssColor: PropTypes.string,
        colorScheme: PropTypes.string,
        shade: PropTypes.string,
        hex: PropTypes.string,
        opacity: PropTypes.number,
      }),
    ]),
    valueType: PropTypes.oneOf(["colorScheme", "object"]),
    displayShade: PropTypes.bool,
    displayOpacity: PropTypes.bool,
    displayCustomColor: PropTypes.bool,
    colorScheme: PropTypes.colorScheme,
    presetList: PropTypes.arrayOf(
      PropTypes.shape({
        tooltip: PropTypes.string,
        value: PropTypes.oneOfType([
          PropTypes.string, // "#ffffff"
          PropTypes.object, // { c50: "#ffffff" }
        ]),
      }),
    ),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onSelect: undefined,
    value: undefined,
    valueType: "object",
    colorScheme: undefined,
    presetList: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      value,
      valueType,
      onSelect,
      displayCustomColor,
      displayOpacity,
      displayShade,
      required,
      colorScheme,
      presetList,
    } = props;

    value = useMemo(() => normalizeInputValue(value, valueType), [value, valueType]);

    // hide opacity, shade and custom color controls for colorScheme selection
    if (valueType === "colorScheme") {
      displayShade = false;
      displayOpacity = false;
      displayCustomColor = false;
    }

    const { isMobileOrTablet } = useDevice();

    const opacityRef = useRef();

    function handleControlsChange(e) {
      if (typeof onSelect === "function") {
        let { hex, opacity } = e.data;
        if (hex) {
          opacity = opacity || 0;
          let rgbaParts = Utils.Color.toRgba("#" + hex);
          rgbaParts[3] = opacity / 100;
          const hexColor = `#${hex}`;
          let cssColor = opacity === 100 ? hexColor : `rgba(${rgbaParts.join(", ")})`;
          onSelect(new Utils.Event({ value: { ...value, hex: hexColor, opacity, cssColor } }), e);
        } else if (opacity !== undefined) {
          // invalid color do nothing - change of opacity before select color
          // temporal store current opacity in ref
          opacityRef.current = opacity;
        } else {
          onSelect(new Utils.Event({ value: undefined }), e);
        }
      }
    }

    const onSelectRef = useRef();
    onSelectRef.current = onSelect;
    useEffect(() => {
      // Update selected value if, component select opacity before select color
      let opacity = opacityRef.current;
      if (value && value.hex && opacity !== undefined) {
        opacityRef.current = undefined;
        if (typeof onSelectRef.current === "function") {
          let rgbaParts = Utils.Color.toRgba(value.hex);
          rgbaParts[3] = opacity / 100;
          let cssColor = opacity === 100 ? `#${value.hex}` : `rgba(${rgbaParts.join(", ")})`;
          onSelectRef.current(new Utils.Event({ value: { ...value, opacity, cssColor } }));
        }
      }
    }, [value]);

    const clear = (e) => {
      if (typeof onSelect === "function") {
        onSelect(new Utils.Event({ value: undefined }, e));
      }
    };
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, CLASS_NAMES.main(isMobileOrTablet));

    return (
      <div {...attrs}>
        <Uu5Elements.ColorPalette
          value={value}
          valueType={valueType}
          displayShade={displayShade}
          displayOpacity={displayOpacity}
          onSelect={onSelect}
          colorScheme={getInputComponentColorScheme(colorScheme)}
          presetList={presetList}
        />
        {(displayCustomColor || displayOpacity) && (
          <>
            <Uu5Elements.Line significance="subdued" className={CLASS_NAMES.line()} />
            <ColorPickerControls
              rgba={value?.cssColor}
              hex={value?.hex?.replace("#", "")}
              opacity={opacityRef.current ?? value?.opacity}
              onChange={handleControlsChange}
              displayOpacity={displayOpacity}
              displayCustomColor={displayCustomColor}
              colorScheme={colorScheme}
            />
          </>
        )}
        {!required ? (
          <Uu5Elements.Button onClick={clear} width="100%" size={isMobileOrTablet ? "l" : "m"}>
            <Lsi import={importLsi} path={["Color", "clear"]} />
          </Uu5Elements.Button>
        ) : null}
      </div>
    );
    //@@viewOff:render
  },
});

export { ColorPicker };
export default ColorPicker;
