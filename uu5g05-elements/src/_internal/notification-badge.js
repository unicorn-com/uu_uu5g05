//@@viewOn:imports
import { createComponent, PropTypes, useBackground, Utils } from "uu5g05";
import Config from "../config/config.js";
import UuGds from "./gds.js";
//@@viewOff:imports

//@@viewOn:constants
const ANIMATION_DELAY = 1000;
const MAIN_ANIMATION = Config.Css.keyframes({
  "0%": { transform: "scale(0)" },
  "100%": { transform: "scale(1)" },
});
const MAIN_ANIMATION_LENGTH = 300;

const PULSE_ANIMATION = Config.Css.keyframes({
  "0%": { transform: "scale(1)" },
  "66%": { transform: "scale(3)" },
  "100%": { transform: "scale(3)", opacity: 0 },
});
const PULSE_ANIMATION_LENGTH = 900;
const PULSE_ANIMATION_DELAY = ANIMATION_DELAY - 100 + MAIN_ANIMATION_LENGTH;
const SIZE = "xs";
const BORDER_RADIUS = "full";
//@@viewOff:constants

//@@viewOn:css
const Css = {
  mainStatic: () =>
    Config.Css.css({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "nowrap",
      // this establishes baseline of the whole element (because it is 1st content inside)
      "&:before": {
        content: '"\\200b"',
        width: 0,
        overflow: "hidden",
        alignSelf: "center",
      },
    }),
  mainDynamic: ({ shapeStyles }) => {
    const { height, borderRadius: radius } = UuGds.getSizes("spot", "minor", SIZE, BORDER_RADIUS);
    const paddingChildren = UuGds.SpacingPalette.getValue(["relative", "d"], { height });

    return Config.Css.css({
      ...shapeStyles,
      border: "1px solid #fff",
      width: height,
      height,
      borderRadius: radius,
      paddingInline: paddingChildren,
    });
  },
  animation: ({ backgroundColor }) =>
    Config.Css.css({
      animation: `${MAIN_ANIMATION} ${MAIN_ANIMATION_LENGTH}ms ease-out`,
      animationDelay: `${ANIMATION_DELAY}ms`,
      "&:after": {
        content: '""',
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: "50%",
        animation: `${PULSE_ANIMATION} ${PULSE_ANIMATION_LENGTH}ms ease-out`,
        animationDelay: `${PULSE_ANIMATION_DELAY}ms`,
        backgroundColor,
        opacity: 0.4,
      },
    }),
};
//@@viewOff:constants

//@@viewOn:helpers
function getShapeStyles({ background, colorScheme }) {
  const states = UuGds.getValue(["Shape", "background", background, colorScheme, "highlighted"]);

  return {
    ...UuGds.Shape.getStateStyles(states.default, true),

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
    },

    // for demo
    "&.saving": UuGds.Shape.getStateStyles(states.saving),
  };
}
//@@viewOff:helpers

const NotificationBadge = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "NotificationBadge",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    colorScheme: PropTypes.colorScheme("meaning", "basic"),
    animation: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    colorScheme: "primary",
    animation: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { animation, className: classNameProp } = props;
    const background = useBackground();
    const shapeStyles = getShapeStyles({ ...props, background });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let className = Utils.Css.joinClassName(classNameProp, Css.mainStatic(), Css.mainDynamic({ shapeStyles }));
    if (animation) {
      className = Utils.Css.joinClassName(className, Css.animation({ backgroundColor: shapeStyles.backgroundColor }));
    }

    const attrs = Utils.VisualComponent.getAttrs(props, className);

    return <span {...attrs} />;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { NotificationBadge };
export default NotificationBadge;
