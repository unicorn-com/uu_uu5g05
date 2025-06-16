//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";
import UuGds from "./gds.js";
import config from "../config/config.js";
import Input from "../input.js";
//@@viewOff:imports

const EmptyPreview = createComponent({
  //@@viewOn:statics
  uu5Tag: config.TAG + "EmptyPreview",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    size: PropTypes.string,
    borderRadius: PropTypes.borderRadius,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    size: undefined,
    borderRadius: Input.defaultProps.borderRadius,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:render
    return <div className={CLASS_NAMES.main(props.size, props.borderRadius, props.insideInputBox)} />;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const CLASS_NAMES = {
  main: (size, borderRadius, insideInputBox) => {
    let { height } = UuGds.getSizes("spot", "basic", size || "s");
    let line = UuGds.getValue(["Shape", "line", "light", "negative", "common"]);
    const border = UuGds.getValue(["BorderPalette", "dashedThin"]);
    let radius = UuGds.RadiusPalette.getValue(["spot", borderRadius], { height });
    if (insideInputBox) {
      height -= 2 * UuGds.SpacingPalette.getValue(["relative", "b"], { height });
    }
    return config.Css.css({
      width: size ? height : undefined,
      height: size ? height : undefined, // on "xs" viewport, parent component sets width to "auto" and clears aspect ratio
      aspectRatio: "1/1",
      textAlign: "center",
      minHeight: 16,
      borderRadius: radius,
      cursor: typeof onClick === "function" ? "pointer" : undefined,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderStyle: border.style,
      borderWidth: border.width,
      "::before": {
        content: '""',
        pointerEvents: "none",
        position: "absolute",
        left: 3,
        right: 3,
        top: 3,
        bottom: 3,
        background: `
          linear-gradient(to top left,
            transparent 0%,
            transparent calc(50% - ${line.default.border.width}px),
            ${line.default.colors.border} 50%,
            transparent calc(50% + ${line.default.border.width}px),
            transparent 100%)
        `,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      },
    });
  },
};
//@@viewOff:helpers

export default EmptyPreview;
