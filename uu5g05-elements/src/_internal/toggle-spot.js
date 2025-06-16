//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice, Utils, useBackground, BackgroundProvider, Lsi } from "uu5g05";
import Config from "../config/config.js";
import ToggleButton, { ANIMATION_LENGTH } from "../_internal/toggle-button";
import UuGds from "../_internal/gds";
import Text from "../text";
import Tools from "./tools";
import Input from "../input";
//@@viewOff:imports

//@@viewOn:constant
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ width, size, borderRadius, isMobileOrTablet, onChange, label }) => {
    const { height, borderRadius: radius } = UuGds.getSizes(
      "spot",
      "basic",
      isMobileOrTablet ? Tools.CONTAINER_SIZE_MAP_MOBILE[size] : size,
      borderRadius,
    );
    const typography = UuGds.getValue(["Typography", "interface", "content"]);

    return Config.Css.css({
      display: "inline-flex",
      gap: UuGds.SpacingPalette.getValue(["inline", "d"]),
      alignItems: "center",
      width,
      height,
      borderRadius: radius,
      ...typography[isMobileOrTablet ? Tools.TEXT_TYPE_MAP_MOBILE[size] : Tools.TEXT_TYPE_MAP[size]],
      paddingLeft: label ? UuGds.SpacingPalette.getValue(["relative", "c"], { height }) : undefined,
      paddingRight: label ? UuGds.SpacingPalette.getValue(["relative", "d"], { height }) : undefined,
      cursor: onChange ? "pointer" : undefined,
      transition: `background-color ease ${ANIMATION_LENGTH}ms, color ease ${ANIMATION_LENGTH}ms`,
    });
  },
  button: () =>
    Config.Css.css({
      fontSize: UuGds.SizingPalette.getValue(["inline", "emphasized"]),
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const { hoverable: _, ...propTypes } = ToggleButton.propTypes;

const ToggleSpot = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ToggleSpot",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    label: PropTypes.oneOfType([PropTypes.node, PropTypes.func, PropTypes.lsi]),
    size: PropTypes.oneOf([null, "xxs", "xs", "s", "m", "l", "xl"]),
    box: PropTypes.bool,
    width: PropTypes.unit,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    colorScheme: ToggleButton.defaultProps.colorScheme,
    label: undefined,
    size: "m",
    borderRadius: "moderate",
    box: false,
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { value, onChange, colorScheme, label, size, box, iconOn, iconOff, ...restProps } = props;

    if (label != null && typeof label === "object" && !Utils.Element.isValid(label)) {
      label = <Lsi lsi={label} />;
    }

    const { isMobileOrTablet } = useDevice();

    const background = useBackground();
    let shapeStyles, gdsBackground;
    if (box) {
      [shapeStyles, gdsBackground] = Input._getShapeStyles({
        ...props,
        background,
        colorScheme: value ? colorScheme : "neutral",
        significance: "distinct",
      });
    }
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(
      restProps,
      Utils.Css.joinClassName(Css.main({ ...props, isMobileOrTablet, background }), Config.Css.css(shapeStyles)),
    );

    let inner = (
      <>
        <ToggleButton
          value={value}
          iconOn={iconOn}
          iconOff={iconOff}
          colorScheme={colorScheme}
          className={Css.button()}
          hoverable={!!onChange}
        />
        {label != null ? <Text colorScheme="building">{label}</Text> : null}
      </>
    );

    if (box) {
      inner = <BackgroundProvider background={gdsBackground ?? background}>{inner}</BackgroundProvider>;
    }

    return (
      <div {...attrs} onClick={onChange ? (e) => onChange(new Utils.Event({ value: !value }, e)) : undefined}>
        {inner}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { ToggleSpot };
export default ToggleSpot;
//@@viewOff:exports
