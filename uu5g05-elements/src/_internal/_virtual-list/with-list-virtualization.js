//@@viewOn:imports
import { createVisualComponent, useMemo, Utils, useState, useEffect, useRef, PropTypes, useElementSize } from "uu5g05";
import Config from "../../config/config.js";
//@@viewOff:imports

function getRowHeights(rowCount, columnCount, getItemHeight) {
  let rowHeights = [];

  for (let rowI = 0; rowI < rowCount; rowI++) {
    let rowHeight = 0;
    for (let colI = 0; colI < columnCount; colI++) {
      rowHeight = Math.max(rowHeight, getItemHeight(rowI * columnCount + colI));
    }
    rowHeights.push(rowHeight);
  }

  return rowHeights;
}

function computeVisibleRows(scrollContainerRelativeOffsetTop, visibleHeight, rowCount, rowHeights, horizontalGap) {
  if (rowCount === 0) return { visibleStartRow: 0, visibleEndRow: 0 };

  let cumulativeHeight = 0;
  let visibleStartRow, visibleEndRow;

  for (let i = 0; i < rowCount; i++) {
    if (cumulativeHeight < -scrollContainerRelativeOffsetTop + visibleHeight) visibleEndRow = i + 1;
    if (i) cumulativeHeight += horizontalGap;
    cumulativeHeight += rowHeights[i];
    if (cumulativeHeight > -scrollContainerRelativeOffsetTop && visibleStartRow === undefined) visibleStartRow = i;
  }

  if (visibleEndRow == null) {
    // list is entirely offscreen (downwards in scrollarea viewport)
    visibleStartRow = 0;
    visibleEndRow = 5;
  } else if (visibleStartRow == null) {
    // list is entirely offscreen (upwards in scrollarea viewport)
    visibleEndRow = rowCount;
    visibleStartRow = visibleEndRow - 5;
  }

  return { visibleStartRow, visibleEndRow };
}

function computeVisibleMetricsFromDom(scrollElementOrWindow, rowContainer) {
  let scrollViewportRect =
    !scrollElementOrWindow || scrollElementOrWindow === window
      ? { top: 0, height: (document.scrollingElement ?? document.body).clientHeight }
      : scrollElementOrWindow.getBoundingClientRect();
  let rowContainerRect = rowContainer?.getBoundingClientRect();
  let scrollContainerRelativeOffsetTop = rowContainerRect ? rowContainerRect.top - scrollViewportRect.top : 0;
  let visibleHeight = scrollViewportRect.height;
  // TODO uu5tilesg02 had ~"rounding to multiple of 10" to not cause re-renders when miniature adjustments took place.
  // Do the same here (scrollContainerRelativeOffsetTop round down 10, (visibleHeight + 10) round down 10)
  return { scrollContainerRelativeOffsetTop, visibleHeight };
}

function getNearestScrollElement(el) {
  while (el && el.tagName) {
    let computedStyle = getComputedStyle(el);
    if (computedStyle.overflowY !== "visible" && computedStyle.overflowY !== "hidden") {
      if (el === document.body || el === document.scrollingElement) return;
      return el;
    }
    el = el.parentNode;
  }
}

