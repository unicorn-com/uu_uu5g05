//@@viewOn:imports
import {
  BackgroundProvider,
  createVisualComponent,
  PropTypes,
  useDevice,
  useRef,
  useState,
  useUpdateEffect,
  Utils,
} from "uu5g05";
import Config from "./config/config.js";
import UuGds from "./_internal/gds.js";
import CarouselView from "./_carousel/carousel-view.js";
import StepperMini from "./_carousel/stepper-mini.js";
import withCarouselVirtualization from "./_carousel/with-carousel-virtualization.js";
import useSwipe from "./_internal/use-swipe.js";
import Button from "./button.js";
//@@viewOff:imports

const carouselViewPropTypes = { ...CarouselView.propTypes };
const carouselViewDefaultProps = { ...CarouselView.defaultProps };
const exclusionList = ["applyInfiniteTransition"];
for (let key in exclusionList) {
  delete carouselViewPropTypes[key];
  delete carouselViewDefaultProps[key];
}

//@@viewOn:helpers
const VirtualizedCarouselView = withCarouselVirtualization(CarouselView);

const CLASS_NAMES = {
  main: ({ hasTouch }) => {
    return Config.Css.css({
      display: "grid",
      gridTemplateRows: "1fr min-content",
      position: "relative",
      touchAction: hasTouch ? "pan-right pan-y pinch-zoom" : undefined,
    });
  },
  innerWrapper: () =>
    Config.Css.css({
      display: "grid",
      gridTemplateColumns: "min-content minmax(0, 1fr) min-content",
      position: "relative",
    }),
  viewWrapper: (buttons) => {
    let horizontalSpacing = buttons === "outer" ? UuGds.SpacingPalette.getValue(["fixed", "b"]) : 0;
    return Config.Css.css({
      padding: `0px ${horizontalSpacing}px`,
      gridColumn: buttons === "outer" ? undefined : "1 / 4",
    });
  },
  button: (buttons, side) => {
    if (buttons === "inner") {
      return Config.Css.css({
        position: "absolute",
        [side]: UuGds.SpacingPalette.getValue(["fixed", "e"]),
        top: 0,
        bottom: 0,
        margin: "auto 0",
        zIndex: 1,
      });
    } else {
      return Config.Css.css({ alignSelf: "center" });
    }
  },
  stepper: (stepper) => {
    let styles = {};
    if (stepper === "inner") {
      styles = {
        padding: UuGds.SpacingPalette.getValue(["fixed", "c"]),
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1,
      };
    } else {
      styles = {
        padding: UuGds.SpacingPalette.getValue(["fixed", "e"]),
        paddingBottom: 0,
      };
    }

    return Config.Css.css(styles);
  },
};

function getButton(buttons, colorScheme, side, disabled, onClick) {
  if (buttons === "none") return;

  const btn = (
    <Button
      onClick={onClick}
      icon={`uugds-chevron-${side}`}
      className={CLASS_NAMES.button(buttons, side)}
      disabled={disabled}
      significance={buttons === "inner" ? "common" : "subdued"}
      colorScheme={colorScheme}
      elementAttrs={{ "aria-label": side === "left" ? "previous" : "next" }}
      borderRadius={buttons === "inner" ? "full" : undefined}
    />
  );

  return buttons === "outer" ? btn : <BackgroundProvider background={"full"}>{btn}</BackgroundProvider>;
}

function isInfiniteTransition({ index, type }, nextInfinitePos) {
  // Pass undefined instead of false because false prevents the CarouselView from doing
  // the infinite transition based on its own logic. Undefined just means that we dont want
  // to force it.
  if (nextInfinitePos === undefined) return undefined;
  return type === "infinite" && nextInfinitePos === index ? true : undefined;
}

const getDefaultColorScheme = (colorScheme, variant) => {
  if (!colorScheme && variant === "inner") {
    return "building";
  } else if (!colorScheme && variant === "outer") {
    return "primary";
  }
  return colorScheme;
};
//@@viewOff:helpers

