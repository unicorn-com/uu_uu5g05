//@@viewOn:imports
import {
  createVisualComponent,
  useLayoutEffect,
  useEffect,
  useRef,
  PropTypes,
  Utils,
  useState,
  useMemo,
  useAppBackground,
} from "uu5g05";
import Config from "../config/config.js";
import UuGds from "../_internal/gds.js";
import PopoverView, { ARROW_HALF_SIZE, getDropShadow } from "../_popover/popover-view.js";
import Tools from "../_internal/tools.js";

//@@viewOff:imports
const MIN_SPACE_HEIGHT = 80;
const OPPOSITE_DIRECT_MAP = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
  center: "center",
  middle: "middle",
};
const VIEWPORT_OFFSET = 4; // reserve at the viewport edges which we want to keep unoccupied

function getStyles({
  position,
  cssLeft,
  cssTop,
  viewportRect,
  elementRect,
  popoverRect,
  elementOffset,
  displayArrow,
  borderRadius,
  colorScheme,
  significance,
  background,
  keepInViewport,
}) {
  let [sideA, sideB] = position.split("-");

  // NOTE This is what popoverWrapper, filler and popover elements are:
  // __________                       __________
  // |fff.....|                       |fff.....|
  // |fffPPP..|    (top-right)        |fff.PPP.|   (top-center)
  // |   E    |                       |     E  |
  // |________|                       |________|
  //
  //   E            - element (around which popover is positioned)
  //   first 2 rows - contents of popoverWrapper
  //   fff          - filler (has flexBasis computed from rects and can shrink)
  //   PPP          - popover
  //   .            - empty space, it belongs to popover element which has margin "auto" in that direction (e.g. margin-right, margin-top)
  //
  // Then, if popover expands, ".." will be consumed first. If it expands further, "fff" will start to shrink.
  // And expansion is limited by wrapper's size which is either 100% of viewport / computed from distance of element to viewport edge.
  // Dtto. for left/right/bottom variants.

  let arrowStyle;
  let popoverStyle;
  let wrapperStyle = {
    display: "flex",
    flexDirection: sideA === "left" || sideA === "right" ? "column" : "row",
    position: "absolute",
  };

  if (elementRect) {
    let wrapperRect = {
      left: sideA === "right" ? elementRect.right + elementOffset : viewportRect.left,
      top: sideA === "bottom" ? elementRect.bottom + elementOffset : viewportRect.top,
      right: sideA === "left" ? elementRect.left - elementOffset : viewportRect.right,
      bottom: sideA === "top" ? elementRect.top - elementOffset : viewportRect.bottom,
    };
    if (keepInViewport) {
      if (sideA === "right") {
        wrapperRect.left = Math.max(viewportRect.left, Math.min(viewportRect.right, wrapperRect.left));
      } else if (sideA === "bottom") {
        wrapperRect.top = Math.max(viewportRect.top, Math.min(viewportRect.bottom, wrapperRect.top));
      } else if (sideA === "left") {
        wrapperRect.right = Math.max(viewportRect.left, Math.min(viewportRect.right, wrapperRect.right));
      } else if (sideA === "top") {
        wrapperRect.bottom = Math.max(viewportRect.top, Math.min(viewportRect.bottom, wrapperRect.bottom));
      }
      wrapperRect = limitRectSize(
        wrapperRect,
        popoverRect,
        "max",
        sideA === "left" || sideA === "right" ? sideA : "left",
        sideA === "top" || sideA === "bottom" ? sideA : "top",
      ); // expand wrapperRect to have at least popoverRect dimensions
      wrapperRect = limitRectSize(
        wrapperRect,
        viewportRect,
        "min",
        sideA === "left" || sideA === "right" ? sideA : "left",
        sideA === "top" || sideA === "bottom" ? sideA : "top",
      ); // limit wrapperRect to have at most viewportRect dimensions
    }
    Object.assign(wrapperStyle, {
      // NOTE Wrapper using [cssLeft, cssTop] has its left-top corner exactly at element's left-top corner.
      left: cssLeft - elementRect.left + wrapperRect.left,
      top: cssTop - elementRect.top + wrapperRect.top,
      width: wrapperRect.right - wrapperRect.left,
      height: wrapperRect.bottom - wrapperRect.top,

      pointerEvents: "none",
      ...getDropShadow(Tools.mergeProps({ colorScheme, significance, background }, PopoverView.defaultProps)),
    });

    let fillerStyle = {
      alignSelf: "stretch",
      flexBasis:
        sideB === "right"
          ? elementRect.left - wrapperRect.left
          : sideB === "left"
            ? wrapperRect.right - elementRect.right
            : sideB === "top"
              ? wrapperRect.bottom - elementRect.bottom
              : sideB === "bottom"
                ? elementRect.top - wrapperRect.top
                : sideB === "center"
                  ? Math.abs(wrapperRect.left + wrapperRect.right - (elementRect.left + elementRect.right))
                  : sideB === "middle"
                    ? Math.abs(wrapperRect.top + wrapperRect.bottom - (elementRect.top + elementRect.bottom))
                    : 0,
      order:
        sideB === "left" ||
        sideB === "top" ||
        (sideB === "center" && wrapperRect.left + wrapperRect.right > elementRect.left + elementRect.right) ||
        (sideB === "middle" && wrapperRect.top + wrapperRect.bottom > elementRect.top + elementRect.bottom)
          ? 1
          : -1,
    };

    wrapperStyle["&::before"] = {
      content: '""',
      ...fillerStyle,
    };

    if (keepInViewport) {
      let dx = cssLeft - elementRect.left;
      let dy = cssTop - elementRect.top;
      // if we would go beyond viewport then prefer fixed positioning because once it's applied and user keeps
      // scrolling, it won't be visibly updating (we'll be still recalculating it but user will see it stickied
      // to the top of screen because it'll calculate to the same fixed position, as opposed to absolute position which
      // would have to change with each scroll, i.e. there would be delay between scroll & repaint because scroll events
      // are throttled by browser)
      let popoverWidth = popoverRect.right - popoverRect.left;
      let popoverHeight = popoverRect.bottom - popoverRect.top;
      let width = Math.min(popoverWidth, wrapperStyle.width);
      let height = Math.min(popoverHeight, wrapperStyle.height);
      let leftInViewport =
        sideA === "right"
          ? elementRect.right + elementOffset
          : sideA === "left"
            ? elementRect.left - elementOffset - width
            : sideB === "right"
              ? elementRect.left
              : sideB === "left"
                ? elementRect.right - width
                : (elementRect.left + elementRect.right - width) / 2;
      let topInViewport =
        sideA === "bottom"
          ? elementRect.bottom + elementOffset
          : sideA === "top"
            ? elementRect.top - elementOffset - height
            : sideB === "bottom"
              ? elementRect.top
              : sideB === "top"
                ? elementRect.bottom - height
                : (elementRect.top + elementRect.bottom - height) / 2;
      let rightInViewport = leftInViewport + width;
      let bottomInViewport = topInViewport + height;
      let adjustedLeft = clamp(viewportRect.left + dx, wrapperStyle.left, viewportRect.right + dx - popoverRect.width);
      let adjustedTop = clamp(viewportRect.top + dy, wrapperStyle.top, viewportRect.bottom + dy - popoverRect.height);
      let preferFixedPosition =
        leftInViewport < viewportRect.left ||
        topInViewport < viewportRect.top ||
        rightInViewport > viewportRect.right ||
        bottomInViewport > viewportRect.bottom;
      if (preferFixedPosition) {
        // NOTE This assumes that wrapper's containing block is viewport.
        wrapperStyle.left = clamp(viewportRect.left, wrapperStyle.left - dx, viewportRect.right - popoverRect.width);
        wrapperStyle.top = clamp(viewportRect.top, wrapperStyle.top - dy, viewportRect.bottom - popoverRect.height);
        wrapperStyle.position = "fixed";
      } else {
        wrapperStyle.left = adjustedLeft;
        wrapperStyle.top = adjustedTop;
      }
    }

    popoverStyle = {
      [{ center: "marginInline", middle: "marginBlock" }[sideB] || "margin" + sideB[0].toUpperCase() + sideB.slice(1)]:
        "auto",
      ["margin" + sideA[0].toUpperCase() + sideA.slice(1)]: "auto",
      maxWidth: wrapperStyle.width, // NOTE Needs exact number, not "100%", because of ScrollableBox special handling due to gradients (`max-height: inherit`).
      maxHeight: wrapperStyle.height, // NOTE Needs exact number, not "100%", because of ScrollableBox special handling due to gradients (`max-height: inherit`).
    };

    if (displayArrow) {
      let fillerSize = fillerStyle.flexBasis;
      let borderRadiusNum = getNumericBorderRadius(borderRadius);
      let popoverMinMax = {
        // NOTE We can only use popover width/height, not left/right/top/bottom (because those are from *before* this positioning).
        left: [wrapperRect.right - fillerSize - popoverRect.width, wrapperRect.right - fillerSize],
        right: [wrapperRect.left + fillerSize, wrapperRect.left + fillerSize + popoverRect.width],
        top: [wrapperRect.bottom - fillerSize - popoverRect.height, wrapperRect.bottom - fillerSize],
        bottom: [wrapperRect.top + fillerSize, wrapperRect.top + fillerSize + popoverRect.height],
      }[sideB];
      let reserve = borderRadiusNum + ARROW_HALF_SIZE;
      let arrowTipPoint =
        sideB === "middle" || sideB === "top" || sideB === "bottom"
          ? elementRect.top + elementRect.height / 2
          : elementRect.left + elementRect.width / 2;
      let arrowTipPointSideValue = popoverMinMax
        ? clamp(popoverMinMax[0] + reserve, arrowTipPoint, popoverMinMax[1] - reserve)
        : arrowTipPoint;
      let arrowSideValue = arrowTipPointSideValue - ARROW_HALF_SIZE;
      let arrowCssSide = sideA === "top" || sideA === "bottom" ? "left" : "top";
      let arrowCssSideValue = arrowSideValue - wrapperRect[arrowCssSide];
      arrowStyle = {
        position: "absolute",
        [OPPOSITE_DIRECT_MAP[sideA]]: -2 * ARROW_HALF_SIZE + 1,
        [arrowCssSide]: arrowCssSideValue,
        animation: `${Config.Css.keyframes({ "0%": { opacity: 0 }, "100%": { opacity: 1 } })} 0.2s linear`,
      };
    }
  } else {
    Object.assign(wrapperStyle, {
      left: cssLeft,
      top: cssTop,
      maxWidth: `calc(100vw - 20px)`, // just an estimation to not overflow viewport (we'll reset these during measurements anyway)
      maxHeight: `calc(100vh - 20px)`, // just an estimation to not overflow viewport (we'll reset these during measurements anyway)
      overflow: "hidden",
    });
    popoverStyle = {
      maxWidth: wrapperStyle.maxWidth,
      maxHeight: wrapperStyle.maxHeight,
    };
  }

  return { wrapperStyle, popoverStyle, arrowStyle };
}

