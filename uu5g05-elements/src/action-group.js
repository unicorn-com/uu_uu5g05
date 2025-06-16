//@@viewOn:imports
import {
  createVisualComponent,
  useElementSize,
  useState,
  useRef,
  useLayoutEffect,
  usePreviousValue,
  Utils,
  PropTypes,
  useMemo,
  useEvent,
  useLanguage,
  useEffect,
  useDevice,
  useMemoObject,
  _useRenderLeftToolbarContext,
  useContentSize,
} from "uu5g05";
import Config from "./config/config.js";
import Button from "./button.js";
import Dropdown from "./dropdown.js";
import ActionGroupItemList, {
  BUTTON_MARGIN,
  DIVIDER_MARGIN,
  MENU_SIGNIFICANCE,
  COLLAPSED,
  PHASE,
} from "./_internal/action-group-item-list.js";
import Tools from "./_internal/tools.js";
import ScrollableBox from "./scrollable-box.js";
import Icon from "./icon.js";
//@@viewOff:imports

// NOTE Component goes through several renders:
// 1. PHASE.MEASURE_FULL Measuring items using "full" variant (passes displayType==="button" onto items).
// 2. PHASE.MEASURE_ICON Measuring same items using "icon" variant (displayType==="button-compact").
// 3. PHASE.RENDER_COMPUTED Computing final visibility states using measurements and rendering as computed.

// NOTE In previous implementation, measurement steps 1 and 2 above were handled together in single render, i.e. component rendered 2 copies
// of each item at once (with different displayType). The problem was that items with "component" field could have internal state
// (e.g. uu5tilesg02 SearchButton) which then during measuring was present only on 1 of the 2 copies. And then the final rendering either used
// the copy with internal state but different displayType (and expected that it would have same width as the copy without internal state
// which wasn't true for SearchButton) or it used the other copy which lead to losing internal state. Therefore we switched
// the measuring to 2 separate renders so that items are always in at most 1 copy and thus their internal state (if any) is always preserved.

// NOTE The 2-step measuring also solves issue with focus where if user has focused an item and re-measuring occurs, the focus is preserved
// properly (there's no re-mount if the component remains visible). With 1-step measuring the originally-focused copy might have ended up unmounting
// if computation decided that the other copy should remain, effectively losing focus due to unmount.

const NAVIGATION_SCROLL_SIZE = 150;
const REMEASURE_DELAY_AFTER_UNEXPECTED_ITEM_SIZE_CHANGE = 200;
const DEFAULT_SIZE = "m";

const warnedComponentIgnoresElementAttrs = new WeakSet();

