import { useCallback, useLayoutEffect, useRef, useState } from "./react-hooks.js";
import useElementSize from "./use-element-size.js";
import useEvent from "./use-event.js";
import useScrollDirection from "./use-scroll-direction.js";
import UtilsComponent from "../utils/component.js";
import usePrint from "./use-print.js";
import useCollapseAnimation from "./use-collapse-animation.js";

// common content components can have various z-index for styling purposes, so we'll put stickied elements above those
// (e.g. virtual list disabled overlay has 100), but below popovers, etc.
const ZINDEX_BASE = 900;

// visibility === "always" || "onScrollUp"
function useStickyTop(visibility = "always", gatherMetrics = false, forcedStuckHeight) {
  let { ref: stickyElFnRef, objectRef: stickyElRef, dependencyKey: stickyElDependencyKey } = useElement();
  let collapseAnimation = useCollapseAnimation();

  let { scrollContainer, itemList, itemIndex, itemData, setItemData } = useSharedScrollContainer(
    stickyElRef,
    stickyElDependencyKey,
  );

  const isPrinting = usePrint();

  let scrollDirection = useScrollDirection(scrollContainer);
  let { ref, height } = useElementSize({ height: 0 });
  let [stuckAndVisible, setStuckAndVisible] = useState(() => (visibility === "onScrollUp" ? false : true));
  let [isStartOfScrollContainer, setIsStartOfScrollContainer] = useState(true);
  let usedStuckAndVisible = !scrollDirection
    ? stuckAndVisible
    : visibility === "onScrollUp"
      ? scrollDirection === "up" && !isStartOfScrollContainer
      : true;
  if (stuckAndVisible !== usedStuckAndVisible) {
    stuckAndVisible = usedStuckAndVisible;
    setStuckAndVisible(stuckAndVisible);
  }

  useEvent(
    "scroll",
    (e) => {
      let scrollTop = scrollContainer.scrollTop || scrollContainer.scrollY || 0;
      setIsStartOfScrollContainer(scrollTop === 0);
    },
    scrollContainer,
  );

  if (!itemData || itemData.height !== height || itemData.stuckAndVisible !== stuckAndVisible) {
    itemData = { height, stuckAndVisible };
    setItemData(itemData);
  }

  let scrollContainerPaddingTop =
    scrollContainer && scrollContainer !== window ? parseFloat(getComputedStyle(scrollContainer).paddingTop) : 0;
  let stickyTop = -scrollContainerPaddingTop || 0;
  let maxPotentialStickyTop = stickyTop;
  let relevantSet = itemList[itemIndex]?.relevantSet;
  for (let i = 0; i < itemIndex; i++) {
    let { data, element } = itemList[i];
    if (relevantSet?.has(element)) {
      if (data.stuckAndVisible) stickyTop += data.stuckHeight || 0;
      maxPotentialStickyTop += data.stuckHeight || 0;
    }
  }
  let precedingItemsStuckHeight = stickyTop + (scrollContainerPaddingTop || 0);
  if (!stuckAndVisible) stickyTop -= height;

  // stuckHeight <=> the really visible height of a stuck element; this might be less than the element's "height"
  // if the stuck element reached the bottom edge of its parent element (which is not scroll container),
  // i.e. the stuck element never crosses bottom edge of its parent element and at that border it'll start to move
  // up and disappear
  let stuckHeight = useStuckHeight(stickyElRef.current, stickyTop, height, scrollContainer, forcedStuckHeight);
  if (stuckHeight !== itemData.stuckHeight) {
    setItemData((v) => ({ ...v, stuckHeight }));
  }

  const [scrollContainerTop, setScrollContainerTop] = useState();
  const [scrollContainerScrollTop, setScrollContainerScrollTop] = useState();
  const [stickyElDocumentDistanceFromScrollContainerEdge, setStickyElDocumentDistanceFromScrollContainerEdge] =
    useState();
  const stickyElDocumentDistanceFromScrollContainerEdgeRef = useRef(); // distance when no scrolling is in effect (scrollTop is 0)
  const updateMetrics = useCallback(() => {
    if (!gatherMetrics) return;

    if (!stickyElRef.current) return;
    if (!scrollContainer) return;
    let offsetParentAncestor = scrollContainer === window ? document.body : scrollContainer.offsetParent;
    if (!offsetParentAncestor) return;
    let newScrollTop = scrollContainer.scrollTop || scrollContainer.scrollY || 0;

    let getStickyElDocumentDistanceFromScrollContainerEdge = () => {
      let result = stickyElRef.current.offsetTop;
      let offsetParent = stickyElRef.current.offsetParent;
      while (offsetParent && offsetParent !== scrollContainer && offsetParent !== offsetParentAncestor) {
        result += offsetParent.offsetTop;
        offsetParent = offsetParent.offsetParent;
      }
      if (!offsetParent) return; // shouldn't happen
      if (offsetParent === offsetParentAncestor) {
        result -= scrollContainer.offsetTop || 0;
      }
      return result;
    };
    let newStickyElDocumentDistanceFromScrollContainerEdge = getStickyElDocumentDistanceFromScrollContainerEdge();

    // e.g. Plus4U5App.PositionBar element changes its document offset (hides previous sibling which serves as a padding)
    // when showing/hiding Toolbar in uuEcc => assume that this is not common and that these offset changes are never too big
    // so reserve small small amount of pixels for this (if we're further away than this then we'll skip re-computation
    // of offset, i.e. calling of getStickyElDocumentDistanceFromScrollContainerEdge() with `position: static`)
    const RESERVE = 100;

    let potentialOffsetToStickyBoundary = newStickyElDocumentDistanceFromScrollContainerEdge - newScrollTop;
    if (
      // we might be stuck or somewhere near being stuck (e.g. some preceding siblings using useStickyTop might be not currently
      // stuck, e.g. due to scrollDirection setting, but if they were, we would be stuck too)
      potentialOffsetToStickyBoundary <= maxPotentialStickyTop + scrollContainerPaddingTop + 1 &&
      // we got mounted directly into "stuck" state and don't know where the element would be without `position: sticky`
      (stickyElDocumentDistanceFromScrollContainerEdgeRef.current == null ||
        // we're not too far away (RESERVE) from last-measured offset
        stickyElDocumentDistanceFromScrollContainerEdgeRef.current - newScrollTop - RESERVE <=
          maxPotentialStickyTop + scrollContainerPaddingTop + 1)
    ) {
      // temporarily reset `position: sticky` and figure out the offset
      let origPosition = stickyElRef.current.style.position;
      stickyElRef.current.style.setProperty("position", "static", "important");
      stickyElDocumentDistanceFromScrollContainerEdgeRef.current = getStickyElDocumentDistanceFromScrollContainerEdge();
      stickyElRef.current.style.setProperty("position", origPosition);
      newStickyElDocumentDistanceFromScrollContainerEdge = stickyElDocumentDistanceFromScrollContainerEdgeRef.current;
    } else {
      // not stuck => remember "unstuck" distance from scroll container's top edge
      stickyElDocumentDistanceFromScrollContainerEdgeRef.current = newStickyElDocumentDistanceFromScrollContainerEdge;
    }

    let newScrollContainerTop = scrollContainer === window ? 0 : scrollContainer.getBoundingClientRect().top;
    if (newScrollContainerTop !== scrollContainerTop) {
      setScrollContainerTop(newScrollContainerTop);
    }
    if (newScrollTop !== scrollContainerScrollTop) {
      setScrollContainerScrollTop(newScrollTop);
    }
    if (newStickyElDocumentDistanceFromScrollContainerEdge !== stickyElDocumentDistanceFromScrollContainerEdge) {
      setStickyElDocumentDistanceFromScrollContainerEdge(newStickyElDocumentDistanceFromScrollContainerEdge);
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [gatherMetrics, maxPotentialStickyTop, scrollContainer, scrollContainerPaddingTop]);
  useEvent("scroll", (e) => updateMetrics(), scrollContainer);
  useLayoutEffect(() => updateMetrics(), [updateMetrics]);

  let metrics;
  if (gatherMetrics) {
    let offsetToStickyBoundary =
      stickyElDocumentDistanceFromScrollContainerEdge !== undefined
        ? stickyElDocumentDistanceFromScrollContainerEdge - scrollContainerScrollTop - precedingItemsStuckHeight
        : undefined;
    metrics = {
      height,
      stuckHeight,
      offsetToStickyBoundary,
      precedingItemsStuckHeight,
      // scrollContainerScrollTop, // uncomment if somebody needs this
      scrollContainerTop,
    };
  }

  let style = {
    top: stickyTop,
    zIndex: ZINDEX_BASE + itemList.length - itemIndex,
    position: isPrinting || collapseAnimation?.isAnimating ? "static" : "sticky",
    transition: `top 0.4s`,
  };
  const visibilityMatches = usedStuckAndVisible;
  return { ref: UtilsComponent.combineRefs(ref, stickyElFnRef), style, metrics, visibilityMatches };
}

let queueMap = new Map();
let queueCounter = 0;
let idCounter = 0;

function useSharedScrollContainer(stickyElementRef, stickyElementDependencyKey) {
  let [id] = useState(() => idCounter++ + ""); // this item id
  let [itemData, setItemData] = useState(null); // this item data
  let [queue, setQueue] = useState(); // all items registered to the same scroll container

  let [, forceRender] = useState(0);
  let propagateQueueChange = useEvent("Uu5.useSharedScrollContainer.stickyQueueChange", (e) => {
    if (e.queueId === queue?.id) forceRender((v) => v + 1); // all items in the queue need to be recomputed
  });

  let [scrollContainer, setScrollContainer] = useState(null);
  useLayoutEffect(() => {
    let element = stickyElementRef.current;
    if (element) {
      // find out scroll-box element that `position: sticky` is sticking to (nearest ancestor with overflow !== visible)
      let el = element.parentNode;
      while (el && el.tagName && getComputedStyle(el).overflow === "visible") el = el.parentNode;
      let scrollContainer = el && el.tagName ? el : window;
      setScrollContainer(scrollContainer);

      // init queue
      let queue = queueMap.get(scrollContainer);
      if (!queue) queueMap.set(scrollContainer, (queue = { id: queueCounter++ + "", list: [] }));
      setQueue(queue);

      // insert item at the right index (based on DOM-order of other elements inside
      // the scroll container)
      let i = queue.list.length - 1;
      for (; i >= 0; i--) {
        let result = element.compareDocumentPosition(queue.list[i].element);
        if (result & Node.DOCUMENT_POSITION_PRECEDING || result & Node.DOCUMENT_POSITION_CONTAINS) break;
      }
      queue.list.splice(i + 1, 0, { id, element, data: itemData });

      // update relevancy lists (e.g. having sticky Top bar and layout with 2 columns with sticky header in each column
      // must end up with left sticky header considering relevant only [Top], right sticky header also [Top] i.e. without Left,
      // and for Top it is [])
      // NOTE "Relevant" <=> the other sticky element must be my preceding sibling or my ancestor's preceding sibling.
      // This is not 100% fool-proof but it works for many basic cases. (Example of when it doesn't work: CSS grid with
      // 2 columns where 2 cells in 1st row are sticky - the 2nd cell will think that 1st cell is relevant because these 2 elements
      // are DOM siblings.)
      let stickyElSet = new Set(queue.list.map((it) => it.element));
      let stickyElParentsWithDisplayContentsSet = new Set();
      for (let el of stickyElSet) {
        let parent = el.parentElement;
        // if a sticky element is in parent with `display: contents` or in specially marked element that switches `display: contents`
        // (which is used in Plus4U5App.PositionBar) then such sticky element is relevant also for following siblings of such parent
        while (
          parent &&
          (parent.dataset.uu5StickyContainer != null || getComputedStyle(parent).display === "contents")
        ) {
          stickyElParentsWithDisplayContentsSet.add(parent);
          parent = parent.parentElement;
        }
      }
      let visitedMap = new Map();
      for (let j = i + 1; j < queue.list.length; j++) {
        let item = queue.list[j];
        let relevantList = [];
        traversePrecedingElements(item.element, (node) => {
          let visited = visitedMap.get(node);
          if (visited != null) {
            const { refList, fromIndex } = visited;
            relevantList.splice(relevantList.length, 0, ...refList.slice(fromIndex));
            return false; // stop traversing
          }
          if (stickyElSet.has(node)) {
            visitedMap.set(node, { refList: relevantList, fromIndex: relevantList.length });
            relevantList.push(node);
          } else if (stickyElParentsWithDisplayContentsSet.has(node)) {
            // NOTE Handle `display: contents` elements as unvisited because there would be difference of what
            // we want to include when we get to such parent via previousElementSibling vs. via parentElement.
            if (!node.contains(item.element)) return "dive";
          } else {
            visitedMap.set(node, { refList: relevantList, fromIndex: relevantList.length });
          }
          return node !== scrollContainer; // continue traversing (unless we reached scrollContainer)
        });
        item.relevantSet = new Set(relevantList);
      }

      propagateQueueChange({ queueId: queue.id });
      return () => {
        let itemIndex;
        for (let i = 0; i < queue.list.length; i++) {
          let item = queue.list[i];
          item.relevantSet.delete(element);
          if (item.element === element) itemIndex = i;
        }
        queue.list.splice(itemIndex, 1);
        if (queue.list.length === 0) queueMap.delete(scrollContainer);
        propagateQueueChange({ queueId: queue.id });
      };
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [stickyElementDependencyKey]);

  let list = queue?.list || [];
  let itemIndex = list.findIndex((it) => it.id === id);
  if (itemIndex > -1) {
    list[itemIndex].data = itemData;
  }
  // using layout effect so that related sticky-positioned components get updated
  // within same React commit, i.e. their CSS transitions start at the same time
  useLayoutEffect(() => {
    if (queue) propagateQueueChange({ queueId: queue.id });
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [queue, itemData]);

  return { scrollContainer, itemList: list, itemData, setItemData, itemIndex };
}

function useStuckHeight(
  stickyElement,
  stickyElementTop,
  stickyElementHeight,
  scrollContainerOrWindow,
  forcedStuckHeight,
) {
  const [, setForceRefresh] = useState(0);
  useEvent("scroll", (e) => setForceRefresh((v) => v + 1), scrollContainerOrWindow); // scrolling changes rect positions

  let parent = stickyElement?.parentElement;
  while (parent && getComputedStyle(parent).display === "contents") parent = parent.parentElement;
  let stickyParentRect = parent?.getBoundingClientRect();
  let containerRectTop = scrollContainerOrWindow === window ? 0 : scrollContainerOrWindow?.getBoundingClientRect().top;
  let maxHeight =
    stickyParentRect && containerRectTop != null
      ? stickyParentRect.bottom - stickyElementTop - containerRectTop
      : stickyElementHeight;
  return forcedStuckHeight ?? Math.max(0, Math.min(maxHeight, stickyElementHeight));
}

function traversePrecedingElements(fromElement, callback) {
  if (!fromElement) return;
  let toSkipSet = new Set();
  let nextElement = fromElement;
  let dive;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    do {
      toSkipSet.delete(nextElement);
      if (dive) {
        if (nextElement.lastElementChild) {
          toSkipSet.add(nextElement);
          nextElement = nextElement.lastElementChild;
        } else {
          nextElement = nextElement.previousElementSibling || nextElement.parentElement;
        }
      } else {
        nextElement = nextElement.previousElementSibling || nextElement.parentElement;
      }
      dive = false;
    } while (nextElement && toSkipSet.has(nextElement));
    if (!nextElement) return;
    let result = callback(nextElement);
    if (result === false) return;
    dive = result === "dive";
  }
}

// returns ref assignable to element
// 1. If ref is re-assigned to another element then this will catch it and re-render with updated ref.
// 2. There is only single render during mount (contrary to standard `ref={setElement}` pattern)
function useElement() {
  const ref = useRef();
  // const [element, setElement] = useState();
  const [dependencyKey, setDependencyKey] = useState(0);
  const objectRef = useRef();
  useLayoutEffect(() => {
    ref.current ??= null;
    objectRef.current = ref.current;
  }, []);
  const resultRef = useRef((element) => {
    if (ref.current === undefined) {
      ref.current = element ?? null;
      objectRef.current = ref.current;
    } else {
      ref.current = null;
      objectRef.current = element ?? null;
      setDependencyKey((v) => v + 1); // cause re-render
      // setElement(element ?? null);
    }
  }).current;
  // ref - ref to assign to the element
  // objectRef - ref to read current element from in effect/...
  // dependencyKey - dependency to use in effect/... (it changes when element changes)
  return { ref: resultRef, objectRef, dependencyKey };
}

export { useStickyTop };
export default useStickyTop;
