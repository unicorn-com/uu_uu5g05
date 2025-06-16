//@@viewOn:imports
import { createVisualComponent, PropTypes, useBackground, useDevice, useEffect, useRef, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import withValidationInput from "../with-validation-input.js";
import Config from "../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
const TRACK_HEIGHT_IN_PERCENT = 0.15;
const THUMB_COLOR_SCHEME = "primary";
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: (params) => {
    const {
      size,
      background,
      browserName,
      thumbWidth,
      feedback,
      thumbOnly,
      thumbSignificance = "highlighted",
    } = params;
    const { h: inputHeight } = Uu5Elements.UuGds.SizingPalette.getValue(["spot", "basic", size]);
    const thumbColorScheme = feedback ? Config.COLOR_SCHEME_MAP[feedback] : THUMB_COLOR_SCHEME;
    const thumbStates = Uu5Elements.UuGds.Shape.getValue([
      "formElement",
      background,
      thumbColorScheme,
      thumbSignificance,
    ]);
    const trackStates = Uu5Elements.UuGds.Shape.getValue(["ground", background, "neutral", "distinct"]);
    const trackHeight = Math.round(TRACK_HEIGHT_IN_PERCENT * inputHeight);
    const effects = Uu5Elements.UuGds.EffectPalette.getValue(["outlineIndentedExpressive"], {
      colorScheme: thumbColorScheme,
    });
    const effectStyles = Uu5Elements.UuGds.EffectPalette.getStyles(effects);

    let thumbStyles = {
      appearance: "none",
      width: thumbWidth,
      aspectRatio: "1/1",
      borderRadius: "50%",
      marginTop: Math.round((trackHeight - thumbWidth) / 2),
      ...Uu5Elements.UuGds.Shape.getStateStyles(thumbStates.default, true),
      borderWidth: 2,
    };

    let trackStyles = {
      appearance: "none",
      boxShadow: "none",
      border: "none",
      borderRadius: trackHeight,
      height: trackHeight,
      ...Uu5Elements.UuGds.Shape.getStateStyles(trackStates.default, true),
    };

    if (thumbOnly) {
      trackStyles.visibility = "hidden";
      trackStyles.pointerEvents = "none";
      thumbStyles.visibility = "visible";
      thumbStyles.pointerEvents = "all";
    }

    let otherStyles = {};
    if (browserName === "firefox") {
      otherStyles = {
        "&::-moz-range-track": { MozAppearance: "none", ...trackStyles },
        "&::-moz-range-thumb": { MozAppearance: "none", ...thumbStyles },
        "&:focus::-moz-range-thumb": { ...effectStyles },
      };
    }

    return Config.Css.css({
      WebkitAppearance: "none" /* Hides the slider so that custom slider can be made */,
      appearance: "none",
      background: "transparent" /* Otherwise white in Chrome */,
      flex: 1,
      cursor: "pointer",
      "&:focus": { outline: "none" },

      "&::-webkit-slider-runnable-track": trackStyles,
      "&::-webkit-slider-thumb": { WebkitAppearance: "none", ...thumbStyles },
      "&:focus::-webkit-slider-thumb": { ...effectStyles },

      ...otherStyles,
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
const { colorScheme, significance, effect, borderRadius, type, placeholder, required, ...otherPropTypes } =
  Uu5Elements.Input.propTypes;
const {
  colorScheme: c_,
  significance: s_,
  effect: e_,
  borderRadius: b_,
  type: t_,
  placeholder: p_,
  required: r_,
  ...otherDefaultProps
} = Uu5Elements.Input.defaultProps;
//@@viewOff:helpers

const _InputSlider = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Input.Slider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...otherPropTypes,
    value: PropTypes.number,
    onChange: PropTypes.func,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    size: PropTypes.oneOf(["s", "m", "l"]),
    thumbOnly: PropTypes.bool,
    thumbSignificance: PropTypes.oneOf(["common", "highlighted"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...otherDefaultProps,
    value: undefined,
    onChange: undefined,
    min: 0,
    max: 100,
    step: 1,
    size: "m",
    width: 200,
    thumbOnly: false,
    thumbSignificance: "highlighted",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onChange, size, value, step, min, max, name, onFocus, onBlur, autoFocus } = props;
    const { h: thumbWidth } = Uu5Elements.UuGds.SizingPalette.getValue(["spot", "minor", size]);
    const background = useBackground();
    const { browserName } = useDevice();
    const inputRef = useRef();

    function handleChange(e) {
      if (typeof onChange === "function") {
        onChange(new Utils.Event({ value: Number(e.target.value) }, e));
      }
    }

    useEffect(() => {
      if (autoFocus) {
        inputRef.current.focus();
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, []);
    //@@viewOff:private

    //@@viewOn:render
    const { ref, ...attrs } = Utils.VisualComponent.getAttrs(props);

    return (
      <input
        {...attrs}
        ref={Utils.Component.combineRefs(ref, inputRef)}
        name={name}
        type="range"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className={Utils.Css.joinClassName(
          attrs.className,
          Css.main({ ...props, background, browserName, thumbWidth }),
        )}
        onFocus={typeof onFocus === "function" ? (e) => onFocus(e) : undefined}
        onBlur={typeof onBlur === "function" ? (e) => onBlur(e) : undefined}
      />
    );
    //@@viewOff:render
  },
});

const InputSlider = withValidationInput(_InputSlider);

//@@viewOn:exports
export { InputSlider, THUMB_COLOR_SCHEME, TRACK_HEIGHT_IN_PERCENT };
export default InputSlider;
//@@viewOff:exports
