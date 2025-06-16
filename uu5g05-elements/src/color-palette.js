//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, Lsi, useDevice } from "uu5g05";
import Config from "./config/config.js";
import ColorSchemePalette from "./_color-palette/color-scheme-palette.js";
import ColorShadePalette from "./_color-palette/color-shade-palette.js";
import ColorOpacityPalette from "./_color-palette/color-opacity-palette.js";
import ColorSpot from "./_color-palette/color-spot.js";
import Text from "./text.js";
import Line from "./line.js";
import UuGds from "./_internal/gds.js";
import { getColorMap, getColorSchemeMap } from "./_color-palette/colors.js";
import importLsi from "./lsi/import-lsi.js"; // FIXME - no data for ru translation
//@@viewOff:imports

const USE_FIXED_COLORS = true;

export const ColorPalette = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ColorPalette",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
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
    onSelect: PropTypes.func,
    displayOpacity: PropTypes.bool,
    displayShade: PropTypes.bool,
    valueType: PropTypes.oneOf(["cssColor", "object", "colorScheme"]),
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
    value: undefined,
    onSelect: undefined,
    valueType: "cssColor",
    colorScheme: "primary",
    presetList: undefined,
  },
  //@@viewOff:defaultProps

  //@@viewOn:render
  render(props) {
    const [attrs, { value, onSelect, valueType, presetList, ...componentProps }] = Utils.VisualComponent.splitProps(
      props,
      CLASS_NAMES.main(),
    );

    let { displayOpacity, displayShade } = componentProps;

    // hide opacity and shade selects for colorScheme selection
    if (valueType === "colorScheme") {
      displayOpacity = false;
      displayShade = false;
    }

    let paletteProps;
    let objectValue;

    if (valueType === "colorScheme") {
      paletteProps = {
        value: value,
        onSelect,
        valueType: "colorScheme",
      };
    } else {
      objectValue = normalizeInputValue(value);
      const onValueSelect = (e) => {
        if (typeof onSelect === "function") {
          let result = normalizeOutputValue(objectValue, e.data, valueType);
          onSelect(new Utils.Event({ value: valueType === "cssColor" ? result.cssColor : result }, e));
        }
      };
      paletteProps = { value: objectValue.hex, onSelect: onValueSelect };
    }

    const { isMobileOrTablet } = useDevice();
    const paletteComponentProps = { size: isMobileOrTablet ? "l" : "m" };
    const displayPresets = Array.isArray(presetList) && presetList.length > 0;

    return (
      <div {...attrs}>
        <ColorSchemePalette {...componentProps} {...paletteProps} componentProps={paletteComponentProps} />
        {displayPresets && <Line margin={8} significance="subdued" />}
        {displayPresets && (
          <ColorSchemePalette
            {...componentProps}
            {...paletteProps}
            presetList={presetList}
            componentProps={paletteComponentProps}
          />
        )}
        {displayShade && (
          <>
            <Text
              className={CLASS_NAMES.text(isMobileOrTablet)}
              category="interface"
              segment="content"
              type={isMobileOrTablet ? "large" : "medium"}
              colorScheme="dim"
            >
              <Lsi import={importLsi} path={["ColorPalette", "shade"]} />
            </Text>
            <ColorShadePalette
              {...componentProps}
              value={objectValue.hex}
              onSelect={paletteProps.onSelect}
              componentProps={paletteComponentProps}
              className={Utils.Css.joinClassName(
                componentProps?.className,
                CLASS_NAMES.shadeOpacityPalette(paletteComponentProps.size),
              )}
            />
          </>
        )}
        {displayOpacity && (
          <>
            <Text
              className={CLASS_NAMES.text(isMobileOrTablet)}
              category="interface"
              segment="content"
              type={isMobileOrTablet ? "large" : "medium"}
              colorScheme="dim"
            >
              <Lsi import={importLsi} path={["ColorPalette", "opacity"]} />
            </Text>
            <ColorOpacityPalette
              {...componentProps}
              opacity={objectValue.opacity}
              value={objectValue.hex}
              onSelect={paletteProps.onSelect}
              size={paletteComponentProps.size}
              className={Utils.Css.joinClassName(
                componentProps?.className,
                CLASS_NAMES.shadeOpacityPalette(paletteComponentProps.size),
              )}
            />
          </>
        )}
      </div>
    );
  },
  //@@viewOff:render
});

