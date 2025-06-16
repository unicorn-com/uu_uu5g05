//@@viewOn:imports
import { createVisualComponent, PropTypes, useBackground, Utils } from "uu5g05";
import Config from "../config/config.js";
import UuGds from "../_internal/gds.js";
//@@viewOff:imports

const StepperMini = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "StepperMini",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    steps: PropTypes.number.isRequired,
    onStepClick: PropTypes.func,
    activeIndex: PropTypes.number,
    colorScheme: PropTypes.colorScheme,
    type: PropTypes.oneOf(["inner", "outer"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    steps: undefined,
    onStepClick: undefined,
    activeIndex: 0,
    colorScheme: "primary",
    type: "outer",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { steps, onStepClick, activeIndex } = props;

    const background = useBackground();

    function getStepClickHandler(index) {
      return (e) => {
        if (typeof onStepClick === "function") {
          onStepClick(new Utils.Event({ index }, e));
        }
      };
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const classNames = getClassNames(props, background, onStepClick);
    const attrs = Utils.VisualComponent.getAttrs(props, classNames.main());

    return (
      <div {...attrs} data-testid="stepper">
        {[...new Array(steps)].map((_, i) => (
          <div
            key={i}
            className={classNames.step(i === activeIndex)}
            onClick={activeIndex !== i ? getStepClickHandler(i) : undefined}
            data-testid={`step-${i}`}
          />
        ))}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function getClassNames({ colorScheme, type }, background, onStepClick) {
  const defaultStates = UuGds.getValue([
    "Shape",
    "interactiveElement",
    type === "inner" ? "soft" : background,
    type === "inner" ? "building" : colorScheme,
    "common",
  ]);
  const defaultStyles = UuGds.Shape.getStateStyles(defaultStates.default, true);

  const interactiveStates = UuGds.getValue([
    "Shape",
    "interactiveElement",
    type === "inner" ? "full" : background,
    colorScheme,
    "common",
  ]);
  const hoverStyles = UuGds.Shape.getStateStyles(interactiveStates.accent);
  const pressedStyles = UuGds.Shape.getStateStyles(interactiveStates.marked);

  const activeStates = UuGds.getValue([
    "Shape",
    "interactiveElement",
    type === "inner" ? "dark" : background,
    type === "inner" ? "building" : colorScheme,
    "highlighted",
  ]);
  const defaultActiveStyles = UuGds.Shape.getStateStyles(activeStates.default, true);

  const sizeXs = UuGds.getValue(["SizingPalette", "spot", "minor", "xs"]).h;
  const borderRadius = UuGds.RadiusPalette.getValue(["spot", "full"], { height: sizeXs });

  return {
    main: () => {
      const { h: backgroundBottomPadding } = UuGds.getValue(["SizingPalette", "spot", "minor", "m"]);

      // Background is used only for inner type. Building is default on inner type
      const backgroundStates = UuGds.getValue(["Shape", "background", "full", "building", "distinct"]);
      const { backgroundColor } = UuGds.Shape.getStateStyles(backgroundStates.default, true);

      let additionalStyles = {};
      if (background === "full") {
        additionalStyles = {
          marginBottom: backgroundBottomPadding,
          borderRadius: UuGds.getValue(["RadiusPalette", "box", "elementary"]),
        };
      }
      if (type === "inner") {
        additionalStyles.backgroundColor = backgroundColor;
      }

      return Config.Css.css({
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        alignContent: "center",
        justifyContent: "center",
        gap: UuGds.SpacingPalette.getValue(["fixed", "c"]),
        ...additionalStyles,
      });
    },
    step: (isActive) => {
      let styles = {
        width: sizeXs,
        height: sizeXs,

        borderRadius,

        ...(isActive ? defaultActiveStyles : defaultStyles),

        "@media print": {
          "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(defaultStates.saving),
        },
      };

      if (typeof onStepClick === "function") {
        styles = {
          ...styles,
          cursor: "pointer",
          "&:hover, &:focus-visible": hoverStyles,
          "&:active": pressedStyles,
        };
      }

      return Config.Css.css(styles);
    },
  };
}
//@@viewOff:helpers

export { StepperMini };
export default StepperMini;
