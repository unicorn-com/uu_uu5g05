//@@viewOn:imports
import { createComponent, PropTypes, useBackground, Utils, Environment } from "uu5g05";
import Config from "./config/config.js";
import UuGds from "./_internal/gds";
//@@viewOff:imports

//@@viewOn:constants
const UU_GDS_BASE_URI =
  Environment._constants.iconLibraryMap["uugds"]?.replace(/[^/]*$/, "") ||
  Environment._constants.getCdnUri("uu-gds-svgg01/1.x/");
const FLAG_BASE_URI = UU_GDS_BASE_URI + "assets/flags/";
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main({ height, type, borderRadius, bordered, background }) {
    let styles = {
      height: height ?? UuGds.SizingPalette.getValue(["inline", "emphasized"]),
    };

    if (borderRadius) {
      const radius = UuGds.getValue(["RadiusPalette", "box", borderRadius]);
      if (radius) {
        if (typeof radius === "object") {
          const { value, max } = radius;
          styles.borderRadius = typeof height === "number" ? `min(${Math.round(value * height)}px, ${max})` : max;
        } else {
          styles.borderRadius = radius;
        }
      }
    } else if (type === "circle") {
      styles.borderRadius = "50%";
    }

    if (bordered) {
      if (background === "soft") background = "light";
      if (background === "full") background = "dark";

      const border = UuGds.BorderPalette.getValue(["solidThin"]);
      styles = {
        ...styles,
        borderWidth: border.width,
        borderStyle: border.style,
        borderColor: UuGds.ColorPalette.getValue(["building", background, "main"]),
      };
    }

    return Config.Css.css(styles);
  },
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Flag = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Flag",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    src: PropTypes.isRequiredIf(PropTypes.string, (props) => !props.code),
    code: PropTypes.isRequiredIf(PropTypes.string, (props) => !props.src),
    type: PropTypes.oneOf(["rectangle", "square", "circle"]),
    bordered: PropTypes.bool,
    height: PropTypes.unit,
    borderRadius: PropTypes.borderRadius,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    src: undefined,
    code: undefined,
    type: "rectangle",
    bordered: false,
    height: undefined,
    borderRadius: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { src, code, type } = props;

    let background = useBackground();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main({ ...props, background }));

    return (
      <img
        {...attrs}
        src={src ?? FLAG_BASE_URI + code + "-" + (type === "circle" ? "square" : type) + ".svg"}
        alt={code}
      />
    );
    //@@viewOff:render
  },
});

Flag.BASE_URI = FLAG_BASE_URI;

export { Flag };
export default Flag;
