//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import Config from "./config/config.js";
import PendingCircular from "./_state-indicator/pending-circular";
import PendingHorizontal from "./_state-indicator/pending-horizontal";
import Text from "./text";
import UuGds from "./_internal/gds.js";
//@@viewOff:imports

//@@viewOn:helpers
function scaleFontSize(initialFontSize, height) {
  return initialFontSize * (height / UuGds.SizingPalette.getValue(["box", "1x1", "xs"]).h);
}
//@@viewOff:helpers

const Css = {
  max: () =>
    Config.Css.css({
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      pointerEvents: "none",
    }),
};

const { progressColor, label, ...propTypes } = PendingHorizontal.propTypes;

const Progress = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Progress",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    type: PropTypes.oneOf(["circular", "horizontal"]),
    ...propTypes,
    size: PendingCircular.propTypes.size,
    cssColor: progressColor,
    text: PropTypes.node,
    suffix: PropTypes.node,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: 0,
    type: "circular",
    size: "m",
    cssColor: undefined,
    text: undefined,
    suffix: undefined,
    animated: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { type, cssColor, text, suffix, size: sizeProp, ...restProps } = props;

    let Comp, textFontSize, suffixFontSize, size;
    if (type === "horizontal") {
      Comp = PendingHorizontal;
      suffixFontSize = "0.7em";
      size = typeof sizeProp === "number" ? "m" : sizeProp;
    } else {
      Comp = PendingCircular;
      size = sizeProp;
      if (size) {
        if (typeof size === "number") {
          const textFontStyles = UuGds.getValue(["Typography", "interface", "title", "minor"]);
          const suffixFontStyles = UuGds.getValue(["Typography", "interface", "title", "minor"]);
          textFontSize = scaleFontSize(textFontStyles.fontSize, size);
          suffixFontSize = scaleFontSize(suffixFontStyles.fontSize, size);
        } else {
          textFontSize = "0.35em";
          suffixFontSize = "0.25em";
        }
      } else {
        textFontSize = undefined;
        suffixFontSize = "0.7em";
      }
    }

    let label;
    if (text != null) {
      label = (
        <>
          <Text colorScheme="building">
            {(style) => <b className={Config.Css.css({ ...style, fontSize: textFontSize })}>{text}</b>}
          </Text>
          {suffix && (
            <Text
              colorScheme="building"
              significance="subdued"
              className={Config.Css.css({ fontSize: suffixFontSize })}
            >
              {suffix}
            </Text>
          )}
        </>
      );
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let result;
    if (size === "max" || typeof size === "number") {
      const [attr, compProps] = Utils.VisualComponent.splitProps(restProps, Css.max());
      result = (
        <div {...attr}>
          <Comp {...compProps} size={size} label={label} progressColor={cssColor} />
        </div>
      );
    } else {
      result = <Comp {...restProps} size={size} label={label} progressColor={cssColor} />;
    }

    return result;
    //@@viewOff:render
  },
});

export { Progress };
export default Progress;
