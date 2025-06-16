//@@viewOn:imports
import { createVisualComponent, PropTypes, useBackground, Utils } from "uu5g05";
import Config from "../config/config.js";
import UuGds from "../_internal/gds";
//@@viewOff:imports

const PROGRESS_RELATIVE_WIDTH = 25; // in %

//@@viewOn:css
const Css = {
  main: ({ height, width, trackColor, progressColor, progress, animated }) => {
    const minHeight = UuGds.SizingPalette.getValue(["spot", "minor", "xxs"]).h;

    let progressWidth = PROGRESS_RELATIVE_WIDTH;
    let right;
    if (progress != null) {
      const progressFull = progress % 200;
      if (progressFull > 100) {
        progressWidth = 100 - (progressFull % 100);
        right = 0;
      } else if (progressFull < 0) {
        progressWidth = progressFull * -1;
        right = 0;
      } else {
        progressWidth = progressFull;
      }
    }

    const progressStyles = {
      display: "inline-block",
      height: `100%`,
      width: progressWidth + "%",
      borderRadius: "inherit",
      backgroundColor: progressColor,
      right,
    };

    if (progress == null) {
      const keyframes = Config.Css.keyframes({
        "0%": { transform: `translateX(-${2 * PROGRESS_RELATIVE_WIDTH}%)` },
        "50%": { transform: `translateX(${300 + 2 * PROGRESS_RELATIVE_WIDTH}%)` },
        "100%": { transform: `translateX(-${2 * PROGRESS_RELATIVE_WIDTH}%)` },
      });

      const duration = UuGds.getValue(["MotionPalette", "duration", "lazy"]);
      progressStyles.animation = `${keyframes} ${duration * 2}s infinite linear`;
    } else if (animated) {
      const animationTime = UuGds.getValue(["MotionPalette", "duration", "normal"]);
      progressStyles.transition = `width ${animationTime}s ease`;

      const keyframes = Config.Css.keyframes({
        "0%": { width: 0 },
        "100%": { width: progressWidth + "%" },
      });

      // TODO only for first render!
      //progressStyles.animation = `${keyframes} ${animationTime}s ease`;
    }

    return Config.Css.css({
      display: "inline-flex",
      position: "relative",
      overflow: "hidden",
      height: `max(${minHeight}px, ${height}${/^[0-9]+(\.[0-9]+)?$/.test(height + "") ? "px" : ""})`,
      minHeight,
      width,
      borderRadius: height,

      backgroundColor: trackColor,

      "&:before": {
        content: '"\\200b"',
        width: 0,
        overflow: "hidden",
        alignSelf: "center",
      },

      "&:after": {
        content: "' '",
        position: "absolute",
        ...progressStyles,
      },
    });
  },
};
//@@viewOff:css

const Bar = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Bar",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    progress: PropTypes.number,
    height: PropTypes.unit,
    width: PropTypes.unit,
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    progressColor: PropTypes.string,
    trackColor: PropTypes.string,
    animated: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    height: 40, // TODO default inline?
    width: 128,
  },
  //@@viewOff:defaultProps

  render(props) {
    let { progress, colorScheme, progressColor, trackColor } = props;

    const background = useBackground();

    if (!progressColor) {
      colorScheme ??= "primary";
      const ground = UuGds.getValue(["Shape", "background", background, colorScheme, "highlighted"]);
      progressColor = ground?.default?.colors?.background;
    }

    if (!trackColor) {
      const bg = UuGds.getValue(["Shape", "background", background, colorScheme ?? "neutral", "common"]);
      trackColor = bg?.default?.colors?.background;
    }

    const attrs = {
      role: "progressbar",
      "aria-valuenow": progress || undefined,
      ...Utils.VisualComponent.getAttrs(props, Css.main({ ...props, trackColor, progressColor })),
    };

    //@@viewOn:render
    return <div {...attrs} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Bar };
export default Bar;
//@@viewOff:exports
