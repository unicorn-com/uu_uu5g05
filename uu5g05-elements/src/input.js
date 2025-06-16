//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, withLsi, useBackground, useEffect, useRef, useDevice } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import Tools from "./_internal/tools.js";
//@@viewOff:imports

const DEFAULT_STYLES = {
  outline: "none",
  resize: "vertical",
};

const CONTAINER_SIZE_MAP_MOBILE = Tools.CONTAINER_SIZE_MAP_MOBILE;
const TEXT_TYPE_MAP_MOBILE = Tools.TEXT_TYPE_MAP_MOBILE;
const TEXT_TYPE_MAP = Tools.TEXT_TYPE_MAP;

const Css = {
  main({ width, type, shapeStyles, isMobileOrTablet, platform, ...props }) {
    // background, colorScheme, significance, pressed
    const { padding, ...inputStyles } = getInputStyles({ ...props, multipleRows: type === "textarea" });
    inputStyles.paddingLeft = inputStyles.paddingRight = padding;
    width != null && (inputStyles.width = width);
    if (type === "textarea") {
      // TODO check uuGds UX padding
      inputStyles.paddingTop = inputStyles.paddingBottom = padding - 3;
      inputStyles.verticalAlign = "top";
    } else {
      inputStyles.paddingTop = inputStyles.paddingBottom = 0;
    }

    let dynamicStyles = {
      "&::placeholder": {
        color: UuGds.Shape.getValue(["text", props.background, "building", "subdued"]).default.colors.foreground,
        fontStyle: "italic",
      },
    };

    if (isMobileOrTablet && platform === "ios") {
      dynamicStyles = { ...dynamicStyles, ...getIOSStyles() };
    }

    if (props.significance === "subdued") {
      const paddingLeft = inputStyles.paddingLeft || inputStyles.padding;
      const paddingRight = inputStyles.paddingRight || inputStyles.padding;
      inputStyles.paddingLeft = 0;
      inputStyles.paddingRight = paddingRight + paddingLeft;
      inputStyles.transition = "padding 0.5s ease";
      if (!props.readOnly) inputStyles["&:hover, &:focus"] = { paddingLeft, paddingRight };
    }

    return [DEFAULT_STYLES, dynamicStyles, inputStyles, shapeStyles].map((style) => Config.Css.css(style)).join(" ");
  },
};

//@@viewOn:helpers
function getIOSStyles() {
  return {
    ":focus": {
      // NOTE: Following animation is there to prevent scroll-jumping.
      // More about this issue: https://gist.github.com/kiding/72721a0553fa93198ae2bb6eefaa3299?permalink_comment_id=4542404#gistcomment-4542404
      animation: `${Config.Css.keyframes({
        "0%": { opacity: 0 },
        "100%": { opacity: 1 },
      })} 0.01s`,
    },
  };
}

function getShapeStyles({
  background,
  colorScheme = "building",
  significance = "common",
  readOnly,
  focused,
  effect,
  forceFocusPseudoClass = false,
}) {
  const states = UuGds.getValue(["Shape", "formElement", background, colorScheme, significance]);

  if (effect) {
    const elevationKey = "elevation" + Utils.String.capitalize(effect);
    states.default = {
      ...states.default,
      effect: [states.default.effect, UuGds.EffectPalette.getValue([elevationKey])].filter(Boolean),
    };
    states.accent = {
      ...states.accent,
      effect: [states.accent.effect, UuGds.EffectPalette.getValue([elevationKey + "Expressive"])].filter(Boolean),
    };
    states.saving = { ...states.saving, effect: states.default.effect };
  }

  let gdsBackground = states.default.colors?.gdsBackground;

  let defaultStyles = UuGds.Shape.getStateStyles(states.default, true);
  const hoverStyles = readOnly ? {} : UuGds.Shape.getStateStyles(states.accent);
  const focusStyles = UuGds.Shape.getStateStyles(states.marked);
  const focusGdsBackground = states.marked.colors?.gdsBackground;

  [hoverStyles, focusStyles].forEach((styles) => {
    let width = defaultStyles.borderStyle === "hidden" ? 0 : parseInt(defaultStyles.borderWidth || 0);
    let width2 = styles.borderStyle === "hidden" ? 0 : parseInt(styles.borderWidth || 0);

    if (width2 !== width) {
      let color;
      // TODO what if width will be in em?
      if (!width || width2 > width) {
        color = styles.borderColor;
      } else if (styles.borderWidth != null && (!width2 || width2 < width)) {
        color = styles.backgroundColor;
      }

      if (color) {
        const dif = Math.abs(width - width2);
        const boxShadow = `inset 0 0 0 ${dif}px ${color}`;

        styles.boxShadow = styles.boxShadow ? [styles.boxShadow, boxShadow].join(",") : boxShadow;
        delete styles.borderWidth;
        styles.borderStyle = "hidden";
      }
    }
  });

  if (focused) {
    defaultStyles = { ...defaultStyles, ...focusStyles };

    gdsBackground = focusGdsBackground ?? gdsBackground;
  }

  const styles = {
    // true must be, because browser by default use border and in distinct or subdued it is not needed
    ...defaultStyles,

    "&:hover": hoverStyles,
    ...(forceFocusPseudoClass && { "&:focus": focusStyles }),
    "&:focus-visible": focusStyles,

    // for demo
    "&.accent": hoverStyles,
    "&.marked": focusStyles,

    "@media print": {
      "&, &:hover, &:focus-visible, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
    },

    // for demo
    "&.saving": UuGds.Shape.getStateStyles(states.saving),
  };

  return [styles, gdsBackground]; // gdsBackground required by InputBox
}