const Css = {
  root: ({ alignment }, minWidth, maxWidth) => {
    return Config.Css.css({
      display: "flex",
      flexGrow: 1,
      // we want left-aligned ActionGroups shortened later than right-aligned => start off left-aligned
      // ActionGroup as having maxWidth of their items (i.e. fully rendered with no shortenning),
      // whereas right-aligned ActionGroup from minWidth (i.e. fully shortenned)
      flexBasis: alignment === "left" ? (maxWidth ?? undefined) : (minWidth ?? undefined),
      minWidth: 0,
      maxWidth: alignment === "left" ? (maxWidth ?? undefined) : undefined,
      position: "relative",
    });
  },
  scrollableBoxWrapper: () =>
    Config.Css.css({
      flex: 1,
      // TODO Do somehow better - ScrollableBox will render 2 div-s because of usage of scrollIndicator="gradient" and
      // we need them both to flex (the outer is already CSS grid, but the inner with the actual scrollbar is not).
      "&>*": { display: "flex" },
    }),
  main: ({ alignment }, minWidth, maxWidth) =>
    Config.Css.css({
      minHeight: 1, // because withResize() doesn't render content if measured width/height is zero
      textAlign: alignment === "left" ? "left" : "right",
      whiteSpace: "nowrap",
      flexGrow: 1,
      // we want left-aligned ActionGroups shortened later than right-aligned => start off left-aligned
      // ActionGroup as having maxWidth of their items (i.e. fully rendered with no shortenning),
      // whereas right-aligned ActionGroup from minWidth (i.e. fully shortenned)
      flexBasis: alignment === "left" ? (maxWidth ?? undefined) : (minWidth ?? undefined),
      display: "flex",
      justifyContent: alignment === "left" ? "flex-start" : "flex-end", // so that during resize the content bleeds out leftwards (does not show/hide scrollbars)
      // `width` is used only in these 2 cases:
      // 1. Only as an initial value when in absolutely-positioned element (Popover), otherwise flex-basis wins.
      // 2. When using alignment==="left" when items overflow through our flexBasis (maxWidth) - in such case "main" has `max-width: ${maxWidth}`,
      //    "content" has width based on its content.
      //    This case could happen if items change their width dynamically which we don't know about (i.e. instead
      //    of having single specific width when rendering displayType="button" they have dynamic width e.g. due to some controls in an item
      //    which they shouldn't have, but uu5tilesg02 have that in <FilterBar applyEvent="onSubmit"> when dropdown value changes).
      //    => We'll detect this dynamic overflow by checking "content" width against "main" width in effect (using ResizeObserver).
      //       This is done only for alignment==="left" case because that's the only one that detects overflow as it allows horizontal scrolling.
      width: alignment === "left" ? (maxWidth ?? undefined) : undefined,
      minWidth: minWidth || 1,
      // do not constrain maxWidth for right-aligned ActionGroups for backward compatibility (if we constrained it,
      // developer would have to set `marginLeft: auto` on the right ActionGroup, or `justify-content: space-between`
      // on the parent container, because otherwise the parent container would have remaining space on the right side
      // of it, not in-between)
      maxWidth: alignment === "left" ? (maxWidth ?? undefined) : undefined,
      "@media print": { visibility: "hidden" },
    }),
  content: ({ alignment, isMeasuring, minWidth, maxWidth }) =>
    Config.Css.css({
      display: "flex",
      alignItems: "center",
      "&>*": { flex: "none" },
      overflow: isMeasuring ? "hidden" : undefined,
      position: isMeasuring ? "relative" : undefined, // so that absolutely-positioned elements don't bleed out from this "overflow: hidden" element
      maxWidth: isMeasuring ? minWidth || undefined : undefined,
      flexBasis: alignment === "left" ? "max-content" : (minWidth ?? "1px"),
      flexGrow: alignment === "left" ? 0 : 1,
      justifyContent: alignment === "left" ? "flex-start" : "flex-end", // so that during resize the content bleeds out leftwards (does not show/hide scrollbars)
    }),
  arrow: (side) =>
    Config.Css.css({
      display: "flex",
      position: "absolute",
      [side]: 0,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: "1.5em",
      transition: "opacity 200ms",
      userSelect: "none",
      cursor: "pointer",
      zIndex: 10,
    }),
};

// enumerates the order & how to shorten items
function* getShorteningItemOrder(items) {
  // shorten from "full" to "icon"-only rendering, non-primary first (starting from right-most)
  for (let i = items.length - 1; i >= 0; i--) {
    if ((items[i].icon || items[i].component) && !items[i].primary) yield { type: "icon", index: i };
  }
  for (let i = items.length - 1; i >= 0; i--) {
    if ((items[i].icon || items[i].component) && items[i].primary) yield { type: "icon", index: i };
  }

  // shorten by moving to dropdown menu, non-primary first (starting from right-most)
  for (let i = items.length - 1; i >= 0; i--) {
    if (!items[i].primary) yield { type: "menu", index: i };
  }
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].primary) yield { type: "menu", index: i };
  }
}

function collapsedToStringValue(collapsed) {
  if (collapsed === true) return COLLAPSED.ALWAYS;
  if (collapsed === false) return COLLAPSED.NEVER;
  return COLLAPSED.AUTO;
}

function getSize(itemList, size) {
  if (size) return size;

  let itemSize;

  for (let item of itemList) {
    if (!item.size || item.size !== itemList[0].size) break;
    if (!itemSize) itemSize = item.size;
  }

  return itemSize ?? DEFAULT_SIZE;
}

function getElementsWithDataWidth(childNodes, fallbackToChild = false) {
  return [...childNodes].map((el) =>
    el.dataset.width ? el : el.querySelector(`[data-width]`) || (fallbackToChild ? el : undefined),
  );
}

