//@@viewOn:imports
import {
  Utils,
  createVisualComponent,
  useEffect,
  useRef,
  useState,
  PropTypes,
  createComponent,
  useBackground,
  useDevice,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import withExtensionInput, { FEEDBACK_ICON_MAP, Icon } from "../with-extension-input.js";
import withFormInput from "../with-form-input";
import useFocusWithCheck from "./use-focus-with-check.js";
import useHover from "./use-hover.js";
//@@viewOff:imports

const COLOR_SCHEME_MAP = Config.COLOR_SCHEME_MAP;
const UuGds = Uu5Elements.UuGds;

const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;
const TEXT_TYPE_MAP_MOBILE = Uu5Elements.Input._TEXT_TYPE_MAP_MOBILE;
const TEXT_TYPE_MAP = Uu5Elements.Input._TEXT_TYPE_MAP;

function getCheckboxStyles({ width, borderRadius, containerSize }) {
  const { height, borderRadius: radius } = UuGds.getSizes("spot", "basic", containerSize, borderRadius);

  return {
    minHeight: height, // minHeight instea of height for multi-row labels
    width,
    borderRadius: radius,
    paddingLeft: UuGds.getValue(["SpacingPalette", "relative", "c"]) * height,
  };
}

const Css = {
  main(props) {
    let { shapeStyles } = props;
    const staticStyles = {
      display: "inline-flex",
      alignItems: "center",
      outline: "none",
      cursor: props.readOnly || props.pending ? "default" : "pointer",
    };

    if (!props.box) {
      shapeStyles = { ...shapeStyles };
      shapeStyles.backgroundColor = "transparent";
      shapeStyles.borderColor = "transparent";
      shapeStyles.boxShadow = "none";
      delete shapeStyles["&:hover"];
      delete shapeStyles["&:focus"];
      delete shapeStyles["&:focus-visible"];
    }

    const checkboxStyles = getCheckboxStyles(props);
    return [staticStyles, shapeStyles, checkboxStyles].map((style) => Config.Css.css(style)).join(" ");
  },
};

const { type, placeholder, ...propTypes } = Uu5Elements.Input.propTypes;
const { type: _type, placeholder: _placeholder, ...defaultProps } = Uu5Elements.Input.defaultProps;

let _InputCheckboxCover = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputCheckboxCover",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    value: PropTypes.any,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    colorScheme: "dim",
    significance: "subdued",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { size } = props;
    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const [shapeStyles] = Uu5Elements.Input._getShapeStyles({ ...props, background });

    const { isMobileOrTablet } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
    const textType = (isMobileOrTablet && TEXT_TYPE_MAP_MOBILE[size]) || TEXT_TYPE_MAP[size];

    const [{ ref, ...attrs }, otherProps] = Utils.VisualComponent.splitProps(
      props,
      Css.main({ ...props, background, shapeStyles, containerSize }),
    );
    otherProps.disabled = props.disabled;
    otherProps.id = props.id;

    let {
      onChange,
      children,
      autoFocus,
      nextValue,
      label,
      disabled,
      pending,
      _feedback,
      onFeedbackClick,
      box,
      readOnly,
      required,
      info,
    } = otherProps;
    let { onFocus, onBlur, ...propsToPass } = otherProps;

    // isHovered is used to display the icon without checking the checkbox
    const [isHovered, hoverRef] = useHover(readOnly || disabled);
    const [, handleFocus, handleBlur] = useFocusWithCheck(props);
    const elementRef = useRef();
    const inputRef = useRef();

    useEffect(() => {
      if (autoFocus) {
        box ? elementRef.current.focus() : inputRef.current.focus();
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, []);

    if (!disabled && !pending) {
      const onClick = attrs.onClick;
      attrs.onClick = (e) => {
        // focus on the CheckboxInput
        if (!box) inputRef.current.focus();
        if (!readOnly) {
          typeof onClick === "function" && onClick(e);
          onChange(new Utils.Event({ value: nextValue }, e));
        }
      };

      if (!readOnly && typeof onChange === "function") {
        const onKeyDown = attrs.onKeyDown;
        attrs.onKeyDown = (e) => {
          typeof onKeyDown === "function" && onKeyDown(e);
          if (!e.defaultPrevented) {
            switch (e.key) {
              case " ": // space
              case "Enter": // enter
              case "NumpadEnter": // numpad enter
                e.preventDefault();
                onChange(new Utils.Event({ value: nextValue }, e));
                break;
            }
          }
        };
      } else if (readOnly) {
        attrs["aria-readonly"] = true;
      }
    }

    if (required) attrs["aria-required"] = true;

    attrs.tabIndex = disabled ? undefined : attrs.tabIndex === undefined ? 0 : attrs.tabIndex;

    const [checkboxInputId] = useState(props.id || (() => Utils.String.generateId()));
    const labelId = checkboxInputId + "-label";

    function usedHandleFocus(e) {
      if (e.target !== inputRef.current) handleFocus(e);
    }

    function usedHandleBlur(e) {
      // Prevent blurring if new focus target is still inside the cover
      if (!e.relatedTarget || !elementRef.current.contains(e.relatedTarget)) handleBlur(e);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div
        {...attrs}
        onFocus={usedHandleFocus}
        onBlur={usedHandleBlur}
        id={checkboxInputId}
        ref={Utils.Component.combineRefs(ref, elementRef, hoverRef)}
      >
        {typeof children === "function"
          ? children({
              tabIndex: attrs.tabIndex,
              ...propsToPass,
              onFocus: handleFocus, // We have to detect focus on this element when using tab key
              isHovered,
              elementRef: inputRef,
              elementAttrs: { "aria-labelledby": labelId },
            })
          : children}
        <Uu5Elements.Label
          id={labelId}
          htmlFor={checkboxInputId}
          colorScheme={null}
          info={info}
          required={required}
          size={containerSize}
          className={
            label === undefined
              ? null
              : Config.Css.css({ marginLeft: UuGds.getValue(["SpacingPalette", "inline", "d"]) })
          }
        >
          {label}
        </Uu5Elements.Label>
        {!box && _feedback && (
          <span>
            <Icon
              icon={FEEDBACK_ICON_MAP[_feedback]}
              colorScheme={COLOR_SCHEME_MAP[_feedback]}
              size={size}
              containerSize={containerSize}
              textType={textType}
              onClick={typeof onFeedbackClick === "function" ? onFeedbackClick : undefined}
            />
          </span>
        )}
        {!box && pending && (
          <span>
            <Uu5Elements.Pending size="xs" />
          </span>
        )}
      </div>
    );
    //@@viewOff:render
  },
});

const InputCheckboxCoverWithBox = withExtensionInput(_InputCheckboxCover);
const InputCheckboxCoverWithoutBox = _InputCheckboxCover;

// delete props which are not on API
["iconLeft", "onIconLeftClick", "iconRight", "onIconRightClick", "iconRightList", "prefix", "suffix"].forEach(
  (prop) => {
    delete InputCheckboxCoverWithBox.propTypes[prop];
    delete InputCheckboxCoverWithBox.defaultProps[prop];
  },
);

function withCheckboxInput(Input, uu5Tag) {
  const InputCheckbox = withFormInput(Input);

  return createComponent({
    //@@viewOn:statics
    uu5Tag,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...InputCheckbox.propTypes,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...InputCheckbox.defaultProps,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { label, info, ...otherProps } = props;
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <InputCheckbox {...otherProps} _info={info}>
          {label}
        </InputCheckbox>
      );
      //@@viewOff:render
    },
  });
}

export { InputCheckboxCoverWithBox, InputCheckboxCoverWithoutBox, withCheckboxInput };
export default InputCheckboxCoverWithBox;
