//@@viewOn:imports
import {
  createVisualComponent,
  Utils,
  PropTypes,
  useRef,
  useEffect,
  Lsi,
  useBackground,
  BackgroundProvider,
  useDevice,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import InputText from "./input-text.js";
import { getPlaceholderStyles } from "./tools.js";
//@@viewOff:imports

const DEFAULT_STYLES = {
  position: "relative",
  display: "inline-flex",
  alignItems: "safe center",
  outline: "none",
  overflow: "hidden",
  minWidth: 0,
};

const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;
const TEXT_TYPE_MAP_MOBILE = Uu5Elements.Input._TEXT_TYPE_MAP_MOBILE;
const TEXT_TYPE_MAP = Uu5Elements.Input._TEXT_TYPE_MAP;

const Css = {
  main({ width, type, placeholder, children, padding: propsPadding, shapeStyles, ...props }) {
    let { padding, ...inputBoxStyles } = Uu5Elements.Input._getInputStyles(props);
    inputBoxStyles.paddingLeft = inputBoxStyles.paddingRight = padding;
    if (propsPadding) inputBoxStyles = { ...inputBoxStyles, ...Utils.Style.parseSpace(propsPadding, "padding") };
    width != null && width !== "auto" && (inputBoxStyles.width = width);

    const displayPlaceholder = placeholder && !children;

    let dynamicStyles;
    if (!props.readOnly) dynamicStyles = { cursor: "pointer" };
    if (displayPlaceholder) {
      shapeStyles = { ...shapeStyles, ...getPlaceholderStyles(props.background) };
    }

    return [DEFAULT_STYLES, dynamicStyles, inputBoxStyles, shapeStyles].map((style) => Config.Css.css(style)).join(" ");
  },
  placeholder: () =>
    Config.Css.css({
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
};

const { type, onChange, ...inputPropTypes } = Uu5Elements.Input.propTypes;
const { type: _, onChange: __, ...inputDefaultProps } = Uu5Elements.Input.defaultProps;

const InputBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...inputPropTypes,
    placeholder: PropTypes.lsi,
    onClick: PropTypes.func,
    onEnter: PropTypes.func,
    multipleRows: PropTypes.bool,
    focused: PropTypes.bool,
    padding: PropTypes.space,
    role: PropTypes.string,
    forceFocusPseudoClass: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...inputDefaultProps,
    width: InputText.defaultProps.width,
    onClick: undefined,
    onEnter: undefined,
    multipleRows: false,
    focused: false,
    padding: undefined,
    role: undefined,
    forceFocusPseudoClass: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      children,
      name,
      readOnly,
      required,
      disabled,
      onClick,
      onEnter,
      onLeave,
      autoFocus,
      placeholder,
      onFocus,
      onBlur,
      role,
      size,
    } = props;
    const inputBoxAttrs = { name, onFocus, onBlur, role };
    const inputBoxRef = useRef();

    const { isMobileOrTablet } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
    const textType = (isMobileOrTablet && TEXT_TYPE_MAP_MOBILE[size]) || TEXT_TYPE_MAP[size];

    useEffect(() => {
      autoFocus && inputBoxRef.current.focus();
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, []);

    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const [shapeStyles, gdsBackground] = Uu5Elements.Input._getShapeStyles({ ...props, background });

    const { ref, ...attrs } = Utils.VisualComponent.getAttrs(
      props,
      Css.main({ ...props, background, shapeStyles, containerSize, textType }),
    );

    if (!readOnly && !disabled && (onEnter || onLeave)) {
      const origKeyDown = attrs.onKeyDown;
      attrs.onKeyDown = (e) => {
        typeof origKeyDown === "function" && origKeyDown(e);
        if (!e.defaultPrevented) {
          switch (e.key) {
            case "Tab":
              if (typeof onLeave === "function") onLeave(e);
              break;
            case "Enter":
            case "NumpadEnter":
            case " ": // space
            case "ArrowDown":
              if (typeof onEnter === "function") {
                e.preventDefault();
                onEnter(e);
              }
              break;
          }
        }
      };
    } else if (readOnly) {
      attrs["aria-readonly"] = true;
    }
    if (required) {
      attrs["aria-required"] = true;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    function renderPlaceholder() {
      if (!placeholder) return;

      let result = placeholder;

      if (typeof placeholder === "object") result = <Lsi lsi={placeholder} />;

      return <span className={Css.placeholder()}>{result}</span>;
    }

    return (
      <BackgroundProvider background={gdsBackground ?? background}>
        <div
          {...attrs}
          {...inputBoxAttrs}
          onClick={readOnly || disabled ? undefined : onClick}
          tabIndex={disabled ? undefined : attrs.tabIndex || 0}
          ref={Utils.Component.combineRefs(inputBoxRef, ref)}
        >
          {children || renderPlaceholder()}
        </div>
      </BackgroundProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { InputBox };
export default InputBox;