const Css = {
  main: ({ popoverStyle }) => {
    const styles = [
      {
        flexDirection: "column",
        flex: "none",
        pointerEvents: "all",
      },
    ];
    if (popoverStyle) styles.push(popoverStyle);
    return styles.map((it) => Config.Css.css(it)).join(" ");
  },
};

const { maxHeight, arrowStyle, position, ...propTypes } = PopoverView.propTypes;
const { maxHeight: _d, arrowStyle: _as, position: __d, ...defaultProps } = PopoverView.defaultProps;

const PopoverStandard = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PopoverStandard",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    element: PropTypes.object,
    elementOffset: PropTypes.number,
    pageX: PropTypes.number,
    pageY: PropTypes.number,
    preferredPosition: PropTypes.oneOf([
      "bottom-right",
      "bottom-left",
      "bottom-center",
      "top-right",
      "top-left",
      "top-center",
      "left-bottom",
      "left-top",
      "left-middle",
      "right-bottom",
      "right-top",
      "right-middle",
    ]),
    closeOnScroll: PropTypes.bool,
    displayArrow: PropTypes.bool,
    keepInViewport: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    element: undefined,
    elementOffset: undefined,
    pageX: undefined,
    pageY: undefined,
    preferredPosition: "bottom-right",
    closeOnScroll: false,
    displayArrow: false,
    keepInViewport: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    let {
      element,
      elementOffset,
      pageX,
      pageY,
      preferredPosition,
      closeOnScroll,
      displayArrow,
      elementRef,
      children,
      className,
      keepInViewport,
      ...propsToPass
    } = props;

    const { borderRadius, onClose, relative } = propsToPass;

    if (elementOffset == null) {
      elementOffset = UuGds.SpacingPalette.getValue(["fixed", "a"]);
    }
    if (displayArrow) {
      elementOffset = elementOffset + ARROW_HALF_SIZE;
    }
    // NOTE We have to round the coordinates / sizes because otherwise Chrome sometimes blurs the content e.g. on hover.
    elementOffset = Math.round(elementOffset);

    const popoverRef = useRef();
    useClose(onClose, closeOnScroll, element);

    let [positionInfo, setPositionInfo] = useState(() => ({
      // NOTE During 1st render we'll position Popover so that it is in viewport (and it does not overflow
      // so that document scrollbars do not show just because of Popover). This is done because Popover can
      // contain autoFocus-able element which, if we positioned Popover initially at [0,0] (could be offscreen),
      // would scroll the page to that initial position after 1st render (before re-adjusting the position).
      // For now we do this only for non-relative Popover-s, with which we can assume that they're in portal
      // and therefore their CSS `left/top: 0` corresponds to (unscrolled) document's [0,0].
      cssLeft: relative ? -1000 : scrollX,
      cssTop: relative ? -1000 : scrollY,
      position: preferredPosition,
      elementRect: undefined,
      viewportRect: undefined,
      popoverRect: undefined,
    }));
    const { position } = positionInfo;

    const [handleReposition, _handleReposition] = useMemo(() => {
      let _handleReposition = (forcedPosition) => {
        let positionInfo = {};
        if (popoverRef.current) {
          positionInfo = getPositionInfo(
            element?.getBoundingClientRect() || {
              width: 0,
              height: 0,
              left: pageX - scrollX,
              top: pageY - scrollY,
              right: pageX - scrollX,
              bottom: pageY - scrollY,
            },
            popoverRef.current,
            preferredPosition,
            elementOffset,
            forcedPosition,
          );
        }
        setPositionInfo((v) => (Utils.Object.deepEqual(v, positionInfo) ? v : positionInfo));
      };
      let handleReposition = () => _handleReposition(); // API method has no parameters
      return [handleReposition, _handleReposition];
    }, [element, elementOffset, pageX, pageY, popoverRef, preferredPosition]);

    useKeepInViewPort(popoverRef, keepInViewport, {
      onScroll: () => _handleReposition(positionInfo?.position),
    });

    useLayoutEffect(() => {
      handleReposition();
    }, [handleReposition]);

    // if element is too small, e.g. 10px wide (or it's [pageX, pageY] point only) and we try to position Popover e.g. below
    // so that left edges of element/point & Popover are aligned, then the arrow could point outside of such element/point
    // (because arrow tip is `borderRadius + arrowSize/2` from the left edge)
    // => in such case we want the whole Popover to be offset slightly to the side (left), so that arrow tip points to the middle
    //    of the small element/point
    let adjustedPositionInfo = positionInfo;
    if (adjustedPositionInfo.elementRect && displayArrow) {
      let { elementRect, position, cssLeft, cssTop } = adjustedPositionInfo;
      const minimalElementSizeWithoutPopoverOffsetting = getNumericBorderRadius(borderRadius) * 2 + 2 * ARROW_HALF_SIZE;
      if (/^(top|bottom)-/.test(position)) {
        let offset = Math.round((minimalElementSizeWithoutPopoverOffsetting - elementRect.width) / 2);
        if (offset > 0) {
          adjustedPositionInfo = {
            ...adjustedPositionInfo,
            elementRect: addOuterOffsetToRect(elementRect, { left: offset, right: offset }),
            cssLeft: cssLeft - offset,
          };
        }
      } else {
        let offset = Math.round((minimalElementSizeWithoutPopoverOffsetting - elementRect.height) / 2);
        if (offset > 0) {
          adjustedPositionInfo = {
            ...adjustedPositionInfo,
            elementRect: addOuterOffsetToRect(elementRect, { top: offset, bottom: offset }),
            cssTop: cssTop - offset,
          };
        }
      }
    }

    // children as a fn because of same api for children as PopoverBottomSheet has
    const content = useMemo(
      () => (typeof children === "function" ? children({ reposition: handleReposition }) : children),
      [children, handleReposition],
    );

    const [appBackground] = useAppBackground();
    const { wrapperStyle, popoverStyle, arrowStyle } = getStyles({
      ...props,
      ...adjustedPositionInfo,
      elementOffset,
      background: appBackground,
    });
    return (
      <div className={Config.Css.css(wrapperStyle)}>
        <PopoverView
          {...propsToPass}
          className={Utils.Css.joinClassName(className, Css.main({ popoverStyle }))}
          elementRef={Utils.Component.combineRefs(elementRef, popoverRef)}
          maxHeight="auto"
          arrowStyle={arrowStyle}
          position={position}
        >
          {content}
        </PopoverView>
      </div>
    );
  },
});

