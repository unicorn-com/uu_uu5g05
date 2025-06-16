//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import Config from "./config/config.js";
import PendingCircular from "./_state-indicator/pending-circular";
import PendingHorizontal from "./_state-indicator/pending-horizontal";
//@@viewOff:imports

//@@viewOn:helpers
//@@viewOff:helpers

const Css = {
  dot: ({ index }) => {
    let keyframes = Config.Css.keyframes({
      "0%": { opacity: 0 },
      "16.6%": { opacity: 1 },
      "50%": { opacity: 1 },
      "60%": { opacity: 0 },
      "100%": { opacity: 0 },
    });
    return Config.Css.css({ animation: `${keyframes} 1.2s ${index * 0.12}s infinite` });
  },
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

const { progressColor, value, label, animated, ...propTypes } = PendingHorizontal.propTypes;

const Pending = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Pending",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    type: PropTypes.oneOf(["circular", "horizontal", "dots"]),
    ...propTypes,
    size: PendingCircular.propTypes.size,
    cssColor: progressColor,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    type: "circular",
    size: "m",
    cssColor: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    // value is not in restProps to not be able to display progress instead of Pending
    let { type, cssColor, value: _, size: sizeProp, ...restProps } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let result;
    if (type === "dots" || props.nestingLevel === "inline") {
      result = (
        <span {...Utils.VisualComponent.getAttrs(restProps)}>
          {Array(3)
            .fill()
            .map((_, i) => (
              <span key={i} className={Css.dot({ index: i })}>
                .
              </span>
            ))}
        </span>
      );
    } else {
      let Comp, size;

      if (type === "horizontal") {
        Comp = PendingHorizontal;
        size = typeof sizeProp === "number" ? "m" : sizeProp;
      } else {
        Comp = PendingCircular;
        size = sizeProp;
      }

      if (size === "max" || typeof size === "number") {
        const [attr, compProps] = Utils.VisualComponent.splitProps(restProps, Css.max());
        result = (
          <div {...attr}>
            <Comp {...compProps} size={size} progressColor={cssColor} />
          </div>
        );
      } else {
        result = <Comp {...restProps} size={size} progressColor={cssColor} />;
      }
    }

    return result;
    //@@viewOff:render
  },
});

export { Pending };
export default Pending;
