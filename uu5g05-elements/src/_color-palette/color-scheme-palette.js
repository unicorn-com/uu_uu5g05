//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice, Utils } from "uu5g05";
import Config from "../config/config.js";
import ColorSpot, { SIZE_MAP_MOBILE } from "./color-spot.js";
import { getColorMap, getColorSchemeMap, getColorSwatches } from "./colors.js";
import UuGds from "../_internal/gds.js";
import Grid from "../grid.js";
//@@viewOff:imports

const USE_FIXED_COLORS = true;

const ColorSchemePalette = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ColorSchemePalette",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.string,
    valueType: PropTypes.oneOf(["color", "colorScheme"]),
    onChange: PropTypes.func,
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
    valueType: "color",
    onChange: undefined,
    presetList: undefined,
  },
  //@@viewOff:defaultProps

  //@@viewOn:render
  render(props) {
    const { value, onSelect, valueType, className, componentProps, colorScheme, presetList, ...otherProps } = props;
    const { isMobileOrTablet } = useDevice();

    const gap = UuGds.SpacingPalette.getValue(["fixed", "c"]);

    let size = componentProps?.size || "m";
    size = (isMobileOrTablet && SIZE_MAP_MOBILE[size]) || size;
    const { h: height } = UuGds.SizingPalette.getValue(["spot", "basic", size]);
    let templateColumns = `repeat(auto-fit, ${height}px)`;

    const colorItemList = getColorItemList(value, valueType, onSelect, presetList);
    return (
      <Grid
        {...otherProps}
        className={Utils.Css.joinClassName(className, CLASS_NAMES.main())}
        templateColumns={templateColumns}
        rowGap={gap}
        columnGap={gap}
      >
        {colorItemList.map((it) => (
          <ColorSpot {...componentProps} key={it.key} {...it} size={undefined} colorScheme={colorScheme} />
        ))}
      </Grid>
    );
  },
});

//@@viewOn:helpers
function getColorItemList(value, valueType, onSelect, presetList) {
  const COLOR_SWATCHES = getColorSwatches(USE_FIXED_COLORS);
  const COLOR_SCHEME_MAP = getColorSchemeMap(USE_FIXED_COLORS);
  let colorList = Object.keys(COLOR_SWATCHES);

  let selectedColorScheme;
  if (Array.isArray(presetList) && presetList.length > 0) {
    let foundColor = presetList.find((preset) =>
      typeof preset.value === "object" ? Object.values(preset.value).includes(value) : preset.value === value,
    );
    selectedColorScheme = foundColor?.value;
    colorList = presetList;
  } else if (valueType === "color") {
    const selectedColorData = getColorMap(USE_FIXED_COLORS)[value];
    selectedColorScheme = selectedColorData?.colorScheme.toLowerCase();
  } else {
    selectedColorScheme = value?.toLowerCase();
    // filter all color schemes, that does not have shades - it is not a colorScheme (black & white)
    // colorList = colorList.filter((colorScheme) => COLOR_SCHEME_MAP[colorScheme].shadeMap);
    colorList = [
      "light-blue",
      "blue",
      "dark-blue",
      "dark-purple",
      "cyan",
      "dark-green",
      "green",
      "light-green",
      "pink",
      "red",
      "orange",
      "yellow",
      "purple",
      "brown",
      "steel",
      "grey",
    ];
  }

  let itemList = [];
  for (let colorScheme of colorList) {
    if (!colorScheme) continue;
    let color, isSelected, newSelectedColor, title, key;

    if (typeof colorScheme === "object") {
      if (typeof colorScheme.value === "object") {
        color = colorScheme.value.c500; // c500 is in the middle between the shadows
        isSelected = Utils.Object.deepEqual(colorScheme.value, selectedColorScheme);
        newSelectedColor = { value: colorScheme.value.c500, cssColor: colorScheme.value.c500 };
        title = `${colorScheme.tooltip} (${colorScheme.value.c500})`;
        key = colorScheme.value.c500;
      } else {
        color = colorScheme.value;
        isSelected = colorScheme.value === selectedColorScheme;
        newSelectedColor = { value: color, cssColor: color };
        title = `${colorScheme.tooltip} (${colorScheme.value})`;
        key = colorScheme.value;
      }
    } else {
      if (valueType === "color") {
        color = COLOR_SCHEME_MAP[colorScheme].mainColor;
      } else {
        const colorPalette = UuGds.ColorPalette.getValue();
        const colorObject = colorPalette.basic[colorScheme];
        let colorFrom = colorObject.mainLightest;
        let colorTo = colorObject.mainDarkest;

        if (colorScheme === "grey") {
          colorTo = colorObject.main;
        } else if (colorScheme === "yellow") {
          colorFrom = colorObject.mainDarker;
          colorTo = colorPalette.basic.orange.mainLightest;
        }
        color = `linear-gradient(135deg, ${colorFrom} 0%, ${colorTo} 100%)`;
      }
      isSelected = colorScheme?.toLowerCase() === selectedColorScheme;
      newSelectedColor = { value: valueType === "colorScheme" ? colorScheme : color, cssColor: color };
      title = colorScheme + (valueType === "colorScheme" ? "" : ` (${color})`);
      key = colorScheme;
    }

    itemList.push({
      key,
      color,
      onClick: typeof onSelect === "function" ? (e) => onSelect(new Utils.Event(newSelectedColor, e)) : undefined,
      elementAttrs: { title },
      borderRadius: "moderate",
      isSelected,
      testId: isSelected ? "selected" : "",
    });
  }

  return itemList;
}

const CLASS_NAMES = {
  main: () => Config.Css.css({ width: "100%" }),
};
//@@viewOff:helpers

export { ColorSchemePalette };
export default ColorSchemePalette;