function getInputStyles({ size, borderRadius, multipleRows, containerSize, textType }) {
  const interactive = UuGds.getValue(["Typography", "interface", "content"]);
  const { height, borderRadius: radius } = UuGds.getSizes("spot", "basic", containerSize ?? size, borderRadius);

  return {
    ...(multipleRows ? { minHeight: height } : { height }),
    borderRadius: radius,
    padding: UuGds.getValue(["SpacingPalette", "relative", "d"]) * height,
    ...interactive[textType ?? TEXT_TYPE_MAP[size]],
  };
}

//@@viewOff:helpers

const _Input = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
    effect: PropTypes.oneOf(["ground", "upper"]),
    size: PropTypes.oneOf(Object.keys(TEXT_TYPE_MAP)),
    borderRadius: PropTypes.borderRadius,
    width: PropTypes.unit,

    name: PropTypes.string,
    // prettier-ignore
    type: PropTypes.oneOfType([
      PropTypes.elementType,
      PropTypes.oneOf([
        "text", "password", "number", "email", "tel", "date", "time", "datetime-local", "week", "month", "search", "url",
        "checkbox", "radio", "textarea", "color", "file", "range"
      ])
    ]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    placeholder: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    readOnly: PropTypes.bool,
    required: PropTypes.bool,
    autoFocus: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    colorScheme: "building",
    significance: "common",
    effect: undefined,
    size: "m",
    borderRadius: "moderate",
    width: undefined,

    name: undefined,
    type: "text",
    value: undefined,
    placeholder: undefined,
    onChange: undefined,
    onFocus: undefined,
    onBlur: undefined,
    readOnly: false,
    required: false,
    autoFocus: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { size, ...restProps } = props;

    const { isMobileOrTablet, browserName, platform } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
    const textType = (isMobileOrTablet && TEXT_TYPE_MAP_MOBILE[size]) || TEXT_TYPE_MAP[size];

    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const [shapeStyles] = getShapeStyles({ ...props, background });

    let { elementAttrs, componentProps } = Utils.VisualComponent.splitProps(
      restProps,
      Css.main({ ...props, background, shapeStyles, containerSize, textType, isMobileOrTablet, platform }),
    );

    const {
      type,
      name,
      placeholder,
      readOnly,
      required,
      value,
      onChange,
      onFocus,
      onBlur,
      autoFocus,

      borderRadius,
      colorScheme,
      significance,
      effect,
      validationMap,
      width,
      nestingLevel,
      focus,
      clearIcon,

      ...propsToPass
    } = componentProps;

    let inputAttrs = { type, name, placeholder, readOnly, required, autoFocus, onFocus, onBlur };

    // because of password value which should not be seen in html
    const inputRef = useRef();
    useEffect(() => {
      if (type === "password" && typeof onChange === "function" && inputRef.current.value !== value) {
        inputRef.current.value = value;
      }
    }, [value, type]);

    const isCheckbox = ["checkbox", "radio"].indexOf(type) > -1;

    if (value != null) {
      if (isCheckbox) {
        inputAttrs.checked = value;
      } else if (typeof onChange === "function") {
        // because of password value which should not be seen in html
        if (type !== "password") inputAttrs.value = value;
      } else {
        inputAttrs.defaultValue = value;
      }
    }

    if (typeof onChange === "function") {
      inputAttrs.onChange = (e) => {
        if (!e.data) {
          // in case of custom type input component
          const value = isCheckbox ? e.target.checked : e.target.value;
          e = new Utils.Event({ value: value === "" ? undefined : value }, e);
        }
        onChange(e);
      };
    }

    if (typeof onBlur === "function") {
      inputAttrs.onBlur = (e) => {
        if (browserName === "firefox" && e.currentTarget === document.activeElement) {
          e.stopPropagation();
          return;
        }
        onBlur(e);
      };
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let Element = "input";

    if (type === "textarea") {
      Element = "textarea";
      delete inputAttrs.type;
    } else if (typeof type !== "string") {
      Element = type;
      inputAttrs = { ...inputAttrs, ...propsToPass, value, width };
      delete inputAttrs.type;
    }

    return <Element {...inputAttrs} {...elementAttrs} ref={Utils.Component.combineRefs(elementAttrs.ref, inputRef)} />;
    //@@viewOff:render
  },
});

const Input = withLsi(_Input, ["placeholder"]);

Input._getShapeStyles = getShapeStyles;
Input._getInputStyles = getInputStyles;
Input._CONTAINER_SIZE_MAP_MOBILE = CONTAINER_SIZE_MAP_MOBILE;
Input._TEXT_TYPE_MAP = TEXT_TYPE_MAP;
Input._TEXT_TYPE_MAP_MOBILE = TEXT_TYPE_MAP_MOBILE;

export { Input };
export default Input;
