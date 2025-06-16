//@@viewOn:imports
import { Utils, createVisualComponent } from "uu5g05";
import UuGds from "./gds.js";
import Config from "../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
function getGdsScrollEffect() {
  let settings = UuGds.EffectPalette.getValue(["scrolled"]) || {};
  settings.color ??= "rgba(33,33,33,0.32)";
  settings.blurRadius ??= 8;
  return settings;
}

function getIndicatorBoxShadow(gdsEffect) {
  // ignore el.inset
  return `${gdsEffect.offsetX}px ${gdsEffect.offsetY}px ${gdsEffect.blurRadius}px ${gdsEffect.spreadRadius}px ${gdsEffect.color}`;
}
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () => Config.Css.css({ display: "grid", placeItems: "stretch" }),
  scrollBox: () => Config.Css.css({ gridArea: "1 / 1 / 1 / 1" }),
  verticalScrollIndicator: (
    side,
    { bottomReserve = 0, rightReserve = 0, scrollIndicatorOffset = {}, contentPadding = {} },
  ) => {
    let gdsScrollEffect = getGdsScrollEffect();
    let { blurRadius } = gdsScrollEffect;
    let height = 2 * blurRadius;
    let shadowOverflowToPadding = Math.round(1.5 * blurRadius);
    let reserves = { left: 0, top: 0, right: rightReserve, bottom: bottomReserve };
    reserves.left += (scrollIndicatorOffset[side + "Left"] || 0) + (contentPadding.left || 0);
    reserves.right += (scrollIndicatorOffset[side + "Right"] || 0) + (contentPadding.right || 0);

    return Utils.Css.joinClassName(
      Css.genericScrollIndicator(gdsScrollEffect),
      Config.Css.css({
        height,
        placeSelf: `${side === "top" ? "start" : "end"} stretch`,
        marginTop: reserves.top,
        marginLeft: reserves.left - Math.min(shadowOverflowToPadding, contentPadding.left || 0),
        marginRight: reserves.right - Math.min(shadowOverflowToPadding, contentPadding.right || 0),
        marginBottom: reserves.bottom,
        overflow: "hidden",
        padding: `0 ${blurRadius}px`,

        "&:after": {
          height,
          marginLeft: -(shadowOverflowToPadding - Math.min(shadowOverflowToPadding, contentPadding.left || 0)),
          marginRight: -(shadowOverflowToPadding - Math.min(shadowOverflowToPadding, contentPadding.right || 0)),
          transform: `translateY(${side === "top" ? -height : height}px)`,
        },
      }),
    );
  },
  horizontalScrollIndicator: (
    side,
    { bottomReserve = 0, rightReserve = 0, scrollIndicatorOffset = {}, contentPadding = {} },
  ) => {
    let gdsScrollEffect = getGdsScrollEffect();
    let { blurRadius } = gdsScrollEffect;
    let width = 2 * blurRadius;
    let shadowOverflowToPadding = Math.round(1.5 * blurRadius);
    let reserves = { left: 0, top: 0, right: rightReserve, bottom: bottomReserve };
    reserves.top += (scrollIndicatorOffset[side + "Top"] || 0) + (contentPadding.top || 0);
    reserves.bottom += (scrollIndicatorOffset[side + "Bottom"] || 0) + (contentPadding.bottom || 0);

    return Utils.Css.joinClassName(
      Css.genericScrollIndicator(gdsScrollEffect),
      Config.Css.css({
        width,
        placeSelf: `stretch ${side === "left" ? "start" : "end"}`,
        marginTop: reserves.top - Math.min(shadowOverflowToPadding, contentPadding.top || 0),
        marginLeft: reserves.left,
        marginRight: reserves.right,
        marginBottom: reserves.bottom - Math.min(shadowOverflowToPadding, contentPadding.bottom || 0),
        padding: `${blurRadius}px 0`,
        display: "flex", // to stretch our :after element in height

        "&:after": {
          width,
          marginTop: -(shadowOverflowToPadding - Math.min(shadowOverflowToPadding, contentPadding.top || 0)),
          marginBottom: -(shadowOverflowToPadding - Math.min(shadowOverflowToPadding, contentPadding.bottom || 0)),
          transform: `translateX(${side === "left" ? -width : width}px)`,
        },
      }),
    );
  },

  genericScrollIndicator: (gdsScrollEffect) => {
    let boxShadow = getIndicatorBoxShadow(gdsScrollEffect);
    let { blurRadius } = gdsScrollEffect;

    return Config.Css.css({
      gridArea: "1 / 1 / 1 / 1",
      pointerEvents: "none",
      position: "relative",
      zIndex: 20,
      overflow: "hidden",
      "&:after": {
        content: '""',
        display: "block",
        boxShadow,
        borderRadius: blurRadius,
      },
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers

//@@viewOff:helpers

const ScrollableBoxWithGradients = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ScrollableBoxWithGradients",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, active } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main(props));
    return (
      <div {...attrs}>
        {children({ className: Css.scrollBox() })}
        {active.top && <div className={Css.verticalScrollIndicator("top", props)} data-testid="top" />}
        {active.bottom && <div className={Css.verticalScrollIndicator("bottom", props)} data-testid="bottom" />}
        {active.left && <div className={Css.horizontalScrollIndicator("left", props)} data-testid="left" />}
        {active.right && <div className={Css.horizontalScrollIndicator("right", props)} data-testid="right" />}
      </div>
    );
    //@@viewOff:render
  },
});

export { ScrollableBoxWithGradients, getGdsScrollEffect, getIndicatorBoxShadow };
export default ScrollableBoxWithGradients;
