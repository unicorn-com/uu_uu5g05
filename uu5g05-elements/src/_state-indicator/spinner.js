//@@viewOn:imports
import { createVisualComponent, PropTypes, useBackground, useDevice, useState, Utils } from "uu5g05";
import Config from "../config/config.js";
import UuGds from "../_internal/gds";
//@@viewOff:imports

//@@viewOn:css
const Css = {
  main: ({ height, progressColor, progress }) => {
    const styles = {
      height,
      color: progressColor || undefined,
      verticalAlign: "middle",
    };

    if (progress == null) {
      let keyframes = Config.Css.keyframes({
        "0%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(360deg)" },
      });
      styles.animation = `${keyframes} 1s infinite linear`;
    } else {
      styles.transform = "rotate(-90deg)";
    }
    return Config.Css.css(styles);
  },
};
//@@viewOff:css

const Spinner = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Spinner",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    progress: PropTypes.number,
    height: PropTypes.number,
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    progressColor: PropTypes.string,
    progressWidth: PropTypes.number,
    trackColor: PropTypes.string,
    trackWidth: PropTypes.number,
    animated: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    height: 40,
    progressWidth: 3,
    trackWidth: undefined, // = progressWidth
  },
  //@@viewOff:defaultProps

  render(props) {
    let {
      progress,
      colorScheme,
      height,
      progressWidth,
      progressColor,
      trackWidth = progressWidth,
      trackColor,
      animated,
    } = props;

    const [id] = useState(() => Utils.String.generateId(8));
    const { browserName } = useDevice();

    const isSafari = browserName === "safari";

    const background = useBackground();

    if (!progressColor && colorScheme !== null) {
      colorScheme ??= "primary";
      const ground = UuGds.getValue(["Shape", "background", background, colorScheme, "highlighted"]);
      progressColor = ground?.default?.colors?.background;
    }

    if (progress != null && !trackColor) {
      const bg = UuGds.getValue(["Shape", "background", background, colorScheme ?? "neutral", "common"]);
      trackColor = bg?.default?.colors?.background;
    }

    const attrs = {
      role: "progressbar",
      "aria-valuenow": progress || undefined,
      ...Utils.VisualComponent.getAttrs(props, Css.main({ ...props, progressColor })),
    };

    const center = height / 2;
    const progressRadius = center - progressWidth / 2;

    let progressAttrs = { cx: center, cy: center, r: progressRadius, strokeWidth: progressWidth };
    let defs, trackAttrs;

    if (progress == null) {
      defs = (
        <defs>
          <linearGradient id={id} x1="50%" x2="50%" y2="100%">
            <stop stopColor="currentColor" offset="0" />
            <stop stopColor="currentColor" stopOpacity=".3" offset="1" />
          </linearGradient>
        </defs>
      );

      progressAttrs = {
        ...progressAttrs,
        fill: "none",
        stroke: `url(${isSafari ? location.href.replace(/#.*/, "") : ""}#${id})`,
      };
    } else {
      trackAttrs = {
        ...progressAttrs,
        r: center - trackWidth / 2,
        strokeWidth: trackWidth,
        fill: "transparent",
        stroke: trackColor,
      };

      const dashArray = 2 * Math.PI * progressRadius;
      const dashOffset = dashArray * ((100 - progress) / 100);

      progressAttrs = {
        ...progressAttrs,
        fill: "transparent",
        stroke: progressColor,
        strokeDasharray: dashArray,
        strokeDashoffset: dashOffset,
        strokeLinecap: "round",
      };

      if (animated) {
        const animationTime = UuGds.getValue(["MotionPalette", "duration", "normal"]);
        const keyframes = Config.Css.keyframes({
          "0%": { strokeDashoffset: dashArray },
          "100%": { strokeDashoffset: dashOffset },
        });

        progressAttrs.className = Config.Css.css({
          transition: `stroke-dashoffset ${animationTime}s ease`,
          // TODO only for first render!
          //animation: `${keyframes} ${animationTime}s ease`,
        });
      }
    }

    //@@viewOn:render
    return (
      <svg version="1.1" viewBox={`0 0 ${height} ${height}`} xmlns="http://www.w3.org/2000/svg" {...attrs}>
        {defs}
        {trackAttrs && <circle {...trackAttrs} />}
        <circle {...progressAttrs} />
      </svg>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Spinner };
export default Spinner;
//@@viewOff:exports