//@@viewOn:helpers

const getCssColorWithOpacity = (hex, opacity = 100) => {
  if (opacity === 100 || !hex) return hex;

  let cssColor = Utils.Color.toRgba(hex);
  cssColor[3] = opacity / 100;
  cssColor = `rgba(${cssColor.join(", ")})`;

  return cssColor;
};

const DEFAULT_VALUE_OBJECT = { shade: "c500", opacity: 100 };
function normalizeInputValue(value, useFixedPalette) {
  if (!value) return DEFAULT_VALUE_OBJECT;
  let result =
    typeof value === "object" ? { ...DEFAULT_VALUE_OBJECT, ...value } : { ...DEFAULT_VALUE_OBJECT, cssColor: value };

  // override null values
  result.shade = result.shade ?? DEFAULT_VALUE_OBJECT.shade;
  result.opacity = result.opacity ?? DEFAULT_VALUE_OBJECT.opacity;

  // set cssColor if it is not defined
  if (!result.cssColor) {
    if (result.hex) {
      result.cssColor = result.hex.toUpperCase();
    } else if (result.colorScheme) {
      let colorScheme = getColorSchemeMap(useFixedPalette)[result.colorScheme];
      if (!colorScheme?.shadeMap) return undefined; // invalid value
      let cssColor = colorScheme.shadeMap[result.shade] || colorScheme.mainColor;
      result.cssColor = getCssColorWithOpacity(cssColor, result.opacity);
    }
  }

  if (result.cssColor) {
    // fill all values from cssColor - fix inconsistences in data object and transforms
    result.hex = Utils.Color.toHex(result.cssColor).toUpperCase();
    result.opacity = Math.round(Utils.Color.toRgba(result.cssColor)[3] * 100);
    result = { ...result, ...getColorMap(USE_FIXED_COLORS)[result.cssColor] }; // merge data from color map - update colorScheme & shade
  }

  return result;
}

const normalizeOutputValue = (objectValue, data, valueType) => {
  let selectedHex = Utils.Color.toHex(data.value).toUpperCase();
  let selectedOpacity = data.updateOpacity ? Math.round(Utils.Color.toRgba(data.value)[3] * 100) : objectValue.opacity;
  let fixedColorMap = getColorMap(USE_FIXED_COLORS);
  let fixedSelectedColorData = fixedColorMap[selectedHex];
  let cssColor = data.value;
  let colorData;
  if (fixedSelectedColorData) {
    let fixedColorScheme = fixedSelectedColorData.colorScheme;
    let fixedColorShade = data.updateShade ? fixedSelectedColorData.shade : objectValue.shade;
    let fixedColorSchemeData = getColorSchemeMap(USE_FIXED_COLORS)[fixedColorScheme];
    cssColor = fixedColorSchemeData.shadeMap
      ? fixedColorSchemeData.shadeMap[fixedColorShade]
      : fixedColorSchemeData.mainColor;
    // If valueType is "object", FIXED_COLOR_MAP must be used to select the colorScheme correctly
    colorData = getColorMap(valueType === "object")[cssColor];
  }
  let hex = Utils.Color.toHex(cssColor);

  if (selectedOpacity !== 100) {
    cssColor = getCssColorWithOpacity(cssColor, selectedOpacity);
  }
  return {
    colorScheme: colorData?.colorScheme,
    shade: colorData?.shade,
    opacity: selectedOpacity,
    hex,
    cssColor,
  };
};

const CLASS_NAMES = {
  main: () =>
    Config.Css.css({
      maxWidth: Utils.ScreenSize.XS,
    }),
  text: (isMobileOrTablet) =>
    Config.Css.css({
      display: "block",
      marginTop: UuGds.SpacingPalette.getValue(["fixed", isMobileOrTablet ? "e" : "d"]),
      marginBottom: UuGds.SpacingPalette.getValue(["fixed", "c"]),
    }),
  shadeOpacityPalette: (paletteItemSize) => {
    let { h: minHeight } = UuGds.SizingPalette.getValue(["spot", "basic", paletteItemSize]);
    return Config.Css.css({ minHeight });
  },
};
//@@viewOff:helpers

ColorPalette.Item = ColorSpot;
// FIXME - temporary exported for ColorInput component to allow parse string value into standard object
ColorPalette._normalizeInputValue = normalizeInputValue;

export default ColorPalette;