const Carousel = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Carousel",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...carouselViewPropTypes,
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    stepper: PropTypes.oneOf(["none", "outer", "inner"]),
    buttons: PropTypes.oneOf(["none", "outer", "inner"]),
    virtualization: PropTypes.bool,
    stopIntervalOnHover: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...carouselViewDefaultProps,
    colorScheme: "primary",
    stepper: "outer",
    buttons: "outer",
    virtualization: false,
    stopIntervalOnHover: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, index, onIndexChange, type, intervalMs, stopIntervalOnHover, colorScheme } = props;
    const { stepper, buttons, virtualization, ...otherProps } = props;
    const childList = Utils.Content.toArray(children);
    let stepperColorScheme = getDefaultColorScheme(colorScheme, stepper);
    let buttonsColorScheme = getDefaultColorScheme(colorScheme, buttons);

    // When type="infinite" and arrow button is clicked, remember what the index should be
    // and if it fits with the next received index, apply the infinite animation. If not, it
    // means that the index was changed other way then by clicking the arrows and thus
    // the animation shouldn't be infinite.
    const nextInfinitePosRef = useRef();
    useUpdateEffect(() => {
      nextInfinitePosRef.current = undefined;
    });

    function getMoveHandler(diff) {
      return (e) => {
        let newIndex = index + diff;
        if (newIndex < 0) newIndex = childList.length - 1;
        else if (newIndex > childList.length - 1) newIndex = 0;
        if (typeof onIndexChange !== "function") return;
        nextInfinitePosRef.current = newIndex;
        onIndexChange(new Utils.Event({ index: newIndex }, e));
      };
    }

    const canMoveLeft = type !== "final" || index > 0;
    const canMoveRight = type !== "final" || index < childList.length - 1;

    const { hasTouch } = useDevice();

    // for detect only first swipe moving
    let isSwiping = false;
    const swipeRef = useSwipe({
      onSwipeStart(e) {
        isSwiping = true;
      },
      onSwipe(e) {
        if (e.data && isSwiping) {
          let { xDirection, xDifference, yDifference } = e.data;
          let diff;
          if (Math.abs(xDifference) > Math.abs(yDifference)) {
            if (xDirection === "left" && canMoveRight) diff = 1;
            else if (xDirection === "right" && canMoveLeft) diff = -1;
          }

          if (diff) getMoveHandler(diff)(e);
          isSwiping = false;
        }
      },
    });

    const [pauseInterval, setPauseInterval] = useState(false);
    const mouseAttrs =
      stopIntervalOnHover && intervalMs && intervalMs > 0
        ? { onMouseEnter: () => setPauseInterval(true), onMouseLeave: () => setPauseInterval(false) }
        : undefined;

    const { isHeadless } = useDevice();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const [attrs, componentProps] = Utils.VisualComponent.splitProps(otherProps, CLASS_NAMES.main({ hasTouch }));

    const stepperElement =
      stepper !== "none" ? (
        <StepperMini
          className={CLASS_NAMES.stepper(stepper)}
          steps={childList.length}
          onStepClick={onIndexChange}
          activeIndex={index}
          colorScheme={stepperColorScheme}
          type={stepper}
        />
      ) : null;

    const ViewComponent = virtualization && !isHeadless ? VirtualizedCarouselView : CarouselView;

    return (
      <div {...attrs} {...mouseAttrs} ref={hasTouch ? Utils.Component.combineRefs(attrs.ref, swipeRef) : attrs.ref}>
        <div className={CLASS_NAMES.innerWrapper()}>
          {getButton(buttons, buttonsColorScheme, "left", !canMoveLeft, getMoveHandler(-1))}

          <div className={CLASS_NAMES.viewWrapper(buttons)}>
            <ViewComponent
              {...componentProps}
              intervalMs={pauseInterval ? undefined : intervalMs}
              applyInfiniteTransition={isInfiniteTransition(props, nextInfinitePosRef.current)}
            />
          </div>

          {getButton(buttons, buttonsColorScheme, "right", !canMoveRight, getMoveHandler(1))}

          {stepper === "inner" ? <BackgroundProvider background="full">{stepperElement}</BackgroundProvider> : null}
        </div>

        {stepper === "outer" ? stepperElement : null}
      </div>
    );
    //@@viewOff:render
  },
});

export { Carousel };
export default Carousel;
