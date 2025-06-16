//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, Lsi, useElementSize } from "uu5g05";
import Config from "../config/config.js";
import UuGds from "../_internal/gds.js";
import ArrowIndicator from "./arrow-indicator.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const ColorOpacityPalette = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ColorOpacityPalette",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.string,
    onSelect: PropTypes.func,
    opacity: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: undefined,
    onSelect: undefined,
    opacity: undefined,
  },
  //@@viewOff:defaultProps

  //@@viewOn:render
  render(props) {
    const { value, onSelect, opacity, ...otherProps } = props;
    const { size } = otherProps;
    const { ref, height, width } = useElementSize();

    function handleChange(e) {
      if (typeof onSelect === "function") {
        const colorInRgba = Utils.Color.toRgba(value);
        const colorWithOpacity = `rgba(${colorInRgba[0]}, ${colorInRgba[1]}, ${colorInRgba[2]}, ${e.data.value / 100})`;
        onSelect(new Utils.Event({ value: colorWithOpacity, updateOpacity: true }, e));
      }
    }

    const attrs = Utils.VisualComponent.getAttrs(props);
    return (
      <div {...attrs} ref={Utils.Component.combineRefs(ref, props.elementRef)} data-testid="opacity-palette">
        {value ? (
          <ArrowIndicator {...otherProps} initialPosition={opacity} onClick={handleChange}>
            <div className={CLASS_NAMES.checkerBoard(height, width)} />
            <div className={CLASS_NAMES.track(height, value, size)} />
          </ArrowIndicator>
        ) : (
          <Lsi import={importLsi} path={["ColorPalette", "selectSchemaOpacity"]} />
        )}
      </div>
    );
  },
});

//@@viewOn:helpers
const CLASS_NAMES = {
  track: (height, color, size) => {
    let deg = "270deg";
    return Config.Css.css({
      borderRadius: UuGds.RadiusPalette.getValue(["spot", "moderate"], { height: height || 36 }),
      minHeight: UuGds.SizingPalette.getValue(["spot", "basic", size || "m"]).h,
      background: `linear-gradient(${deg}, ${color}, transparent)`,
      cursor: "pointer",
      position: "relative",
    });
  },
  checkerBoard: (height, width) =>
    Config.Css.css({
      height: "100%",
      width: "100%",
      borderRadius: UuGds.RadiusPalette.getValue(["spot", "moderate"], { height: height || 36 }),
      position: "absolute",
      backgroundImage:
        "linear-gradient(45deg, rgba(0,0,0,.2) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,.2) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,.2) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,.2) 70%)",
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
    }),
};
//@@viewOff:helpers

export { ColorOpacityPalette };
export default ColorOpacityPalette;