function useClose(onClose, closeOnScroll, aroundElement) {
  const callbacksRef = useRef();
  callbacksRef.current = { onClose };
  const doClose = useRef((event) => {
    const { onClose } = callbacksRef.current;
    if (typeof onClose === "function") onClose(event);
  }).current;

  useEffect(() => {
    if (!closeOnScroll) return;

    let scrollElements = [window];
    let element = aroundElement;
    while (element && element.tagName) {
      if (getComputedStyle(element).overflow !== "visible") scrollElements.push(element);
      element = element.parentNode;
    }
    for (let scrollElement of scrollElements) {
      scrollElement.addEventListener("scroll", doClose);
    }
    return () => {
      for (let scrollElement of scrollElements) {
        scrollElement.removeEventListener("scroll", doClose);
      }
    };
  }, [closeOnScroll, aroundElement, doClose]);
}

function useKeepInViewPort(elementRef, keepInViewport, opts) {
  const currentValuesRef = useRef();
  useEffect(() => {
    let onScroll = typeof opts?.onScroll === "function" ? opts?.onScroll : undefined;
    currentValuesRef.current = { onScroll };
  });

  useEffect(() => {
    if (!keepInViewport) return;

    let element = elementRef.current;
    if (!element) return;

    let handleScroll = (e) => {
      let { onScroll } = currentValuesRef.current;
      onScroll?.(e);
    };

    let scrollElements = [];
    while (element && element.tagName) {
      if (getComputedStyle(element).overflow !== "visible") scrollElements.push(element);
      element = element.parentNode;
    }
    scrollElements.push(window);
    for (let scrollElement of scrollElements) {
      scrollElement.addEventListener("scroll", handleScroll);
    }
    return () => {
      for (let scrollElement of scrollElements) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [elementRef, keepInViewport]);
}

// TODO Simplify this method. We need only final `position` string such as "top-left", nothing else.
function getPosition(preferredPosition, popoverComputedStyle, elementRect, elementOffset, popoverRect, area) {
  let testedPosition = preferredPosition;
  let [pos, direction] = testedPosition.split("-");
  let testedPosObj = { pos, direction };
  let a, b;
  let p = popoverRect.width;
  let q = popoverRect.height;

  let result;

  let up = /^top/.test(preferredPosition);

  const VERTICAL_MARGIN =
    parseFloat(popoverComputedStyle.marginTop) || parseFloat(popoverComputedStyle.marginBottom) || 0;

  const HORIZONTAL_MARGIN =
    parseFloat(popoverComputedStyle.marginLeft) || parseFloat(popoverComputedStyle.marginRight) || 0;

  const results = {
    "bottom-right": { top: elementRect.bottom + VERTICAL_MARGIN + elementOffset, left: elementRect.left, up: false },
    "top-right": {
      top: elementRect.top - popoverRect.height - VERTICAL_MARGIN - elementOffset,
      left: elementRect.left,
      up: true,
    },
    "bottom-left": {
      top: elementRect.bottom + VERTICAL_MARGIN + elementOffset,
      left: elementRect.right - popoverRect.width,
      up: false,
    },
    "top-left": {
      top: elementRect.top - popoverRect.height - VERTICAL_MARGIN - elementOffset,
      left: elementRect.right - popoverRect.width,
      up: true,
    },
    "top-center": {
      top: elementRect.top - popoverRect.height - VERTICAL_MARGIN - elementOffset,
      left: elementRect.left + (elementRect.width - popoverRect.width) / 2,
      up: true,
    },
    "bottom-center": {
      top: elementRect.bottom + VERTICAL_MARGIN + elementOffset,
      left: elementRect.left + (elementRect.width - popoverRect.width) / 2,
      up: false,
    },
    "right-bottom": { top: elementRect.top, left: elementRect.right + HORIZONTAL_MARGIN + elementOffset, up: false },
    "right-top": {
      top: elementRect.top - popoverRect.height + elementRect.height,
      left: elementRect.right + HORIZONTAL_MARGIN + elementOffset,
      up: true,
    },
    "left-bottom": {
      top: elementRect.top,
      left: elementRect.left - popoverRect.width - HORIZONTAL_MARGIN - elementOffset,
      up: false,
    },
    "left-top": {
      top: elementRect.top - popoverRect.height + elementRect.height,
      left: elementRect.left - popoverRect.width - HORIZONTAL_MARGIN - elementOffset,
      up: true,
    },
    "left-middle": {
      top: elementRect.top + (elementRect.height - popoverRect.height) / 2,
      left: elementRect.left - popoverRect.width - HORIZONTAL_MARGIN - elementOffset,
      up: true,
    },
    "right-middle": {
      top: elementRect.top + (elementRect.height - popoverRect.height) / 2,
      left: elementRect.right + HORIZONTAL_MARGIN + elementOffset,
      up: false,
    },
  };

  let prevPos, prevDirect, horizontal;
  let prevPositions = {};
  let spaceHeightVertical = {};
  for (let i = 0; i < 8 && !result && testedPosObj.pos; i++) {
    testedPosObj.maxHeight = null;
    horizontal = /^(right|left)/.test(testedPosObj.pos);

    a =
      testedPosObj.direction === "center"
        ? 2 * Math.min(elementRect.left, area.right - elementRect.right) + elementRect.width
        : testedPosObj.direction === "middle"
          ? 2 * Math.min(elementRect.top, area.bottom - elementRect.bottom) + elementRect.height
          : area[testedPosObj.direction] - elementRect[OPPOSITE_DIRECT_MAP[testedPosObj.direction]];
    b = area[testedPosObj.pos] - elementRect[testedPosObj.pos];

    if (horizontal) {
      [b, a] = [a, b];
    }
    if (testedPosObj.direction === "left" || testedPosObj.pos === "left") {
      a = -a;
    }
    if (testedPosObj.pos === "top" || testedPosObj.direction === "top") {
      b = -b;
    }

    prevPos = testedPosObj.pos;
    prevDirect = testedPosObj.direction;
    reposition(a, p, b, q, testedPosObj, horizontal, prevPositions, spaceHeightVertical);
    if (testedPosObj.pos === prevPos && testedPosObj.direction === prevDirect) {
      testedPosition = `${testedPosObj.pos}-${testedPosObj.direction}`;
      result = results[testedPosition];
      result.maxHeight = testedPosObj.maxHeight;
      if (result.maxHeight) {
        result.top =
          testedPosObj.pos === "top"
            ? 0
            : result.maxHeight === MIN_SPACE_HEIGHT
              ? area.bottom - result.maxHeight
              : elementRect.bottom;
      }
    }
    delete testedPosObj.maxHeight;
  }
  // popover cannot be on the required position, check viewport
  if (!result) {
    testedPosition = preferredPosition;
    let top = 0;
    let left = 0;
    let arrowOffset = 0;

    if (area.right - results[preferredPosition].left - popoverRect.width >= 0 && results[preferredPosition].left >= 0) {
      // popover could be on the required position because there is a space on the right side
      // and results[preferredPosition].left is not negative
      left = results[preferredPosition].left;
    } else {
      if (results[preferredPosition].left >= 0) {
        // popover cannot be on the required position because there is no space on the right side
        if (/^right/.test(preferredPosition) || /(right|center)$/.test(preferredPosition)) {
          left = area.right - popoverRect.width;
          testedPosition = testedPosition.replace("right", "left");
        }
      }
      // if popover is centered, arrow will reposition itself
      if (/center$/.test(preferredPosition)) {
        arrowOffset = left - results[preferredPosition].left;
      }
    }

    for (let i = 0; i < 2 && !top; i++) {
      if ((horizontal && /bottom$/.test(testedPosition)) || /^bottom/.test(testedPosition)) {
        b = area.bottom - (horizontal ? elementRect.top : elementRect.bottom);

        if (b >= q) {
          top = results[testedPosition].top;
        } else {
          testedPosition = testedPosition.replace("bottom", "top");
        }
      } else {
        if (/middle$/.test(testedPosition)) {
          b = 2 * Math.min(elementRect.top, area.bottom - elementRect.bottom) + elementRect.height;
        } else {
          b = (horizontal ? elementRect.bottom : elementRect.top) - area.top;
        }

        if (b >= q) {
          top = results[testedPosition].top;
          up = true;
        } else {
          testedPosition = testedPosition.replace("top", "bottom");
        }
      }
    }

    if (!top) {
      if (
        area.bottom - results[preferredPosition].top - popoverRect.height >= 0 &&
        results[preferredPosition].top >= 0
      ) {
        // popover could be on the required position because there is a space on the bottom
        // and results[preferredPosition].top is not negative
        top = results[preferredPosition].top;
      } else if (area.bottom - popoverRect.height >= 0 && results[preferredPosition].top >= 0) {
        // popover cannot be on the required position because there are no space on the bottom
        if (/^bottom/.test(preferredPosition) || /bottom$/.test(preferredPosition)) {
          top = area.bottom - popoverRect.height;
        }
        // if popover is centered, arrow will reposition itself
        if (/middle$/.test(preferredPosition)) {
          arrowOffset = top - results[preferredPosition].top;
        }
      }
    }

    result = { top, left, up, arrowOffset };
  }
  return [result, testedPosition];
}

function reposition(
  spaceWidth,
  elWidth,
  spaceHeight,
  elHeight,
  testedPosObj,
  horizontal,
  prevPositions,
  spaceHeightVertical,
) {
  const { pos, direction } = testedPosObj;
  if ((spaceWidth < elWidth && spaceHeight < elHeight) || (spaceWidth < 0 && spaceHeight < 0)) {
    // not width, not height
    if (direction === "center") {
      testedPosObj.pos = undefined;
      testedPosObj.direction = undefined;
      return;
    } else if (direction === "middle") {
      testedPosObj.pos = OPPOSITE_DIRECT_MAP[pos];
      testedPosObj.direction = "bottom";
      // if there was no space above before, there will never be space for the middle direction,
      // a change of direction will guarantee a new call of reposition function and direction will further adapt according to free space.
      return;
    }
    // Solve situation when spaceHeightVertical is already known from previous iteration
    // And also check if spaceHeight is bigger above/bellow the element
    if (
      spaceHeightVertical[pos] &&
      spaceHeightVertical[OPPOSITE_DIRECT_MAP[pos]] &&
      spaceHeight >= spaceHeightVertical[OPPOSITE_DIRECT_MAP[pos]]
    ) {
      testedPosObj.maxHeight = Math.max(spaceHeight, MIN_SPACE_HEIGHT);
      return;
    }
    testedPosObj.pos = OPPOSITE_DIRECT_MAP[pos];
    testedPosObj.direction = OPPOSITE_DIRECT_MAP[direction];
  } else if (spaceWidth < elWidth || spaceWidth < 0) {
    // not width
    if (direction === "center") {
      testedPosObj.pos = undefined;
      testedPosObj.direction = undefined;
      return;
    }
    if (horizontal) {
      testedPosObj.pos = OPPOSITE_DIRECT_MAP[pos];
      testedPosObj.direction = direction;
      if (prevPositions[testedPosObj.pos] && prevPositions[testedPosObj.pos][testedPosObj.direction]) {
        testedPosObj.pos = direction;
        testedPosObj.direction = OPPOSITE_DIRECT_MAP[pos];
      }
    } else {
      testedPosObj.pos = pos;
      testedPosObj.direction = OPPOSITE_DIRECT_MAP[direction];
    }
  } else if (spaceHeight < elHeight || spaceHeight < 0) {
    // not height
    if (direction === "middle") {
      testedPosObj.pos = undefined;
      testedPosObj.direction = undefined;
      return;
    }
    if (horizontal) {
      testedPosObj.pos = pos;
      testedPosObj.direction = OPPOSITE_DIRECT_MAP[direction];
    } else {
      if (
        spaceHeightVertical[pos] ||
        (spaceHeightVertical[OPPOSITE_DIRECT_MAP[pos]] && spaceHeight >= spaceHeightVertical[OPPOSITE_DIRECT_MAP[pos]])
      ) {
        testedPosObj.maxHeight = Math.max(spaceHeight, MIN_SPACE_HEIGHT);
        return;
      }
      testedPosObj.pos = OPPOSITE_DIRECT_MAP[pos];
      testedPosObj.direction = direction;
    }
  }

  if (testedPosObj.direction !== "middle") {
    prevPositions[pos] = {
      ...prevPositions[pos],
      [direction]: true,
    };
  }
  if (/^(top|bottom)/.test(testedPosObj.pos)) {
    spaceHeightVertical[pos] = spaceHeight;
  }
}

function getPositionInfo(elementRect, popover, preferredPosition, elementOffset, forcedPosition) {
  const popoverWrapper = popover.parentNode;
  const popoverWrapperOrigStyle = {
    position: popoverWrapper.style.position,
  };
  popoverWrapper.style.position = "static";

  const popoverOrigStyle = {
    position: popover.style.position,
    left: popover.style.left,
    right: popover.style.right,
    top: popover.style.top,
    bottom: popover.style.bottom,
    maxHeight: popover.style.maxHeight,
    maxWidth: popover.style.maxWidth,
    transform: popover.style.transform,
  };
  popover.style.position = "absolute";
  popover.style.left = 0;
  popover.style.top = 0;
  popover.style.right = "auto";
  popover.style.bottom = "auto";
  popover.style.maxHeight = "none";
  popover.style.maxWidth = "none";
  popover.style.transform = "none";
  let popoverRect = popover.getBoundingClientRect();
  popoverRect = roundRect(popoverRect);

  let viewportRect = {
    top: VIEWPORT_OFFSET,
    left: VIEWPORT_OFFSET,

    // because of window can contain scrollbar
    bottom: (document.scrollingElement?.clientHeight || window.innerHeight) - VIEWPORT_OFFSET,
    right: (document.scrollingElement?.clientWidth || window.innerWidth) - VIEWPORT_OFFSET,
  };
  viewportRect.width = viewportRect.right - viewportRect.left;
  viewportRect.height = viewportRect.bottom - viewportRect.top;
  viewportRect = roundRect(viewportRect);

  elementRect = roundRect(elementRect);

  let position = forcedPosition;
  if (!position) {
    const popoverComputedStyle = getComputedStyle(popover);
    [, position] = getPosition(
      preferredPosition,
      popoverComputedStyle,
      elementRect,
      elementOffset,
      popoverRect,
      viewportRect,
    );
  }

  for (let k in popoverOrigStyle) {
    popover.style[k] = popoverOrigStyle[k];
  }
  for (let k in popoverWrapperOrigStyle) {
    popoverWrapper.style[k] = popoverWrapperOrigStyle[k];
  }

  // convert result position from viewport position to CSS position of popover element
  // (popover with [cssLeft, cssTop] will have its left-top corner exactly at element's left-top corner)
  let cssLeft = elementRect.left - popoverRect.left;
  let cssTop = elementRect.top - popoverRect.top;
  return { cssLeft, cssTop, position, elementRect, popoverRect, viewportRect };
}

function roundRect(rect) {
  // NOTE We have to round the coordinates / sizes because otherwise Chrome sometimes blurs the content e.g. on hover.
  let result = {
    left: Math.floor(rect.left),
    top: Math.floor(rect.top),
    right: Math.ceil(rect.right),
    bottom: Math.ceil(rect.bottom),
  };
  result.width = result.right - result.left;
  result.height = result.bottom - result.top;
  return result;
}

function addOuterOffsetToRect(rect, offsetMap) {
  let result = {
    left: rect.left - (offsetMap.left || 0),
    right: rect.right + (offsetMap.right || 0),
    top: rect.top - (offsetMap.top || 0),
    bottom: rect.bottom + (offsetMap.bottom || 0),
  };
  result.width = result.right - result.left;
  result.height = result.bottom - result.top;
  return result;
}

function getNumericBorderRadius(borderRadius) {
  let borderRadiusNum = UuGds.getValue(["RadiusPalette", "box", borderRadius]);
  if (typeof borderRadiusNum !== "number") borderRadiusNum = 8;
  return borderRadiusNum;
}

function clamp(min, value, max) {
  return Math.max(min, Math.min(value, max));
}

function limitRectSize(rect1, rect2, type, xProp, yProp) {
  let width1 = rect1.right - rect1.left;
  let width2 = rect2.right - rect2.left;
  let dx =
    type === "min" && width1 > width2 ? width1 - width2 : type === "max" && width1 < width2 ? width1 - width2 : 0;
  let height1 = rect1.bottom - rect1.top;
  let height2 = rect2.bottom - rect2.top;
  let dy =
    type === "min" && height1 > height2
      ? height1 - height2
      : type === "max" && height1 < height2
        ? height1 - height2
        : 0;
  return {
    left: xProp === "left" ? rect1.left + dx : rect1.left,
    right: xProp === "left" ? rect1.right : rect1.right - dx,
    top: yProp === "top" ? rect1.top + dy : rect1.top,
    bottom: yProp === "top" ? rect1.bottom : rect1.bottom - dy,
  };
}

export { PopoverStandard };
export default PopoverStandard;
