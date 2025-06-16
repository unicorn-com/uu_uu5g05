//@@viewOn:imports
import {
  Utils,
  createVisualComponent,
  PropTypes,
  useEffect,
  useRef,
  useBackground,
  BackgroundProvider,
  useDevice,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
//@@viewOff:imports

const SIZE = {
  xxs: 16,
  xs: 16,
  s: 20,
  m: 20,
  l: 24,
  xl: 24,
};

const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;

const Css = {
  main(props) {
    const { shapeStyles, background, significance, colorScheme = "building", isHovered, contentColorScheme } = props;
    const staticStyles = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      outline: "none",
      cursor: props.readOnly ? "default" : "pointer",
      // this establishes baseline of the whole element (because it is 1st content inside)
      "&:before": {
        content: '"\\200b"',
        width: 0,
        overflow: "hidden",
        alignSelf: "center",
      },
    };

    if (props.isHovered) {
      shapeStyles.borderColor = shapeStyles["&:hover"].borderColor;
    }

    let iconBg;
    const conBg = ["dark", "full"].indexOf(background) > -1 && colorScheme === "building";
    if (significance === "highlighted") {
      iconBg = conBg ? "light" : "full";
    } else {
      iconBg = conBg ? "full" : "light";
    }
    const contentStyles = Uu5Elements.Text._getColorStyles({
      background: iconBg,
      colorScheme: contentColorScheme || colorScheme,
      significance: contentColorScheme ? "subdued" : "common",
      hoverable: true,
    });
    if (isHovered) contentStyles.color = contentStyles["&:hover"].color;

    shapeStyles.color = contentStyles.color;
    shapeStyles["&:hover"].color = contentStyles["&:hover"].color;

    const checkboxStyles = getCheckboxStyles(props);

    return [staticStyles, shapeStyles, checkboxStyles].map((style) => Config.Css.css(style)).join(" ");
  },
  icon(props) {
    return Config.Css.css({ "&:before": { verticalAlign: "top" } });
  },
};

const UuGds = Uu5Elements.UuGds;

function getCheckboxStyles({ containerSize, borderRadius }) {
  const interactive = UuGds.getValue(["Typography", "interface", "interactive"]);
  const radius = UuGds.getValue(["RadiusPalette", "spot", borderRadius]);
  const height = UuGds.SizingPalette.getValue(["inline", "emphasized"]);

  return {
    minWidth: height,
    height,
    borderRadius: radius
      ? typeof radius === "number"
        ? radius * 100 + "%"
        : `min(calc(${radius.value} * ${height}), ${radius.max}px)`
      : undefined,
    ...interactive[Config.SIZE_TYPO[containerSize]],
  };
}

const { width, type, placeholder, value, required, ...propTypes } = Uu5Elements.Input.propTypes;
const {
  width: _width,
  type: _type,
  placeholder: _placeholder,
  value: _value,
  required: _required,
  ...defaultProps
} = Uu5Elements.Input.defaultProps;

const CheckboxInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Checkbox.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    significance: PropTypes.oneOf(["common", "highlighted"]),
    icon: Uu5Elements.Icon.propTypes.icon,
    onClick: PropTypes.func,
    role: PropTypes.oneOf(["checkbox", "radio"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    icon: undefined,
    onClick: undefined,
    role: "checkbox",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { icon, readOnly, autoFocus, onClick, onFocus, onBlur, disabled, role, children, size } = props;

    const { isMobileOrTablet } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;

    const elementRef = useRef();
    useEffect(() => {
      autoFocus && elementRef.current.focus();
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, []);

    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const [shapeStyles, gdsBackground] = Uu5Elements.Input._getShapeStyles({ ...props, background });
    const { ref, ...attrs } = Utils.VisualComponent.getAttrs(
      props,
      Css.main({ ...props, background, shapeStyles, gdsBackground, containerSize }),
    );

    if (!readOnly && !disabled) {
      attrs.onClick = onClick;

      if (typeof onClick === "function") {
        const onKeyDown = attrs.onKeyDown;

        attrs.onKeyDown = (e) => {
          typeof onKeyDown === "function" && onKeyDown(e);
          if (!e.defaultPrevented) {
            switch (e.key) {
              case " ": // space
              case "Enter":
              case "NumpadEnter":
                e.preventDefault();
                onClick(e);
                break;
            }
          }
        };
      }
    } else if (readOnly) {
      attrs["aria-readonly"] = true;
    }

    attrs.tabIndex = disabled ? undefined : attrs.tabIndex || 0;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <BackgroundProvider background={gdsBackground ?? background}>
        <span
          {...attrs}
          ref={Utils.Component.combineRefs(ref, elementRef)}
          onFocus={onFocus}
          onBlur={onBlur}
          role={role}
        >
          {icon ? <Uu5Elements.Icon icon={icon} className={Css.icon(props)} /> : children}
        </span>
      </BackgroundProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { CheckboxInput, SIZE };
export default CheckboxInput;
