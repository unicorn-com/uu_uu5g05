//@@viewOn:imports
import {
  createVisualComponent,
  Utils,
  PropTypes,
  useBackground,
  BackgroundProvider,
  useState,
  useEffect,
  useRef,
} from "uu5g05";
import UuGds from "./_internal/gds.js";
import Icon from "./icon.js";
import RichIcon from "./rich-icon";
import Button from "./button.js";
import Config from "./config/config.js";
import useSpacing from "./use-spacing.js";
import Progress from "./progress";
//@@viewOff:imports

const ICON_DEFAULT = {
  important: "uugds-info-circle-solid",
  positive: "uugds-check-circle",
  warning: "uugds-alert",
  negative: "uugds-alert-circle",
};

const DEFAULT_STYLES = {
  display: "grid",
};

const SIGNIFICANCE_MAP = {
  common: "distinct",
  distinct: "subdued",
  subdued: "common",
};

const Css = {
  main: ({ d, borderRadius, shapeStyles, icon, onClose, controlPosition }) => {
    let radius = UuGds.getValue(["RadiusPalette", "box", borderRadius]);
    if (radius && typeof radius === "object") radius = radius.max;

    return [
      Config.Css.css(DEFAULT_STYLES),
      Config.Css.css({
        ...shapeStyles,
        padding: d,
        borderRadius: radius,
        gridTemplateColumns: [
          icon !== null ? "auto" : null,
          "1fr",
          onClose || controlPosition === "right" ? "auto" : null,
        ]
          .filter(Boolean)
          .join(" "),
      }),
    ].join(" ");
  },
  icon: () => {
    const sizes = UuGds.getSizes("spot", "basic", "m", "full");
    return Config.Css.css({
      fontSize: "2em",
      height: sizes.height,
      aspectRatio: "1 / 1",
      "&&": {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      },
    });
  },
  closeButton: ({ c }) => {
    return Config.Css.css({
      marginLeft: c,
    });
  },
  body: (padding) => {
    return Config.Css.css({
      flex: 1,
      alignSelf: "center",
      minWidth: 0,
      ...padding,
    });
  },
  bodyBordered: ({ background, colorScheme, b }) => {
    const states = UuGds.getValue(["Shape", "line", background, colorScheme, "highlighted"]);
    const styles = UuGds.Shape.getStateStyles(states.default, true);
    return Config.Css.css({
      borderWidth: styles.borderWidth,
      borderStyle: styles.borderStyle,
      borderColor: styles.borderColor,
      borderTop: 0,
      borderRight: 0,
      borderBottom: 0,
      marginLeft: b,
    });
  },
  controls: ({ direction, paddingLeft, marginTop, controlPosition, gridColumnsCount }) => {
    return Config.Css.css({
      gridColumn: gridColumnsCount > 1 ? "span " + gridColumnsCount : undefined,
      display: "flex",
      flexWrap: "nowrap",
      justifyContent: direction,
      alignItems: controlPosition === "right" ? "center" : undefined,
      paddingLeft: paddingLeft,
      marginTop: marginTop,
      gap: UuGds.getValue(["SpacingPalette", "fixed", "c"]),
    });
  },
  button: () => Config.Css.css``,
};

//@@viewOn:helpers
function getShapeStyles({ background, colorScheme, significance, overlay }) {
  if (overlay) significance = SIGNIFICANCE_MAP[significance] || significance;
  let states = UuGds.getValue([
    "Shape",
    overlay ? "overlay" : "interactiveElement",
    background,
    colorScheme,
    significance,
  ]);
  const gdsBackground = states.default.colors?.gdsBackground;

  if (!overlay) {
    states = JSON.parse(JSON.stringify(states));
    states.default.colors.foreground = UuGds.getValue([
      "Shape",
      "overlay",
      background,
      colorScheme,
      significance,
    ]).default.colors.foreground;

    if (states.saving?.colors?.foreground) {
      states.saving.colors.foreground = states.default.colors.foreground;
    }
  }

  const styles = {
    ...UuGds.Shape.getStateStyles(states.default, true),

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
    },
  };
  return [styles, gdsBackground];
}

function ProgressCircle({ durationMs, progressing, ...props }) {
  const { onCancel } = props;
  const [value, setValue] = useState(100);

  useEffect(() => {
    if (progressing) {
      const ms = 250;
      const step = durationMs / ms;
      const timeout = setTimeout(() => setValue(Math.max(0, value - 100 / step)), ms);
      return () => clearTimeout(timeout);
    }
  }, [durationMs, value, progressing]);

  useEffect(() => {
    if (value === 0) onCancel?.();
  }, [onCancel, value]);

  return <Progress {...props} value={value} />;
}

