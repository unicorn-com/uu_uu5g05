//@@viewOn:imports
import { createVisualComponent, PropTypes, Lsi, Utils, useElementSize } from "uu5g05";
import Config from "../config/config.js";
import Matrix from "../_internal/matrix.js";
import ColorSpot from "./color-spot.js";
import ArrowIndicator from "./arrow-indicator.js";
import UuGds from "../_internal/gds.js";
import { getColorMap, getColorSchemeMap } from "./colors.js";
import importLsi from "../lsi/import-lsi.js"; // FIXME - no data for ru translation
//@@viewOff:imports

const USE_FIXED_COLORS = true;

const ColorShadePalette = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ColorShadePalette",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.string,
    onSelect: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: undefined,
    onSelect: undefined,
  },
  //@@viewOff:defaultProps

  //@@viewOn:render
  render(props) {
    const { value, onSelect, ...otherProps } = props;
    const { ref, height } = useElementSize();

    function getHandleChange(itemColor) {
      return (e) => {
        if (typeof onSelect === "function") {
          onSelect(new Utils.Event({ value: itemColor, updateShade: true }, e));
        }
      };
    }

    const COLOR_MAP = getColorMap(USE_FIXED_COLORS);
    const selectedColorScheme = COLOR_MAP[value]?.colorScheme;
    const COLOR_SCHEME_MAP = getColorSchemeMap(USE_FIXED_COLORS);
    const selectedColorSchemeData = COLOR_SCHEME_MAP[selectedColorScheme];

    const attrs = Utils.VisualComponent.getAttrs(props);
    return (
      <div {...attrs} ref={Utils.Component.combineRefs(ref, props.elementRef)} data-testid="shade-palette">
        {selectedColorScheme && selectedColorSchemeData?.shadeMap ? (
          <ArrowIndicator intervalCount={9} initialPosition={5}>
            <Matrix
              {...otherProps}
              matrix={getMatrix(selectedColorSchemeData, getHandleChange, height)}
              noGaps
              component={ColorSpot}
              componentProps={{ ...otherProps.componentProps, borderRadius: "none" }}
              className={CLASS_NAMES.matrix()}
            />
          </ArrowIndicator>
        ) : selectedColorScheme ? (
          <Lsi import={importLsi} path={["ColorPalette", "noShades"]} />
        ) : (
          <Lsi import={importLsi} path={["ColorPalette", "selectSchemaShade"]} />
        )}
      </div>
    );
  },
});

//@@viewOn:helpers
const SHADE_LIST = ["c50", "c100", "c200", "c300", "c500", "c600", "c700", "c800", "c950"];

function getMatrix(selectedColorSchemeData, getHandleChange, height) {
  const columnCount = 9;
  const rows = Math.ceil(SHADE_LIST.length / columnCount);
  const matrix = new Array(columnCount);

  for (let i = 0; i < matrix.length; i++) {
    matrix[i] = new Array(rows);
  }

  const shadeMap = selectedColorSchemeData.shadeMap;
  const colorList = SHADE_LIST.map((shade) => {
    return shadeMap[shade];
  });

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
    const color = colorList[0 * columnCount + columnIndex];
    if (!color) continue;

    matrix[columnIndex][0] = {
      className: CLASS_NAMES.matrixItem(height),
      key: color,
      color,
      onClick: getHandleChange(color),
      elementAttrs: {
        title: color,
      },
    };
  }

  return matrix;
}

const CLASS_NAMES = {
  matrix: () =>
    Config.Css.css({
      width: "100%",
    }),
  matrixItem: (height) => {
    const borderRadius = UuGds.RadiusPalette.getValue(["spot", "moderate"], { height: height || 36 });
    return Config.Css.css({
      "&:first-child": { borderTopLeftRadius: borderRadius, borderBottomLeftRadius: borderRadius },
      "&:last-child": { borderTopRightRadius: borderRadius, borderBottomRightRadius: borderRadius },
      "&&": {
        width: "auto",
        aspectRatio: "auto",
      },
    });
  },
};
//@@viewOff:helpers

export { ColorShadePalette };
export default ColorShadePalette;
