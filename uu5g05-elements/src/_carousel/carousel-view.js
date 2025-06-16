//@@viewOn:imports
import {
  createVisualComponent,
  Utils,
  PropTypes,
  useElementSize,
  useEffect,
  useRef,
  useState,
  useUpdateEffect,
  usePreviousValue,
  useDevice,
} from "uu5g05";
import Config from "../config/config.js";
import UuGds from "../_internal/gds.js";
//@@viewOff:imports

//@@viewOn:constants
const TRANSITION_DURATION = 500;
//@@viewOff:constants

//@@viewOn:css
const CLASS_NAMES = {
  main: ({ contentHeight, borderRadius = "moderate", animate, activeItemHeight, willAnimate }) =>
    Config.Css.css({
      display: "flex",
      height: (contentHeight === "auto" && (willAnimate || animate) ? activeItemHeight : undefined) || contentHeight,
      overflow: "clip",
      borderRadius: UuGds.RadiusPalette.getValue(["box", borderRadius]),
      transition: contentHeight === "auto" && (willAnimate || animate) ? `height ${TRANSITION_DURATION}ms` : undefined,
    }),
  container: ({ contentHeight, childList, width, animate, activeItemHeight, browserName }) => {
    return Config.Css.css({
      display: "grid",
      gridTemplateRows:
        width != null && contentHeight === "auto"
          ? browserName === "firefox" || browserName === "safari"
            ? // TODO Firefox seems to have a bug regarding fit-content(0) so we'll pass measured height of
              // active item (enlarging active item, e.g. by expanding a collapsed box inside, will therefore use
              // CSS transition instead of being applied immediately, which we don't really want but alas...).
              `fit-content(${activeItemHeight || 0}px)`
            : "fit-content(0)"
          : "100%",
      gridAutoFlow: "column",
      alignItems: contentHeight === "auto" ? "start" : "center",
      width: width * childList.length || undefined,
      transition: animate ? `transform ${TRANSITION_DURATION}ms` : undefined,
    });
  },
  itemContainer: ({ width, contentHeight, active }) => {
    return Config.Css.css({
      display: "inline-grid",
      alignItems: "center",
      height: contentHeight === "auto" && active ? "auto" : contentHeight === "auto" ? undefined : "100%",
      minHeight: contentHeight === "auto" && !active ? 0 : undefined,
      overflow: "clip",
      width,
      outline: "none",
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function isInfiniteTransition({ index, type }, nextInfinitePos) {
  if (nextInfinitePos === undefined) return false;
  return type === "infinite" && nextInfinitePos === index;
}

//@@viewOff:helpers

const CarouselView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "CarouselView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    index: PropTypes.number,
    onIndexChange: PropTypes.func,
    intervalMs: PropTypes.number,
    contentHeight: PropTypes.unit,
    type: PropTypes.oneOf(["final", "infinite", "rewind"]),
    applyInfiniteTransition: PropTypes.bool,
    borderRadius: PropTypes.borderRadius,
    animation: PropTypes.oneOf(["slide", "none"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    index: 0,
    onIndexChange: undefined,
    intervalMs: undefined,
    contentHeight: undefined,
    type: "final",
    applyInfiniteTransition: undefined,
    borderRadius: "moderate",
    animation: "slide",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      children,
      index: propsIndex,
      onIndexChange,
      intervalMs,
      type,
      applyInfiniteTransition,
      contentHeight,
      animation,
    } = props;

    let { ref: elementSizeRef, width } = useElementSize();
    // round up element width to prevent overflow of the next content into current content in case, when items is rendered with subpixel precision
    width = width && Math.ceil(width);

    let childList = Utils.Content.toArray(children);

    const [marginLeftSize, setMarginLeftSize] = useState(0);
    const [animate, setAnimate] = useState(false);
    const [index, setIndex] = useState(propsIndex);
    const { ref: activeItemSizeRef, height: activeItemHeight } = useElementSize();
    const containerRef = useRef();

    const { browserName } = useDevice();

    const activeItemOrder = Math.floor((childList.length - 1) / 2);
    childList = childList.map((child, i) => ({
      child,
      order: type === "infinite" ? (i - index + activeItemOrder + children.length) % children.length : i,
    }));

    const currentValuesRef = useRef();
    currentValuesRef.current = { type, onIndexChange, childCount: childList.length, index };

    // When type="infinite" and interval={n}, remember what the index should be
    // and if it fits with the next received index, apply the infinite animation. If not, it
    // means that the index was changed other way then by the interval timeout and thus
    // the animation shouldnt be infinite (except if prop applyInfiniteTransition is true).
    const nextInfinitePosRef = useRef();
    const usedApplyInfiniteTransition =
      applyInfiniteTransition ?? isInfiniteTransition(props, nextInfinitePosRef.current);

    const prevIndex = usePreviousValue(propsIndex, propsIndex);
    const willAnimate = propsIndex !== prevIndex;
    useUpdateEffect(() => {
      setIndex(propsIndex);
      setAnimate(true);

      let { index, childCount, type } = currentValuesRef.current;

      if (type === "infinite") {
        let diff = propsIndex - index;

        if (usedApplyInfiniteTransition) {
          if (diff > Math.floor(childCount / 2)) {
            // Will animate to the left
            diff -= childCount;
          } else if (diff < -Math.floor((childCount - 1) / 2)) {
            // Will animate to the right
            diff += childCount;
          }
        }

        setMarginLeftSize((cur) => cur + diff);
      }

      let animationTimeout = setTimeout(() => {
        setAnimate(false);

        if (type === "infinite") {
          setMarginLeftSize(0);
        }
      }, TRANSITION_DURATION);
      return () => clearTimeout(animationTimeout);
    }, [propsIndex]);

    useEffect(() => {
      if (intervalMs && intervalMs > 0 && (type !== "final" || propsIndex < childList.length - 1)) {
        let timeout = setTimeout(() => {
          let { onIndexChange, childCount } = currentValuesRef.current;
          let newIndex = propsIndex === childCount - 1 ? 0 : propsIndex + 1;
          nextInfinitePosRef.current = newIndex;
          onIndexChange(new Utils.Event({ index: newIndex }));
        }, intervalMs + TRANSITION_DURATION);

        return () => {
          clearTimeout(timeout);
        };
      }
    }, [childList.length, intervalMs, propsIndex, type]);

    useUpdateEffect(() => {
      nextInfinitePosRef.current = undefined;
    });

    useEffect(() => {
      // if, after animation, focus remained somewhere in carousel on a no-longer-active item then move it
      // to the active item
      let containerEl = containerRef.current;
      if (!animate && containerEl) {
        let activeItemEl = containerEl.childNodes[index];
        if (
          containerEl.contains(document.activeElement) &&
          !activeItemEl.contains(document.activeElement) &&
          activeItemEl !== document.activeElement
        ) {
          activeItemEl.focus({ preventScroll: true });
        }
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [animate]);

    const shouldAnimate = animate && animation !== "none";
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const { ref, ...attrs } = Utils.VisualComponent.getAttrs(
      props,
      CLASS_NAMES.main({ ...props, animate: shouldAnimate, activeItemHeight, willAnimate }),
    );

    const translateX =
      width == null ? 0 : type === "infinite" ? -(activeItemOrder + marginLeftSize) * width : -index * width;

    return (
      <div
        {...attrs}
        ref={Utils.Component.combineRefs(ref, elementSizeRef)}
        data-testid="carousel-view"
        aria-live="polite"
      >
        <div
          className={CLASS_NAMES.container({
            ...props,
            childList,
            width,
            animate: shouldAnimate,
            activeItemHeight,
            browserName,
          })}
          style={{ transform: `translateX(${translateX}px)`, marginLeft: marginLeftSize * width || undefined }}
          ref={containerRef}
        >
          {childList.map(({ child, order }, i) =>
            // if width is unknown (1st render) then render just the active item, so that the Carousel has some height
            // (e.g. when it's in ContextCenter in Popover it can affect which side the Popover will open to)
            width != null || i === index ? (
              <div
                data-testid={`item-${i}`}
                key={i}
                className={CLASS_NAMES.itemContainer({ ...props, width, active: i === index })}
                style={{ order }}
                aria-hidden={i !== index}
                ref={contentHeight === "auto" && i === index ? activeItemSizeRef : undefined}
                tabIndex={-1}
              >
                {child}
              </div>
            ) : null,
          )}
        </div>
      </div>
    );
    //@@viewOff:render
  },
});

export { CarouselView, TRANSITION_DURATION };
export default CarouselView;