let withListVirtualization = (Component) => {
  let result = createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "withListVirtualization",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
      data: PropTypes.array,
      height: PropTypes.number,
      maxHeight: PropTypes.number,
      onItemsRendered: PropTypes.func,
      columnCount: PropTypes.number,
      horizontalGap: PropTypes.number,
      rowHeightEstimated: PropTypes.number,
      overscanRowCountTop: PropTypes.number,
      overscanRowCountBottom: PropTypes.number,
      scrollElementRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
      onScroll: PropTypes.func,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
      data: [],
      height: undefined,
      maxHeight: undefined,
      onItemsRendered: undefined,
      columnCount: 1,
      horizontalGap: 0,
      rowHeightEstimated: 100,
      overscanRowCountTop: undefined,
      overscanRowCountBottom: undefined,
      scrollElementRef: undefined,
      onScroll: undefined,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      let {
        data,
        height,
        maxHeight,
        getItemHeight,
        columnCount,
        horizontalGap,
        rowHeightEstimated,
        overscanRowCountTop,
        overscanRowCountBottom,
        elementRef,
        rowContainerRef: propsRowContainerRef,
        scrollElementRef: propsScrollElementRef,
        onScroll: propsOnScroll,
      } = props;
      let rowCount = Math.ceil(data.length / columnCount);
      if (!Array.isArray(data)) data = [];

      const { ref: scrollContainerSizeRef, height: measuredHeight } = useElementSize();

      // overscan && row visibility / viewport tracking
      let scrollElementRef = useRef();
      let rowContainerRef = useRef();

      let rowHeights = useMemo(
        () => getRowHeights(rowCount, columnCount, getItemHeight),
        [rowCount, columnCount, getItemHeight],
      );

      let isOurScrollElement = typeof height === "number" || typeof maxHeight === "number";

      let [{ scrollContainerRelativeOffsetTop, visibleHeight }, setVisibleMetrics] = useState(() => ({
        scrollContainerRelativeOffsetTop: 0, // result of: (rowContainer's top edge) - (scrollElement's top edge)
        visibleHeight: Math.min(
          window.innerHeight,
          Math.min(
            typeof height === "number" ? height : Infinity,
            typeof maxHeight === "number" ? maxHeight : Infinity,
          ),
        ),
      }));

      let { visibleStartRow, visibleEndRow } = computeVisibleRows(
        scrollContainerRelativeOffsetTop,
        visibleHeight,
        rowCount,
        rowHeights,
        horizontalGap,
      );

      if (typeof overscanRowCountTop !== "number") {
        overscanRowCountTop = Math.ceil(visibleHeight / (rowHeightEstimated + horizontalGap));
      }

      if (typeof overscanRowCountBottom !== "number") {
        overscanRowCountBottom = Math.ceil(visibleHeight / (rowHeightEstimated + horizontalGap));
      }

      let overscanStartRow = Math.max(0, visibleStartRow - overscanRowCountTop);
      let overscanEndRow = Math.min(rowCount, visibleEndRow + overscanRowCountBottom);

      useEffect(() => {
        if (isOurScrollElement) {
          setVisibleMetrics((curMetrics) => {
            let newMetrics = computeVisibleMetricsFromDom(scrollElementRef.current, rowContainerRef.current);
            return Utils.Object.shallowEqual(curMetrics, newMetrics) ? curMetrics : newMetrics;
          });
        }
      }, [isOurScrollElement, measuredHeight]);

      const currentValuesRef = useRef();
      currentValuesRef.current = { propsOnScroll };

      useEffect(() => {
        const { propsOnScroll } = currentValuesRef.current;

        let scrollElement = isOurScrollElement
          ? scrollElementRef.current
          : (getNearestScrollElement(scrollElementRef.current.parentNode) ?? window);

        if (typeof propsScrollElementRef === "function") propsScrollElementRef(scrollElement);
        else if (propsScrollElementRef) propsScrollElementRef.current = scrollElement;

        let onScroll = (e) => {
          let currentTarget = e.currentTarget || e.target; // current target can be lost from event
          setVisibleMetrics((curMetrics) => {
            let newMetrics = computeVisibleMetricsFromDom(scrollElement, rowContainerRef.current);
            return Utils.Object.shallowEqual(curMetrics, newMetrics) ? curMetrics : newMetrics;
          });
          if (typeof propsOnScroll === "function") propsOnScroll(new Utils.Event(undefined, e));
        };
        scrollElement.addEventListener("scroll", onScroll);

        // interval needed only when scrollElement is not under our control (before List there might be another
        // openable component with variable height which can cause our List to slide in/out from viewport without us knowing about it
        // so we wouldn't recompute visibleStartRow, etc.)
        // FIXME Maybe use IntersectionObserver somehow?
        let interval;
        if (!isOurScrollElement) {
          interval = setInterval(() => {
            setVisibleMetrics((curMetrics) => {
              let newMetrics = computeVisibleMetricsFromDom(scrollElement, rowContainerRef.current);
              return Utils.Object.shallowEqual(curMetrics, newMetrics) ? curMetrics : newMetrics;
            });
          }, 500);
        }

        return () => {
          scrollElement.removeEventListener("scroll", onScroll);
          clearInterval(interval);
        };
      }, [isOurScrollElement, propsScrollElementRef]);

      let overscanMargin = useMemo(() => {
        let top = 0;
        let bottom = 0;

        for (let i = 0; i < overscanStartRow; i++) {
          if (i) top += horizontalGap;
          top += rowHeights[i];
        }

        for (let j = overscanEndRow; j < rowCount; j++) {
          if (j > overscanEndRow) bottom += horizontalGap;
          bottom += rowHeights[j];
        }

        // Prevent non-integer height of row container element to avoid jumping of sticky footer while scrolling
        let totalHeight = top + bottom;
        for (let k = overscanStartRow; k < overscanEndRow; k++) {
          totalHeight += rowHeights[k];
        }
        let complement = Math.ceil(totalHeight) - totalHeight;
        bottom += complement;

        return { top, bottom, left: 0, right: 0 };
      }, [horizontalGap, overscanStartRow, rowHeights, overscanEndRow, rowCount]);
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      const renderResult = useMemo(
        () => (
          <Component
            {...props}
            rowContainerRef={Utils.Component.combineRefs(rowContainerRef, propsRowContainerRef)}
            elementRef={Utils.Component.combineRefs(
              scrollElementRef,
              elementRef,
              isOurScrollElement ? scrollContainerSizeRef : undefined,
            )}
            overscanStartRow={overscanStartRow}
            overscanEndRow={overscanEndRow}
            overscanMargin={overscanMargin}
          />
        ),
        [
          elementRef,
          isOurScrollElement,
          overscanEndRow,
          overscanMargin,
          overscanStartRow,
          props,
          propsRowContainerRef,
          scrollContainerSizeRef,
        ],
      );

      return renderResult;
      //@@viewOff:render
    },
  });

  Utils.Component.mergeStatics(result, Component);

  return result;
};

export { withListVirtualization };
export default withListVirtualization;
