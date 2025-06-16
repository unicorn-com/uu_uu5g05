//@@viewOn:imports
import {
  createVisualComponent,
  Utils,
  PropTypes,
  useDevice,
  useState,
  useLayoutEffect,
  useRef,
  useElementSize,
  useBackground,
  DeviceProvider,
} from "uu5g05";
import UuGds from "./_internal/gds.js";
import ScrollableParentElementProvider from "./_internal/scrollable-parent-element-provider.js";
import Config from "./config/config.js";
import ScrollableBoxWithGradients, {
  getGdsScrollEffect,
  getIndicatorBoxShadow,
} from "./_internal/scrollable-box-with-gradients.js";

//@@viewOff:imports

//@@viewOn:constants
const SCROLLBAR_WIDTH = 14;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main({
    padding: { top, bottom, left, right } = {},
    height,
    minHeight,
    maxHeight,
    indicatorPadding,
    scrollable,
    active,
    scrollIndicator,
    scrollIndicatorOffset,
    horizontal,
    device,
    disableOverscroll,
    scrollbarVerticalReserve,
    scrollbarHorizontalReserve,
    scrollbarWidth,
    background,
    _showScrollIndicators = true,
  }) {
    const classes = [
      Config.Css.css({
        paddingTop: top,
        paddingBottom: bottom,
        paddingLeft: left,
        paddingRight: right,
        overscrollBehavior: disableOverscroll ? "none" : undefined,
      }),
    ];

    let dynamicStyles = {};
    if (scrollable) {
      let scrollbarStyles = getScrollbarStyles({ scrollbarWidth, device, background });

      let scrollIndicatorStyles;
      if (_showScrollIndicators) {
        const maskActive = {
          top: active.top && scrollIndicator.top === "disappear",
          bottom: active.bottom && scrollIndicator.bottom === "disappear",
          left: active.left && scrollIndicator.left === "disappear",
          right: active.right && scrollIndicator.right === "disappear",
        };
        // NOTE If scrollbar is on top of content then it'll be masked too (and if we unmask it, then
        // we would see text in ~10px stripe on right/bottom edges) => just mask it
        // const rightReserve = isScrollbarOnTop ? (active.top || active.bottom ? cssScrollbarWidth : 0) : scrollbarVerticalReserve; // prettier-ignore
        // const bottomReserve = isScrollbarOnTop ? (active.left || active.right ? cssScrollbarWidth : 0) : scrollbarHorizontalReserve; // prettier-ignore
        const rightReserve = scrollbarVerticalReserve;
        const bottomReserve = scrollbarHorizontalReserve;
        let maskStyles = getScrollIndicatorsMaskStyles(maskActive, rightReserve, bottomReserve, scrollIndicatorOffset);
        scrollIndicatorStyles = maskStyles;
      }

      dynamicStyles = {
        height,
        maxHeight: maxHeight === "auto" ? undefined : maxHeight,
        overflow: "auto",
        ...scrollbarStyles,
        ...scrollIndicatorStyles,
      };
    }
    if (minHeight != null) dynamicStyles.minHeight = minHeight;
    if (Object.keys(dynamicStyles).length) classes.push(Config.Css.css(dynamicStyles));

    return classes.join(" ");
  },
  verticalGradient({ padding = {}, side, active }) {
    // NOTE There's some weird behaviour in Chrome - if indicator element is smaller than bottom padding of scrollbox,
    // then sticky positioning with `bottom: whatever` doesn't stick the element to the bottom edge of the scrollbox
    // when scrolled to the end of scrollbox (there remains empty space equal to scrollBox.paddingBottom - indicator.height).
    //   => always make the indicator at least scrollBox.paddingBottom high and limit background size instead
    //      (alternatively we could use flexbox for scrollbox which seems to not have the issue, but we would have
    //      to wrap children in another div)
    let gdsScrollEffect = getGdsScrollEffect();
    let { blurRadius } = gdsScrollEffect;
    let boxShadow = getIndicatorBoxShadow(gdsScrollEffect);
    let height = Math.max(padding[side] || 0, 2 * blurRadius);
    let shadowOverflowToPadding = Math.round(1.5 * blurRadius);

    return Config.Css.css({
      pointerEvents: "none",
      position: "sticky",
      zIndex: 20,
      display: "block",

      height,
      [side]: -padding[side] || 0,
      marginTop: side === "top" ? -padding[side] || 0 : -height + (padding[side] || 0),
      marginBottom: side === "top" ? -height + (padding[side] || 0) : -padding[side] || 0,
      // Safari 16.5 has issue with negative marginRight so we'll instead include that number into marginLeft and
      // then use translateX() to move it back to proper position (Safari was showing horizontal scrollbar otherwise)
      marginLeft:
        -Math.min(shadowOverflowToPadding, padding.left || 0) - Math.min(shadowOverflowToPadding, padding.right || 0),
      marginRight: 0,
      visibility: active ? undefined : "hidden",
      flex: "none",
      overflow: "hidden",
      padding: `0 ${blurRadius}px`,
      transform: `translateX(${Math.min(shadowOverflowToPadding, padding.right || 0)}px)`,

      "&:after": {
        content: '""',
        display: "block",
        height,
        marginLeft: -(shadowOverflowToPadding - Math.min(shadowOverflowToPadding, padding.left || 0)),
        marginRight: -(shadowOverflowToPadding - Math.min(shadowOverflowToPadding, padding.right || 0)),
        boxShadow,
        borderRadius: blurRadius,
        transform: `translateY(${side === "top" ? -height : height}px)`,
      },
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function isScrollable(height, maxHeight, horizontal) {
  return height || maxHeight || horizontal;
}

function getScrollbarStyles({ scrollbarWidth = SCROLLBAR_WIDTH, device = DeviceProvider.device, background } = {}) {
  let scrollbarStyles;
  let cssScrollbarWidth = 0;
  if (!device.isMobileOrTablet && device.platform !== "ios" && (device.platform !== "mac" || scrollbarWidth === 0)) {
    const colors = UuGds.getValue(["ColorPalette", "building", background === "dark" ? "light" : "dark"]);

    cssScrollbarWidth = scrollbarWidth;
    let webkitStyles =
      device.browserName !== "firefox"
        ? {
            "&::-webkit-scrollbar": {
              width: cssScrollbarWidth,
              height: cssScrollbarWidth,
            },

            "&::-webkit-scrollbar-track": {
              background: colors.ultraSoftSolidLight || colors.ultraSoftSolidDark,
              borderRadius: 8,
            },

            "&::-webkit-scrollbar-thumb": {
              background: colors.softStrongerTransparent,
              borderRadius: 8,
              border: "2px solid #fff", // TODO only for white background!!!
            },
          }
        : undefined;
    scrollbarStyles = {
      // NOTE As of Chrome 114 `overflow: overlay` behaves as `auto`, i.e. overlay (on-top) scrollbars are no longer
      // supported - for now we'll use `auto` and visually make the scrollbar disappear (when not hovering). We cannot
      // use previous pattern where we had `overflow: hidden` for non-hover and `overlay` for hover, because now it
      // would cause jumping of content on hover (because `overlay` === `auto` and `auto` would show scrollbar, narrowing
      // element content's width).
      overflow: "auto",
      ...webkitStyles,

      // for FF: thumb track
      scrollbarColor: "transparent transparent",
      scrollbarWidth: cssScrollbarWidth === 0 ? "none" : cssScrollbarWidth <= SCROLLBAR_WIDTH ? "thin" : "auto",
      scrollBehavior: "smooth",

      // hide onBlur
      "&:hover": {
        // for FF
        scrollbarColor: [colors.softStrongerSolidLight || colors.softStrongerSolidDark, "transparent"].join(" "),
      },
    };
  }
  return scrollbarStyles;
}

function getScrollIndicatorsMaskStyles(active, rightReserve, bottomReserve, scrollIndicatorOffset = {}) {
  if (!active.left && !active.top && !active.right && !active.bottom) return;

  // we use 4 + 1 mask layers:
  // - the 4 layers are alpha-gradients on box edges, transparent -> opaque (transparent is inside, opaque is at the edge)
  // - the composition of those 4 layers is then inverted (xor-ed with fully opaque 5th layer) so that
  //   inside becomes opaque and pixels near edges become transparent
  // - doing it this way ensures that if top layer overlaps with right layer, they'll get nicely composited
  //   in the top-right corner (pixels near top right will be "double" transparent because they got cumulated from both top & right)

  let { blurRadius = 40 } = UuGds.EffectPalette.getValue(["fade"]);

  let boxReserves = { left: 0, top: 0, right: rightReserve, bottom: bottomReserve - 1 }; // bottomReserve minus 1 is to prevent blank space
  function getEdgeMask(side, size) {
    let isHorizontal = side === "top" || side === "bottom";
    let reserves = { ...boxReserves };
    if (isHorizontal) {
      reserves.left += scrollIndicatorOffset[side + "Left"] || 0;
      reserves.right += scrollIndicatorOffset[side + "Right"] || 0;
    } else {
      reserves.top += scrollIndicatorOffset[side + "Top"] || 0;
      reserves.bottom += scrollIndicatorOffset[side + "Bottom"] || 0;
    }
    return {
      maskImage: `linear-gradient(to ${side}, transparent, black)`,
      maskRepeat: "no-repeat",
      maskPosition: isHorizontal
        ? `left ${reserves.left}px ${side} ${reserves[side]}px`
        : `${side} ${reserves[side]}px top ${reserves.top}px`,
      maskSize: isHorizontal
        ? `calc(100% - ${reserves.left + reserves.right}px) ${size}px`
        : `${size}px calc(100% - ${reserves.top + reserves.bottom}px)`,
      maskComposite: "add",
      WebkitMaskComposite: "source-over",
    };
  }
  function getFullAreaMask() {
    return {
      maskImage: "linear-gradient(to top, black, black)",
      maskRepeat: "no-repeat",
      maskPosition: "0px 0px",
      maskSize: `100% 100%`,
      maskComposite: "exclude",
      WebkitMaskComposite: "xor",
    };
  }
  let maskTop = active.top && getEdgeMask("top", blurRadius);
  let maskBottom = active.bottom && getEdgeMask("bottom", blurRadius);
  let maskLeft = active.left && getEdgeMask("left", blurRadius);
  let maskRight = active.right && getEdgeMask("right", blurRadius);
  let maskFullArea = getFullAreaMask();
  // maskFullArea must be first
  let masks = [maskFullArea, maskTop, maskLeft, maskRight, maskBottom].filter(Boolean); // prettier-ignore
  let maskStyles = {};
  for (let maskStyle of masks) {
    for (let k in maskStyle) {
      if (!maskStyles[k]) maskStyles[k] = [];
      maskStyles[k].push(maskStyle[k]);
    }
  }
  for (let k in maskStyles) maskStyles[k] = maskStyles[k].join(", ");
  return maskStyles;
}

function normalizeScrollIndicator(value) {
  let defaultValue = "gradient";
  let result;
  if (typeof value !== "object" || !value) result = { top: value, bottom: value, left: value, right: value };
  else result = { top: value.top, bottom: value.bottom, left: value.left, right: value.right };
  for (let k in result) {
    if (typeof result[k] !== "string") result[k] = defaultValue;
  }
  return result;
}
//@@viewOff:helpers

const scrollIndicatorValuePropType = PropTypes.oneOf(["gradient", "disappear"]);

const ScrollableBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ScrollableBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    height: PropTypes.unit,
    minHeight: PropTypes.unit,
    maxHeight: PropTypes.unit,
    initialScrollX: PropTypes.number,
    initialScrollY: PropTypes.number,
    disableOverscroll: PropTypes.bool,
    scrollIndicator: PropTypes.oneOfType([
      scrollIndicatorValuePropType,
      PropTypes.shape({
        top: scrollIndicatorValuePropType,
        bottom: scrollIndicatorValuePropType,
        left: scrollIndicatorValuePropType,
        right: scrollIndicatorValuePropType,
      }),
    ]),
    scrollIndicatorOffset: PropTypes.shape({
      topLeft: PropTypes.number,
      topRight: PropTypes.number,
      bottomLeft: PropTypes.number,
      bottomRight: PropTypes.number,
      leftTop: PropTypes.number,
      leftBottom: PropTypes.number,
      rightTop: PropTypes.number,
      rightBottom: PropTypes.number,
    }),
    scrollbarWidth: PropTypes.number,
    scrollElementRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    horizontal: PropTypes.bool,
    _skipRenderLoopDetection: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    height: undefined,
    minHeight: undefined,
    maxHeight: undefined,
    initialScrollX: undefined,
    initialScrollY: undefined,
    disableOverscroll: false,
    scrollIndicator: undefined,
    scrollIndicatorOffset: undefined,
    scrollbarWidth: SCROLLBAR_WIDTH,
    scrollElementRef: undefined,
    horizontal: false,
    _skipRenderLoopDetection: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      children,
      initialScrollX,
      initialScrollY,
      scrollIndicator: propsScrollIndicator,
      height,
      maxHeight,
      horizontal,
      scrollElementRef,
    } = props;

    const scrollIndicator = normalizeScrollIndicator(propsScrollIndicator);
    const elementRef = useRef();
    const { ref: sizeRef } = useElementSize();
    const device = useDevice();
    const background = useBackground();

    const [active, setActive] = useState({ top: false, bottom: false, left: false, right: false });
    const syncIndicators = (scrollEl) => {
      const top = scrollEl.scrollTop > 0;
      const bottom = scrollEl.scrollTop + scrollEl.clientHeight < scrollEl.scrollHeight - 1; // - 1 due to issues with rounding
      const left = scrollEl.scrollLeft > 0;
      const right = scrollEl.scrollLeft + scrollEl.clientWidth < scrollEl.scrollWidth - 1; // - 1 due to issues with rounding
      if (top !== active.top || bottom !== active.bottom || left !== active.left || right !== active.right) {
        setActive({ top, bottom, left, right });
      }
    };

    const [realPadding, setRealPadding] = useState(); // scrollbox might have padding via className so we'll check and sync it if needed
    const syncPadding = (scrollEl) => {
      const { paddingLeft, paddingTop, paddingRight, paddingBottom } = getComputedStyle(scrollEl);
      const elementPadding = {
        top: parseFloat(paddingTop) || 0,
        bottom: parseFloat(paddingBottom) || 0,
        left: parseFloat(paddingLeft) || 0,
        right: parseFloat(paddingRight) || 0,
      };
      const paddingUsedByRender = realPadding || {};
      const same = Object.keys(elementPadding).every((it) => (paddingUsedByRender[it] || 0) === elementPadding[it]);
      if (!same) {
        setRealPadding(elementPadding);
      }
    };

    // NOTE A rendering loop may occur in scenario:
    // 1. Browser uses scrollbar which reserves a width (it's not overlaid on top of content).
    // 2. Content contains image with `width: 100%`, unbounded height (aspect ratio is used).
    // 3. A render occurs where content overflows container e.g. by 2px => browser shows scrollbar on the right side.
    // 4. Our layout effects cause re-render in which we e.g. switch displaying of bottom indicator.
    // 5. However, browser at some stage (accessing scrollHeight / clientHeight? in step 4) reflows the layout
    //    and finds out that showing scrollbar caused the image to shrink its width by ~17px (scrollbar width), which due to aspect ratio
    //    could shrink also image's HEIGHT by e.g. 4px, which means that content no longer overflows => browser hides scrollbar
    // 6. This info is present in our layout effect (after state update in step 4), we access scrollHeight / clientHeight
    //    (and change state), browser reflows layout => tries to show scrollbar, ...
    // Our styling is preferring overlaid scrollbars, but developer is able to change it using className so we'll guard
    // against the loop (in layout effects which have no dependencies).
    // NOTE We also cannot simply stop the render loop because the browser would then show the component, after few milliseconds
    // it would show scrollbars, after another few milliseconds hide scrollbars, ... keep blinking => we'll enforce `overflow: scroll`.
    const renderLoopBreakerRef = useRef(0);
    const [enforcedOverflowClassName, setEnforcedOverflowClassName] = useState();
    useLayoutEffect(() => {
      if (!props._skipRenderLoopDetection) {
        renderLoopBreakerRef.current++;
        let aborted;
        queueMicrotask(() => !aborted && (renderLoopBreakerRef.current = 0));
        return () => (aborted = true);
      }
    });
    const breakRenderLoop = (effectFn) => {
      if (props._skipRenderLoopDetection || renderLoopBreakerRef.current < 10) {
        return effectFn();
      } else if (!enforcedOverflowClassName) {
        setEnforcedOverflowClassName(Config.Css.css({ overflow: "scroll !important" }));
      }
    };
    useLayoutEffect(() => {
      return breakRenderLoop(() => {
        syncIndicators(elementRef.current);
        syncPadding(elementRef.current);
      });
    });

    // keep track of how many pixels browser actually reserved for scrolling mechanism
    const [scrollbarHorizontalReserve, setScrollbarHorizontalReserve] = useState(0);
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
    useLayoutEffect(() => {
      return breakRenderLoop(() => {
        let cs = getComputedStyle(elementRef.current);
        let size =
          elementRef.current.offsetHeight -
          elementRef.current.clientHeight -
          (parseFloat(cs.borderTopWidth) || 0) -
          (parseFloat(cs.borderBottomWidth) || 0);
        if (size !== scrollbarHorizontalReserve) setScrollbarHorizontalReserve(size);
      });
    });
    const [scrollbarVerticalReserve, setScrollbarVerticalReserve] = useState(0);
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
    useLayoutEffect(() => {
      return breakRenderLoop(() => {
        let cs = getComputedStyle(elementRef.current);
        let size =
          elementRef.current.offsetWidth -
          elementRef.current.clientWidth -
          (parseFloat(cs.borderLeftWidth) || 0) -
          (parseFloat(cs.borderRightWidth) || 0);
        if (size !== scrollbarVerticalReserve) setScrollbarVerticalReserve(size);
      });
    });

    useLayoutEffect(() => {
      if (initialScrollY != null && elementRef.current.scrollTop !== initialScrollY) {
        elementRef.current.scrollTop = initialScrollY;
      }
      if (initialScrollX != null && elementRef.current.scrollLeft !== initialScrollX) {
        elementRef.current.scrollLeft = initialScrollX;
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, []);

    const [element, setElement] = useState();
    useLayoutEffect(() => {
      setElement(elementRef.current);
    }, []);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    function _renderWithGradients(visualProps) {
      return _render(visualProps); // visualProps will not contain e.g. original props.className (because that was already used for root element)
    }
    function _render(visualProps) {
      const scrollable = isScrollable(height, maxHeight, horizontal);
      const cssProps = {
        ...props, // intentionally original props
        device,
        active,
        indicatorPadding: realPadding,
        scrollable,
        scrollIndicator,
        scrollbarHorizontalReserve,
        scrollbarVerticalReserve,
        background,
      };
      let { ref, ...attrs } = Utils.VisualComponent.getAttrs(
        visualProps,
        Utils.Css.joinClassName(Css.main(cssProps), enforcedOverflowClassName),
      );

      const onScroll = (e) => {
        if (e.target !== e.currentTarget) return; // don't handle if "scroll" event comes from nested scrollable element
        if (typeof attrs?.onScroll === "function") attrs.onScroll(e);
        syncIndicators(elementRef.current);
      };
      return (
        <div
          {...attrs}
          ref={Utils.Component.combineRefs(elementRef, ref, sizeRef, scrollElementRef)}
          onScroll={onScroll}
        >
          {
            // NOTE For gradient in horizontal direction we need different structure so it's solved in ScrollableBoxWithGradients component
            // (we keep the vertical-only case using sticky div-s for simpler HTML structure).
            !props.horizontal && props._showScrollIndicators !== false && scrollIndicator.top === "gradient" ? (
              <div className={Css.verticalGradient({ padding: realPadding, side: "top", active: active.top })} />
            ) : null
          }
          {scrollable ? (
            <ScrollableParentElementProvider element={element}>{children}</ScrollableParentElementProvider>
          ) : (
            children
          )}
          {!props.horizontal && props._showScrollIndicators !== false && scrollIndicator.bottom === "gradient" ? (
            <div className={Css.verticalGradient({ padding: realPadding, side: "bottom", active: active.bottom })} />
          ) : null}
        </div>
      );
    }
    return horizontal && props._showScrollIndicators !== false ? (
      <ScrollableBoxWithGradients
        {...props} // visual props (id, ...)
        active={{
          top: active.top && scrollIndicator.top === "gradient",
          bottom: active.bottom && scrollIndicator.bottom === "gradient",
          left: active.left && scrollIndicator.left === "gradient",
          right: active.right && scrollIndicator.right === "gradient",
        }}
        rightReserve={scrollbarVerticalReserve}
        bottomReserve={scrollbarHorizontalReserve}
        contentPadding={realPadding}
      >
        {_renderWithGradients}
      </ScrollableBoxWithGradients>
    ) : (
      _render(props)
    );
    //@@viewOff:render
  },
});

ScrollableBox.getScrollbarStyles = getScrollbarStyles;

export { ScrollableBox };
export default ScrollableBox;