const ActionGroup = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ActionGroup",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        ...Button.propTypes,
        ...Dropdown.propTypes,
        component: PropTypes.oneOfType([PropTypes.elementType, PropTypes.element]),
        collapsed: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(Object.values(COLLAPSED))]),
        collapsedIcon: PropTypes.icon,
        collapsedChildren: PropTypes.node,
        order: PropTypes.number,
      }),
    ),
    collapsedMenuProps: PropTypes.object,
    size: Button.propTypes.size,
    alignment: PropTypes.oneOf(["left", "right"]),
    onMeasure: PropTypes.func,
    gap: PropTypes.number,
    openSubmenuAction: PropTypes.oneOf(["click", "hover"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: undefined,
    collapsedMenuProps: undefined,
    size: undefined, // default size value "m"
    alignment: "right",
    onMeasure: undefined,
    gap: 0,
    openSubmenuAction: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { itemList, onMeasure, alignment, gap, size, ..._propsToPass } = props;
    const { value: isDisplayedLeftToolbar } = _useRenderLeftToolbarContext() ?? {};
    const { isMobileOrTablet } = useDevice();
    const contentSize = useContentSize();
    let warnedComponentIgnoresElementAttrsThisInstanceRef;
    if (process.env.NODE_ENV !== "production") {
      warnedComponentIgnoresElementAttrsThisInstanceRef = useRef(false);
    }

    itemList = useMemo(() => {
      let result;
      if (!Array.isArray(itemList)) {
        result = [];
      } else {
        // normalize itemList to contain string-only "collapsed" values
        result = itemList.map((it) => {
          let { collapsed, component } = it || {};
          if (it && collapsed === undefined && isMobileOrTablet && isDisplayedLeftToolbar) {
            // content rendered in the toolbar using the render left function
            // will not be collapsed into a menu with three dots, but will be scrollable sideways
            collapsed = COLLAPSED.NEVER;
          }
          if (collapsed === undefined || collapsed === "auto") {
            let staticSettings = component?.actionGroup || component?.type?.actionGroup;
            if (staticSettings) {
              collapsed = Utils.ScreenSize.getSizeValue(staticSettings.collapsed, contentSize);
            }
          }
          if (collapsed !== undefined && typeof collapsed !== "string") {
            collapsed = collapsedToStringValue(collapsed);
          }
          if (collapsed && collapsed !== it?.collapsed) it = { ...it, collapsed };
          return it;
        });
      }
      return result;
    }, [contentSize, isDisplayedLeftToolbar, isMobileOrTablet, itemList]);

    const propsToPass = { ..._propsToPass, size: getSize(itemList, size) };

    let [renderPhase, setRenderPhase] = useState(PHASE.MEASURE_FULL);
    let domNodeRef = useRef();
    let { ref: elementRef, width } = useElementSize();
    let [itemWidths, setItemWidths] = useState(() => itemList.map((it) => ({ full: 1 })));
    let [menuWidth, setMenuWidth] = useState(0);

    let willRerenderImmediately = false;
    let [language] = useLanguage();
    let prevLanguage = usePreviousValue(language, language);
    let prevItemList = usePreviousValue(itemList, itemList);
    // check also "language" change because items typically use Lsi component
    if (itemList !== prevItemList || language !== prevLanguage) {
      // using deepEqual because it's faster than complete double re-rendering
      if (
        (renderPhase !== PHASE.MEASURE_FULL &&
          !Tools.deepEqualItemListExceptEventHandlerOrKnownProps(itemList, prevItemList)) ||
        itemWidths.length !== itemList.length
      ) {
        willRerenderImmediately = true;
        renderPhase = PHASE.MEASURE_FULL;
        setRenderPhase(PHASE.MEASURE_FULL);
        if (itemWidths.length !== itemList.length) {
          itemWidths = itemList.map((it) => ({ full: 1 }));
          setItemWidths(itemWidths);
        }
      }
    }
    const isMeasuring = renderPhase === PHASE.MEASURE_FULL || renderPhase === PHASE.MEASURE_ICON;

    const currentValuesRef = useRef();
    useLayoutEffect(() => {
      // eslint-disable-next-line no-use-before-define
      currentValuesRef.current = { onMeasure, measureWidths, maxWidth, itemList, itemStates };
    });

    // re-order based on items' order; however, keep also oldIndex->sortedIndex mapping because
    // we'll be shortening items in the order of how they were given in original itemList
    let origItemList, origOrderMapping;
    ({ itemList, origItemList, origOrderMapping } = useMemo(() => {
      let origItemList = itemList;
      let origOrderMapping = [];
      let orderedZippedList = [...itemList]
        .map((item, i) => ({ item, i }))
        .sort((a, b) => (a.item.order || 0) - (b.item.order || 0));
      for (let i = 0; i < orderedZippedList.length; i++) {
        origOrderMapping[orderedZippedList[i].i] = i;
      }
      return { origItemList, origOrderMapping, itemList: orderedZippedList.map((it) => it.item) };
    }, [itemList]));

    let lastKnownWidthRef = useRef(0);
    if (width === 0 && renderPhase === PHASE.RENDER_COMPUTED) {
      // this can happen only if we are suddenly inside of `display: none` element
      // => render with previously known width
      width = lastKnownWidthRef.current;
    }
    useEffect(() => {
      lastKnownWidthRef.current = width;
    });

    let [itemStatesWhenFull, totalWidth] = useMemo(() => {
      let itemStates = itemWidths.map((it, i) => ({
        ...it,
        type: itemList[i].collapsed === COLLAPSED.ALWAYS ? "menu" : "full",
      }));
      let totalWidth = computeWidthAndUpdateItemStates(itemStates, itemList, menuWidth, gap);
      return [itemStates, totalWidth];
    }, [gap, itemList, itemWidths, menuWidth]);

    let itemStates = useMemo(() => {
      let resultItemStates;
      // NOTE width from ResizeObserver might be slightly different than the actual, e.g. if width was 807.5625 and
      // due to zoom it gets recomputed to 807.5710, ResizeObserver won't trigger but we'll get measurements of zoomed
      // Button-s which add up to 807.5710 and therefore we'd do shortening because of fitting it into 807.5625.
      //   => use Math.ceil(width)
      let availableWidth = isMeasuring ? totalWidth : Math.ceil(width);
      if (totalWidth > availableWidth) {
        resultItemStates = itemStatesWhenFull.map((it) => ({ ...it }));
        for (let itemToShorten of getShorteningItemOrder(origItemList)) {
          let { index: origIndex, type: newType } = itemToShorten;
          let index = origOrderMapping[origIndex];
          if (
            (itemList[index].collapsed === COLLAPSED.ALWAYS && newType !== "menu") ||
            (itemList[index].collapsed === COLLAPSED.NEVER && newType === "menu")
          ) {
            continue;
          }
          let itemState = resultItemStates[index];
          itemState.type = newType;
          let totalWidth = computeWidthAndUpdateItemStates(resultItemStates, itemList, menuWidth, gap);
          if (totalWidth <= availableWidth) break;
        }
      }
      return resultItemStates || itemStatesWhenFull;
    }, [gap, isMeasuring, itemList, itemStatesWhenFull, menuWidth, origItemList, origOrderMapping, totalWidth, width]);
    let { menuState } = itemStates;
    itemStates = useMemoObject(itemStates);

    const prevWidthsRef = useRef({});

    let { minWidth, maxWidth } = useMemo(() => {
      if (isMeasuring) return prevWidthsRef.current;
      // NOTE This must be copy of itemStates (because `computeWidthAndUpdateItemStates` will modify it)
      let minWidthItemStates = itemStates.map((it, i) => ({
        ...it,
        type: itemList[i]?.collapsed === COLLAPSED.NEVER ? (it.icon ? "icon" : "full") : "menu",
      }));
      let minWidth = computeWidthAndUpdateItemStates(minWidthItemStates, itemList, menuWidth, gap);
      // NOTE This must be copy of itemStates (because `computeWidthAndUpdateItemStates` will modify it)
      let maxWidthItemStates = itemStates.map((it, i) => ({
        ...it,
        type: itemList[i]?.collapsed !== COLLAPSED.ALWAYS ? "full" : "menu",
      }));
      let maxWidth = computeWidthAndUpdateItemStates(maxWidthItemStates, itemList, menuWidth, gap);
      maxWidth = Math.ceil(maxWidth); // Math.ceil - see note above regarding 807.5625 vs. 807.5710.
      minWidth = Math.ceil(minWidth); // if the alignment prop set to "left", the minWidth must be integer so that right pixel after scrolling is not cut off
      return { minWidth, maxWidth };
    }, [gap, isMeasuring, itemList, itemStates, menuWidth]);

    useLayoutEffect(() => {
      if (!isMeasuring) {
        prevWidthsRef.current = { minWidth, maxWidth };
      }
    });

    function measureWidths() {
      let domNode = domNodeRef.current;
      if (!domNode) return PHASE.RENDER_COMPUTED;

      let itemCount = itemList.length;
      let allWidths = getElementsWithDataWidth(domNode.childNodes, true).map((el) => el.offsetWidth);
      let expectedChildCount = itemCount + 1;
      if (allWidths.length !== expectedChildCount) {
        ActionGroup.logger.error(
          `Unable to shorten ActionGroup - unexpected number of DOM node children. Expected ${expectedChildCount} got ${
            allWidths.length
          }`,
        );
        setItemWidths(itemList.map((it) => ({ full: 1 })));
        return PHASE.RENDER_COMPUTED;
      }

      let menuWidth = allWidths.pop();
      if (process.env.NODE_ENV !== "test" && menuWidth === 0 && domNode.getBoundingClientRect().width === 0) {
        // we're currently in a hidden element (e.g. inside of a toolbar within ToolbarProvider which shows only
        // last toolbar) => skip measuring
        return;
      }

      let newItemWidths =
        renderPhase === PHASE.MEASURE_FULL
          ? allWidths.slice(0, itemCount).map((width, i) => ({
              full: width,
              icon: width,
            }))
          : itemWidths.map((it, i) => ({ ...it, icon: allWidths[i] })); // PHASE.MEASURE_ICON (measuring icons only)

      setMenuWidth(menuWidth);
      setItemWidths(newItemWidths);
      return renderPhase === PHASE.MEASURE_FULL ? PHASE.MEASURE_ICON : PHASE.RENDER_COMPUTED;
    }

    function checkRenderedWidths() {
      let domNode = domNodeRef.current;
      // NOTE If fonts got loaded at the moment when we're in `display: none` element, we could
      // wait until we become visible and re-measure. Currently we don't do that because we would
      // switch to PHASE.MEASURE_FULL, wait for ResizeObserver to trigger (because we would have 0 size),
      // and if parent element got displayed, there would be a small delay in which we would be displaying
      // all variants (until observer kicks in). Therefore we don't switch to PHASE.MEASURE_FULL in such case
      // (if the fonts were intended for our ActionGroup, we could have wrong measurements, but that should
      // be really rare).
      // Alternative solution: postpone switching to PHASE.MEASURE_FULL until we detect that we're not in `display: none` element.
      if (domNode && domNode.getBoundingClientRect().width !== 0) {
        let els = getElementsWithDataWidth(domNode.childNodes);
        if (process.env.NODE_ENV !== "production") {
          let badComponentElIndex = els.findIndex((el) => !el);
          if (badComponentElIndex !== -1) {
            let { itemList, itemStates = [] } = currentValuesRef.current;
            let badComponentItemIndex = badComponentElIndex;
            let j = 0;
            for (let i = 0; i < itemStates.length; i++) {
              if (itemStates[i].type !== "menu" && !itemStates[i].skippedInMainArea) {
                j++;
                if (j === badComponentElIndex + 1) {
                  badComponentItemIndex = i;
                  break;
                }
              }
            }
            let problematicItem = itemList?.[badComponentItemIndex];
            let component = problematicItem?.component;
            let isWeakSetAddable = typeof component === "function" || (typeof component === "object" && component);
            if (
              !warnedComponentIgnoresElementAttrsThisInstanceRef.current &&
              (!isWeakSetAddable || !warnedComponentIgnoresElementAttrs.has(component))
            ) {
              warnedComponentIgnoresElementAttrsThisInstanceRef.current = true;
              if (isWeakSetAddable) warnedComponentIgnoresElementAttrs.add(component);
              ActionGroup.logger.error(
                `At least 1 component in ActionGroup's itemList is ignoring its props.elementAttrs or renders asynchronously. Shortening might not fully work due to that.`,
                {
                  likelyProblematicComponent: component?.uu5Tag || component?.type?.uu5Tag,
                  likelyProblematicItem: problematicItem,
                },
              );
            }
          }
        }

        let widthsMatch = els.every((el) => !el || el.offsetWidth == el.dataset.width);
        if (!widthsMatch) {
          setRenderPhase(PHASE.MEASURE_FULL);
        }
      }
    }

    const observerRef = useRef();
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
    useLayoutEffect(() => {
      if (!isMeasuring) return;
      let isDisplayed =
        width > 0 || domNodeRef.current?.offsetWidth > 0 || (process.env.NODE_ENV === "test" && width === 0);
      if (!isDisplayed) return;
      let doMeasure = () => {
        let nextPhase = currentValuesRef.current.measureWidths();
        if (nextPhase) {
          setRenderPhase(nextPhase);
        } else {
          // we were in a hidden element => wait until we become visible
          let observer = new ResizeObserver((entries) => {
            let entry = entries[entries.length - 1];
            if (entry.borderBoxSize[0].blockSize === 0 && entry.borderBoxSize[0].inlineSize === 0) {
              return; // not yet visible
            }
            observer.disconnect();
            observerRef.current = undefined;
            doMeasure();
          });
          observer.observe(domNodeRef.current);
          observerRef.current = observer;
        }
      };
      if (!observerRef.current) doMeasure();
    });
    useLayoutEffect(() => {
      return () => observerRef.current?.disconnect();
    }, []);
    if (document.fonts) {
      // if fonts get loaded then check widths of rendered buttons whether they changed (i.e. icons got rendered properly)
      useEvent("loadingdone", checkRenderedWidths, document.fonts);
    }

    useLayoutEffect(() => {
      const { onMeasure } = currentValuesRef.current;
      if (typeof onMeasure === "function" && minWidth !== undefined && maxWidth !== undefined) {
        onMeasure(new Utils.Event({ minWidth, maxWidth }));
      }
    }, [minWidth, maxWidth]);

    // re-measure sizes if any item changed its size dynamically and it caused overflow
    // (see comment in Css.main() regarding `width`)
    const [contentElement, setContentElement] = useState();
    useEffect(() => {
      if (contentElement && typeof ResizeObserver !== "undefined") {
        let remeasureId;
        let observer = new ResizeObserver((entries) => {
          let entry = entries[entries.length - 1];
          let contentElementWidth = entry.borderBoxSize[0].inlineSize;
          let { maxWidth, hasDynamicOverflow = 0 } = currentValuesRef.current;
          let diff = Math.round(contentElementWidth - maxWidth);
          let newHasDynamicOverflow = diff <= -2 ? -1 : diff >= 2 ? 1 : 0;
          if (newHasDynamicOverflow && hasDynamicOverflow !== newHasDynamicOverflow) {
            if (!remeasureId) {
              remeasureId = setTimeout(() => {
                remeasureId = undefined;
                currentValuesRef.current.hasDynamicOverflow = newHasDynamicOverflow;
                checkRenderedWidths();
              }, REMEASURE_DELAY_AFTER_UNEXPECTED_ITEM_SIZE_CHANGE);
            }
          } else {
            clearTimeout(remeasureId);
            remeasureId = undefined;
            currentValuesRef.current.hasDynamicOverflow = newHasDynamicOverflow;
          }
        });
        observer.observe(contentElement);
        return () => {
          delete currentValuesRef.current.hasDynamicOverflow;
          observer.disconnect();
          clearTimeout(remeasureId);
          remeasureId = undefined;
        };
      }
    }, [contentElement]);

    const { ref: scrollableBoxSizeRef, width: scrollableBoxWidth } = useElementSize();
    let isOverflowing = minWidth > scrollableBoxWidth;
    const [displayArrow, setDisplayArrow] = useState(() => ({ left: false, right: isOverflowing }));
    const scrollableBoxRef = useRef();

    let shouldBeScrollable = alignment === "left";
    useLayoutEffect(() => {
      function setDisplayArrows() {
        const left = scrollableBoxRef.current.scrollLeft > 0;
        const right = scrollableBoxRef.current.scrollLeft + scrollableBoxWidth < minWidth - 1; // - 1 due to issues with rounding
        setDisplayArrow((displayArrow) => {
          if (left !== displayArrow.left || right !== displayArrow.right) {
            return { left, right };
          } else {
            return displayArrow;
          }
        });
      }

      if (shouldBeScrollable && minWidth && scrollableBoxWidth) {
        setDisplayArrows();
        const scrollableBox = scrollableBoxRef.current;
        const handleScroll = (e) => {
          if (!scrollableBox || e?.target !== e?.currentTarget) return; // don't handle if "scroll" event comes from nested scrollable element
          setDisplayArrows();
        };
        scrollableBox.addEventListener("scroll", handleScroll);
        return () => scrollableBox.removeEventListener("scroll", handleScroll);
      }
    }, [minWidth, scrollableBoxWidth, shouldBeScrollable]);

    function onMouseDown(alignment) {
      let scrollSize = alignment === "left" ? -NAVIGATION_SCROLL_SIZE : NAVIGATION_SCROLL_SIZE;
      let newScrollWidth = scrollableBoxRef.current.scrollLeft + scrollSize;
      scrollableBoxRef.current.scrollLeft = Math.max(0, Math.min(newScrollWidth, scrollableBoxRef.current.scrollWidth));
    }

    // items with "component" field might have internal state and their elements might change without our re-rendering,
    // e.g. if uu5tilesg02 SearchButton is clicked, it gets switched into an input element, re-assigning its elementRef
    // (and having different width which we might not get informed about)
    //   => observe these using standalone ResizeObserver
    const itemStatesElementRefMapRef = useRef({});
    itemStates = useMemo(() => {
      let result = [];
      let usedKeys = new Set();
      let itemStatesElementRefMap = itemStatesElementRefMapRef.current;
      for (let i = 0; i < itemList.length; i++) {
        let item = itemList[i];
        let itemState = itemStates[i];
        // pass elementRef only when measuring or rendering non-menu items
        let usedKey = (item.key || i) + "";
        itemStatesElementRefMap[usedKey] ??= {
          ref: (el) => observeForSizeChanges(usedKey, el),
          el: undefined,
        };
        usedKeys.add(usedKey);
        itemState = { ...itemState, elementRef: itemStatesElementRefMap[usedKey].ref };
        result.push(itemState);
      }
      for (let k in itemStatesElementRefMap) {
        if (!usedKeys.has(k)) delete itemStatesElementRefMap[k];
      }
      return result;
    }, [itemList, itemStates]);

    const itemSizeObserverRef = useRef();
    function observeForSizeChanges(key, el) {
      let mapItem = itemStatesElementRefMapRef.current[key];
      if (!mapItem) return;
      let observer = itemSizeObserverRef.current;
      if (mapItem.el && observer) observer.unobserve(mapItem.el);
      mapItem.el = el;
      if (mapItem.el && observer) observer.observe(mapItem.el);
    }
    useLayoutEffect(() => {
      if (typeof ResizeObserver !== "undefined") {
        let els = Object.values(itemStatesElementRefMapRef.current)
          .map((it) => it.el)
          .filter(Boolean);
        let timeout;
        let observer = (itemSizeObserverRef.current = new ResizeObserver((entries) => {
          if (timeout === undefined) {
            timeout = setTimeout(() => {
              timeout = undefined;
              checkRenderedWidths();
            }, 50);
          }
        }));
        for (let el of els) observer.observe(el);
        return () => {
          observer.disconnect();
          itemSizeObserverRef.current = undefined;
          if (timeout === undefined) {
            clearTimeout(timeout);
            timeout = undefined;
          }
        };
      }
    }, [itemStates]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let elementProps, elementAttrs, componentProps;
    let mainClassName = Css.main(props, minWidth, maxWidth);

    let renderMain;
    if (shouldBeScrollable) {
      ({ elementAttrs, elementProps, componentProps } = Utils.VisualComponent.splitProps(
        propsToPass,
        Css.root(props, minWidth, maxWidth),
      ));
      const getIcon = (alignment) => {
        if (!(isOverflowing && displayArrow[alignment]) || isMobileOrTablet) return null;
        return (
          <NavigationIcon
            icon={`uugds-chevron-${alignment}`}
            className={Css.arrow(alignment)}
            onMouseDown={() => onMouseDown(alignment)}
            significance="common"
          />
        );
      };

      renderMain = (content) => (
        // !!! If scrollIndicator is changed, adjust Css.scrollableBoxWrapper()'s `display: flex` selector accordingly.
        <div {...elementAttrs}>
          {getIcon("left")}
          <ScrollableBox
            horizontal
            scrollIndicator="disappear"
            scrollbarWidth={0}
            elementRef={Utils.Component.combineRefs(scrollableBoxSizeRef, elementProps.elementRef)}
            scrollElementRef={scrollableBoxRef}
            className={Css.scrollableBoxWrapper()}
          >
            <div className={mainClassName} ref={elementRef}>
              {content}
            </div>
          </ScrollableBox>
          {getIcon("right")}
        </div>
      );
    } else {
      ({ elementAttrs, componentProps } = Utils.VisualComponent.splitProps(propsToPass, mainClassName));
      renderMain = (content) => (
        <div {...elementAttrs} ref={Utils.Component.combineRefs(elementAttrs.ref, elementRef)}>
          {content}
        </div>
      );
    }
    return willRerenderImmediately
      ? null
      : renderMain(
          // NOTE ActionGroupItemList is memoized so that we don't re-render content if e.g. "width"
          // changed but it had no effect on items.
          <div
            ref={Utils.Component.combineRefs(domNodeRef, alignment === "left" ? setContentElement : undefined)}
            className={Css.content({ ...props, minWidth, maxWidth, isMeasuring })}
          >
            <ActionGroupItemList
              renderPhase={renderPhase}
              itemList={itemList}
              itemStates={itemStates}
              menuState={menuState}
              menuWidth={menuWidth}
              {...componentProps}
            />
          </div>,
        );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function computeWidthAndUpdateItemStates(itemStates, itemList, menuWidth, gap) {
  let result = 0;
  itemStates.forEach((state) => delete state.skippedInMainArea);
  let data = itemStates.map((it, i) => ({ width: it[it.type], item: itemList[i], visible: !!it[it.type], state: it }));
  let visibleItems = data.filter((it) => it.visible);
  let menuState;
  let menuItems =
    visibleItems.length < itemStates.length && itemStates.length > 0 ? data.filter((it) => !it.visible) : [];
  if (menuItems.length > 0) {
    let hasNonDivider = menuItems.some((it) => !it.item.divider);
    if (hasNonDivider) {
      menuState = { collapsedItems: menuItems.map((it) => it.item) };
      visibleItems.push({ width: menuWidth, item: { significance: MENU_SIGNIFICANCE }, state: menuState });
    }
  }
  visibleItems.forEach((it, i) => (it.index = i));
  visibleItems.sort((a, b) => (a.item.order || 0) - (b.item.order || 0) || a.index - b.index); // stable sort by itemList[].order
  // update which dividers in button group will remain and which will be skipped
  for (let i = 0; i < visibleItems.length && visibleItems[i].item.divider; i++) {
    visibleItems[i].state.skippedInMainArea = true;
  }
  for (let i = visibleItems.length - 1; i >= 0 && visibleItems[i].item.divider; i--) {
    visibleItems[i].state.skippedInMainArea = true;
  }
  for (let i = 2; i < visibleItems.length - 1; i++) {
    if (visibleItems[i].item.divider && visibleItems[i - 1].item.divider) {
      visibleItems[i].state.skippedInMainArea = true;
    }
  }
  let prevItem;
  for (let i = 0; i < visibleItems.length; i++) {
    let item = visibleItems[i];
    if (item.state.skippedInMainArea) continue;
    let marginLeft;
    if (item.item?.divider || prevItem?.item?.divider) {
      marginLeft = DIVIDER_MARGIN;
    } else if (!prevItem || (isSubdued(prevItem?.item) && isSubdued(item?.item))) {
      marginLeft = 0;
    } else {
      marginLeft = BUTTON_MARGIN;
    }
    if (typeof gap === "number" && gap > 0) marginLeft = gap;
    item.state.marginLeft = marginLeft;
    result += item.width + marginLeft;
    prevItem = item;
  }
  itemStates.menuState = menuState;
  return result;
}

function isSubdued(item) {
  if (!item) return false;
  if (item.primary) return item.significance === "subdued";
  return item.significance === undefined || item.significance === "subdued";
}

function useContinuousMouseDown(fn, interval = 100) {
  const intervalRef = useRef();

  function onMouseDown(e) {
    fn(e);
    intervalRef.current = setInterval(() => fn(e), interval);
  }

  function onMouseUp() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = undefined;
  }

  function onMouseOut() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = undefined;
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { onMouseDown, onMouseUp, onMouseOut };
}

function NavigationIcon({ icon, className, onMouseDown }) {
  const continuousMouseDownAttrs = useContinuousMouseDown(onMouseDown);
  return <Icon icon={icon} className={className} elementAttrs={continuousMouseDownAttrs} />;
}
//@@viewOff:helpers

export { ActionGroup };
export default ActionGroup;
