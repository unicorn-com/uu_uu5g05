//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes, useBackground } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";

//@@viewOff:imports

function getLineStyle(styles, direction) {
  let attributePrefix = "border" + (direction === "horizontal" ? "Top" : "Left");
  return {
    [attributePrefix + "Width"]: styles?.border?.width,
    [attributePrefix + "Style"]: styles?.border?.style,
    [attributePrefix + "Color"]: styles?.colors?.border,
    borderRadius: styles?.border?.radius,
  };
}

function getShapeStyles({ background, colorScheme, significance, direction }) {
  const states = UuGds.getValue(["Shape", "line", background, colorScheme, significance]);

  return {
    border: 0,
    ...getLineStyle(states.default, direction),

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": getLineStyle(states.saving, direction),
    },
  };
}

const Line = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Line",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
    margin: PropTypes.space,
    direction: PropTypes.oneOf(["horizontal", "vertical"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    colorScheme: "building",
    significance: "common",
    margin: 0,
    direction: "horizontal",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { colorScheme, significance, margin, direction } = props;

    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const styles = getShapeStyles({ background, colorScheme, significance, direction });
    const classNames = [
      Config.Css.css(styles),
      Config.Css.css(Utils.Style.parseSpace(margin, "margin")),
      // our CSS reset gives hr `height: 0; box-sizing: content-box` which collides e.g. with ActionGroup
      // or when it's vertical => reset it back
      Config.Css.css({ height: "auto", boxSizing: "border-box" }),
    ];
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, classNames.join(" "));
    return <hr {...attrs} />;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Line };
export default Line;
