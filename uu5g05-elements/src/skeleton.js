//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes } from "uu5g05";
import Config from "./config/config.js";
import UuGds from "./_internal/gds.js";
import Box, { getClassName } from "./box.js";
//@@viewOff:imports

const Css = {
  main: () => {
    const duration = UuGds.getValue(["MotionPalette", "duration", "lazy"]);
    const colorStops = ["transparent", UuGds.getValue(["ColorPalette", "meaning", "dim", "softStrongestTransparent"])];
    const keyframes = Config.Css.keyframes({
      "0%": {
        backgroundPosition: "left",
      },
      "50%": {
        backgroundPosition: "right",
      },
      "100%": {
        backgroundPosition: "left",
      },
    });
    return Config.Css.css({
      background: `linear-gradient(
        to right,
        ${colorStops[0]} 0%,
        ${colorStops[1]} 0%,
        ${colorStops[0]} 100%)
        no-repeat`,
      backgroundSize: "200%",
      animation: `${keyframes} ${duration * 2}s cubic-bezier(0.65, 0, 0.35, 1) infinite`,
    });
  },

  item: ({ size, borderRadius }) => {
    const { height, borderRadius: radius } = UuGds.getSizes("spot", "basic", size, borderRadius);
    return Config.Css.css({ height, borderRadius: radius });
  },
};

const Skeleton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Skeleton",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    aspectRatio: Box.propTypes.aspectRatio,
    size: Box.propTypes.size,
    borderRadius: PropTypes.borderRadius,
    width: PropTypes.unit,
    height: PropTypes.unit,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    aspectRatio: Box.defaultProps.aspectRatio,
    size: Box.defaultProps.size,
    borderRadius: "none",
    width: undefined,
    height: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { size, width, height } = props;
    const isSpot = size && !width && !height;
    const className = Utils.Css.joinClassName(Css.main(), isSpot ? Css.item(props) : getClassName(props));
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, className);
    return <div {...attrs} role="alert" aria-busy="true" />;
    //@@viewOff:render
  },
});

export { Skeleton };
export default Skeleton;