const ControlsRow = ({ significance, controlPosition, controlList, colorScheme, spacing, gridColumnsCount }) => {
  const direction = significance === "subdued" ? "start" : "end";
  const paddingLeft = controlPosition === "right" ? spacing.d : 0;
  const marginTop = controlPosition === "bottom" ? spacing.c : 0;

  return (
    <div
      data-testid="controls"
      className={Css.controls({ direction, paddingLeft, marginTop, controlPosition, gridColumnsCount })}
    >
      {controlList.map(({ element, colorScheme: buttonColorScheme, className, ...buttonProps }, i) => {
        return element ? (
          Utils.Element.clone(element, { key: i })
        ) : (
          <Button
            key={i}
            {...buttonProps}
            className={Utils.Css.joinClassName(className, Css.button())}
            colorScheme={buttonColorScheme || colorScheme || "primary"}
          />
        );
      })}
    </div>
  );
};

//@@viewOff:helpers

const HighlightedBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "HighlightedBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
    borderRadius: PropTypes.borderRadius,
    icon: Icon.propTypes.icon,
    iconText: PropTypes.node,
    onClose: PropTypes.func,
    controlList: PropTypes.arrayOf(PropTypes.shape(Button.propTypes)),
    controlPosition: PropTypes.oneOf(["right", "bottom"]),
    overlay: PropTypes.bool,
    durationMs: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    colorScheme: "important",
    significance: "common",
    borderRadius: "moderate",
    icon: undefined,
    iconText: undefined,
    onClose: undefined,
    controlList: undefined,
    controlPosition: "right",
    overlay: false,
    durationMs: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      colorScheme,
      significance,
      icon,
      iconText,
      onClose,
      controlPosition,
      controlList,
      children,
      durationMs,
      _progressing = true,
    } = props;

    const [hovered, setHovered] = useState(false);
    const progressing = !hovered && _progressing;

    const spacing = useSpacing();

    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const [shapeStyles, gdsBackground] = getShapeStyles({ ...props, background });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main({ ...props, ...spacing, background, shapeStyles }));

    let isChildrenFn = typeof children === "function";
    let padding = {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: isChildrenFn || icon === null ? 0 : spacing.b,
      paddingRight: 0,
    };
    let bodyClassName = Css.body(padding);

    if (significance === "subdued") bodyClassName += " " + Css.bodyBordered({ ...props, ...spacing, background });

    let controlsRow = null;
    if (controlList) {
      let gridColumnsCount = 1;
      if (controlPosition === "bottom" || onClose) {
        if (icon !== null) gridColumnsCount++;
        if (onClose) gridColumnsCount++;
      }
      controlsRow = (
        <ControlsRow {...{ significance, controlPosition, controlList, colorScheme, spacing, gridColumnsCount }} />
      );
    }

    const ref = useRef();

    useEffect(() => {
      if (durationMs) {
        let el = ref.current;
        const enterFn = (e) => {
          setHovered(true);
          Utils.EventManager.register("pointerleave", () => setHovered(false), el);
        };

        Utils.EventManager.register("pointerenter", enterFn, el);
        return () => Utils.EventManager.unregister("pointerenter", enterFn, el);
      }
    }, [durationMs]);

    return (
      <BackgroundProvider background={gdsBackground ?? background}>
        <div {...attrs} ref={Utils.Component.combineRefs(ref, attrs.ref)}>
          {iconText ? (
            <RichIcon
              testId="icon"
              className={Css.icon()}
              text={iconText}
              colorScheme={significance !== "highlighted" ? colorScheme : undefined}
            />
          ) : (
            icon !== null && (
              <Icon
                testId="icon"
                className={Css.icon()}
                icon={icon || ICON_DEFAULT[colorScheme] || ICON_DEFAULT.important}
                colorScheme={significance !== "highlighted" ? colorScheme : undefined}
              />
            )
          )}
          <div className={bodyClassName}>
            {isChildrenFn ? children({ style: { ...padding, paddingLeft: icon === null ? 0 : spacing.c } }) : children}
          </div>
          {typeof onClose === "function" ? (
            durationMs ? (
              <ProgressCircle
                durationMs={durationMs}
                type="circular"
                onCancel={onClose}
                size="m"
                colorScheme={colorScheme}
                // significance="subdued" // does not work
                className={Config.Css.css({ marginLeft: 16 })}
                progressing={progressing}
              />
            ) : (
              <Button
                onClick={onClose}
                className={Css.closeButton(spacing)}
                icon="uugds-close"
                significance="subdued"
                colorScheme="neutral"
              />
            )
          ) : null}
          {controlsRow}
        </div>
      </BackgroundProvider>
    );
    //@@viewOff:render
  },
});

export { HighlightedBox };
export default HighlightedBox;
