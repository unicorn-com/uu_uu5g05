//@@viewOn:imports
import {
  Utils,
  createVisualComponent,
  useState,
  useLayoutEffect,
  useRef,
  useEffect,
  useDevice,
  usePreviousValue,
  Lsi,
  BackgroundProvider,
  useScreenSize,
  useBackground,
} from "uu5g05";
import Config from "../config/config.js";
import UuGds from "./gds.js";
import ScrollableBox from "../scrollable-box.js";
import Button from "../button.js";
import useEnterExitTransitionList, { STATES } from "./use-enter-exit-transition-list.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const TRANSLATE_Z = ["0", "-20px", "-30px"];
const DIRECTIONS = {
  LEFT: "left",
  RIGHT: "right",
  BOTTOM: "bottom",
};

// NOTE States are pretty much for horizontal transitioning (entering / staying in / exiting viewport).
// Vertical transitioning happens only as a side effect due to horizontal transitioning.
// NOTE Even if item is "ready", it can still be transitioning vertically, e.g. because preceding item is entering
// (but we don't need to keep separate track of it).

const GENERIC_STATES = {
  START: "start",
  RUN: "run",
  READY: "ready",
};

const TRANSITION_DURATION = Config.ALERT_TRANSITION_DURATION;
const FORCED_TRANSITION_END_TIMEOUT = TRANSITION_DURATION + 500;
const ALERT_WIDTH = 400;

const HORIZONTAL_GAP = UuGds.getValue(["SpacingPalette", "fixed", "g"]);
const VERTICAL_GAP = HORIZONTAL_GAP;
const ROW_GAP = UuGds.getValue(["SpacingPalette", "fixed", "c"]);
const EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW = 12;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ isMobileOrTablet }) => {
    let styles = {
      display: "grid",
      // NOTE Assuming that AlertBus effectively takes up 100vw. It contains:
      // 1. HORIZONTAL_GAP as paddingLeft.
      // 2. Single grid column limited to `100vw - 2*HORIZONTAL_GAP`.
      // 3. Unaccounted space having HORIZONTAL_GAP width reserved for potential scrollbar that may/may not appear.
      //    Because we do not want the column to jump leftwards when scrollbar appears, this gap is not realized using paddingRight.
      //    Instead whole grid content is packed to the left (justifyContent: start) and column uses 100vw-2gaps instead of 100%-2gaps.
      gridTemplateColumns: `minmax(0, calc(100vw - ${2 * HORIZONTAL_GAP}px))`,
      justifyItems: isMobileOrTablet ? "stretch" : "end",
      justifyContent: "start",
      alignItems: "start",
      alignContent: "start",
      position: "fixed",
      top: isMobileOrTablet ? 0 : Config.TOP_BAR_HEIGHT,
      left: 0,
      right: 0,
      bottom: 0,
      padding: `${VERTICAL_GAP}px 0 ${VERTICAL_GAP}px ${HORIZONTAL_GAP}px`, // gaps done via padding so that box-shadow of alerts is not truncated (due to `overflow` styles)
      maxWidth: `100%`,
      transformStyle: "preserve-3d", // so that exiting non-active (e.g. 2nd) from stacked list remains behind the 1st item during exiting
      pointerEvents: "none",
      "&>*": {
        pointerEvents: "all",
      },
    };

    // do not add anything here so that className does not change
    let standaloneStyles = {
      "@property --uu5-alert-mask": {
        syntax: '"<color>"',
        inherits: "false",
        initialValue: "transparent",
      },
    };

    return Utils.Css.joinClassName(Config.Css.css(styles), Config.Css.css(standaloneStyles));
  },

  closeAll: ({ closeAllStyles }) => {
    return Config.Css.css({
      justifySelf: "end",
      ...closeAllStyles,
    });
  },

  expectedGridSizeEl: () => {
    return Config.Css.css({
      position: "absolute",
      gridArea: "1 / 1 / -1 / -1",
      inset: 0,
      pointerEvents: "none",
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function isFullyVisible(element, scrollContainer) {
  if (!element || !scrollContainer) return null;
  let elementRect = element.getBoundingClientRect();
  let scrollContainerRect = scrollContainer.getBoundingClientRect();
  return elementRect.top >= scrollContainerRect.top && elementRect.bottom <= scrollContainerRect.bottom;
}

function getStackedItemStyles({
  alertList,
  hasStartingTransitions,
  hasOngoingTransitions,
  isExpanding,
  activeItemAtTransitionStart,
  lastTransformMap,
  screenSize,
}) {
  // NOTE Styling:
  //
  // grid:
  //   - contains 2 rows - 1st for "Close all" button, 2nd for all stackable items (all share the same `grid-area` value)
  //   - if there's no transition - the active item is alertList[0], and other items are `position: absolute` (to not affect grid row `auto` size)
  //     and clipped/masked (so that bigger non-active alerts don't shine through in the bottom)
  //   - "stack" effect is done using `perspective` and z-axis values
  //   - when item transition starts (i.e. there was no transition happenning just before this) or when expaning transition starts:
  //     - the grid row height is frozen to the height of the currently active item (`activeItemAtTransitionStart.height`)
  //     - the height freeze lasts until *all* transitions end (so if 1 alert is closing, i.e. exiting and in the meantime there's another alert
  //       that starts entering then we wait until both of those end), including expansion transition
  //     - if not expanding, finalActiveItem is computed and all items have their `translateY` updated to finalActiveItem.height - activeItemAtTransitionStart.height
  //       (to move them up/down depending on height difference of frozen grid row vs. height of the item that will be active after transitions end)
  //     - if expanding, `translateY` of all items is computed by summing preceding items' heights (`expansionYPosition`)

  let finalActiveItemIndex = alertList.findIndex(
    (it) => it.state !== STATES.EXITING && it.state !== STATES.EXITING_START,
  );
  let finalActiveItem = alertList[finalActiveItemIndex];
  let finalActiveItemHeight = finalActiveItem?.height || 0;
  let maxNonactiveVisibleHeight = Math.max(
    10,
    Math.min(finalActiveItemHeight - EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW, 84),
  ); // non-active item stacked behind active item has this amount of pixels visible (this includes gradient pixels, i.e. the rest is fully transparent)

  let activeItemAtTransitionStartHeight = activeItemAtTransitionStart?.height || 0;

  let autoHeightItem =
    hasStartingTransitions || hasOngoingTransitions || isExpanding ? activeItemAtTransitionStart : finalActiveItem;
  let autoHeightItemIndex = alertList.indexOf(autoHeightItem);

  let classNameList = [];
  let transformMap = {};
  let distanceFromFinalActiveUntruncated = 0;
  let expansionYPosition = activeItemAtTransitionStartHeight;
  for (let i = 0; i < alertList.length; i++) {
    let { id, state, height } = alertList[i];

    let distanceFromFinalActive = Math.min(2, distanceFromFinalActiveUntruncated);

    let translateX =
      state === STATES.EXITING
        ? `calc(-100% - ${HORIZONTAL_GAP + EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW}px)`
        : "0";

    let translateY =
      state === STATES.EXITING
        ? lastTransformMap[id].translateY // keep the same once the item is exiting, so that exiting item moves only horizontally
        : state === STATES.ENTERING_START
          ? `${activeItemAtTransitionStartHeight + VERTICAL_GAP + EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW}px`
          : isExpanding
            ? `calc(-100% + ${expansionYPosition}px)`
            : (hasOngoingTransitions
                ? activeItemAtTransitionStartHeight - (finalActiveItemHeight || activeItemAtTransitionStartHeight)
                : 0) + "px";
    expansionYPosition -= state === STATES.EXITING || state === STATES.EXITING_START ? 0 : height + ROW_GAP;

    let translateZ =
      state === STATES.EXITING
        ? lastTransformMap[id].translateZ // keep the same once the item is exiting, so that exiting item moves only horizontally
        : isExpanding
          ? "0"
          : TRANSLATE_Z[distanceFromFinalActive];

    let isMasked =
      isExpanding || state === STATES.EXITING || state === STATES.EXITING_START || i <= finalActiveItemIndex
        ? false
        : true;
    classNameList.push(
      Config.Css.css({
        [`& [data-uu5-alert-id="${id}"]`]: {
          translate: `${translateX} ${translateY} ${translateZ}`,
          // if nothing is entering/exiting, we must turn off `transition` entirely (otherwise, after ending "enter" transition
          // of an alert that was of different height, i.e. existing items were transiting from translateY(0) -> e.g. -12px,
          // we will unfreeze row height and would end up animating translateY(-12px) -> 0px which we don't want)
          transition:
            hasStartingTransitions || hasOngoingTransitions || isExpanding
              ? `translate ${TRANSITION_DURATION}ms ease, opacity ${TRANSITION_DURATION}ms ease, --uu5-alert-mask ${isMasked ? TRANSITION_DURATION : TRANSITION_DURATION / 4}ms ease`
              : undefined,
          gridArea: "stack",
          width: screenSize === "xs" || screenSize === "s" ? "100%" : ALERT_WIDTH,
          opacity: isExpanding ? "1" : distanceFromFinalActiveUntruncated > 2 ? "0" : "1", // hide 4th/5th/... alert so that their box-shadow isn't visible (otherwise top of stacked list would become darker and darker)
          ...(id !== autoHeightItem?.id
            ? {
                position: "absolute",
                left: 0,
                top: 0,
                right: 0,
              }
            : undefined),
          // mask out the bottom part of non-active items so that long items do not bleed out from under the active item
          // - nonactive items mask: black between 0% .. EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW + 20 (i.e. first 20px from Alert top edge),
          //   then gradient starts upto `maxNonactiveVisibleHeight` and rest is transparent
          // - active item / unstacked items: all black
          // - mask gradient is also transitioned thanks to CSS @property --uu5-alert-mask with proper 'syntax' setting
          //   which creates appearing/disappearing effect
          maskImage: `linear-gradient(to bottom, black 0% ${Math.min(EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW + 20, maxNonactiveVisibleHeight)}px, var(--uu5-alert-mask) ${maxNonactiveVisibleHeight}px, var(--uu5-alert-mask) 100%)`,
          maskRepeat: "no-repeat",
          maskPosition: `-${EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW}px -${EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW}px`,
          maskSize: `calc(100% + ${2 * EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW}px) calc(100% + ${2 * EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW}px)`,
          maskClip: "no-clip", // so that box-shadow is not clipped away
          "--uu5-alert-mask": isMasked ? "transparent" : "black",
        },
      }),
    );

    transformMap[id] = { translateX, translateY, translateZ };
    if (state !== STATES.EXITING && state !== STATES.EXITING_START) distanceFromFinalActiveUntruncated++;
  }
  classNameList.push(
    Config.Css.css({
      gridTemplateRows:
        "minmax(0, 1fr) auto " +
        (hasStartingTransitions || hasOngoingTransitions || isExpanding
          ? activeItemAtTransitionStartHeight + "px"
          : "auto"),
      gridTemplateAreas: '"sizer" "closeAll" "stack"',
    }),
  );
  classNameList.push(
    Config.Css.css({
      // https://drafts.csswg.org/css-transforms-2/#perspective
      perspective: "1000px",
      perspectiveOrigin: `center calc(100% - ${finalActiveItemHeight + 500}px)`, // 500px above the top edge of active item (as well as all items, as their position differ only in z-axis)
      transition: `perspective-origin ${TRANSITION_DURATION}ms ease`,
    }),
  );

  let closeAllStyles;
  if (isExpanding) {
    // styles for Close all button
    let itemCountAfterTransitionsAreFinished = alertList.filter(
      (it) => it.state !== STATES.EXITING_START && it.state !== STATES.EXITING,
    ).length;
    let closeAllTranslateY =
      itemCountAfterTransitionsAreFinished <= 1 ? lastTransformMap["closeAll"]?.translateY : `${expansionYPosition}px`;
    closeAllStyles = {
      opacity: itemCountAfterTransitionsAreFinished <= 1 ? "0" : "1",
      gridArea: "closeAll",
      translate: `0 ${closeAllTranslateY} 0`,
      transition: `opacity ${TRANSITION_DURATION}ms ease, translate ${TRANSITION_DURATION}ms ease`,
      "@starting-style": {
        translate: "0 0 0",
        opacity: "0",
      },
    };
    transformMap["closeAll"] = { translateY: closeAllTranslateY };
  }

  return { classNameList, transformMap, closeAllStyles };
}

function getUnstackedItemStyles({
  alertList,
  hasStartingTransitions,
  hasOngoingTransitions,
  lastTransformMap,
  directionMap,
  isFirstAtBottom,
  screenSize,
  background,
}) {
  // grid:
  //   - each item has its own row
  //   - reversed row order, i.e. alertList[0] is the last row
  let gridTemplateRows = [];
  let gridTemplateAreas = [];
  let classNameList = [];
  let transformMap = {};

  let fullEnteringHeightSum = 0;
  let fullExitingHeightSum = 0;
  let fullHeightSum = 0;
  for (let i = 0; i < alertList.length; i++) {
    let { state, height } = alertList[i];
    fullHeightSum += (height || 0) + ROW_GAP;
    if (state === STATES.ENTERING) {
      fullEnteringHeightSum += (height || 0) + ROW_GAP;
    } else if (state === STATES.EXITING) {
      fullExitingHeightSum += (height || 0) + ROW_GAP;
    }
  }

  let enteringHeightSum = 0;
  let exitingHeightSum = 0;
  let heightSum = 0;
  for (let i = 0; i < alertList.length; i++) {
    let { id, state, height } = alertList[i];
    let { enterDirection, exitDirection } = directionMap[id];

    // e.g. "right" means that the item should be entirely to the right (outside of viewport)
    // "default" <=> wherever the final position in grid is
    // "bottom-groupped" <=> outside of viewport below the viewport bottom edge && as a group (i.e. top-most item will end up right below the viewport bottom edge, whereas botom-most item will be further down)
    let expectedPosition =
      state === STATES.ENTERING_START ? enterDirection : state === STATES.EXITING ? exitDirection : "default";
    let isGroupMove = expectedPosition?.endsWith("-groupped");
    expectedPosition = expectedPosition?.replace("-groupped", "");

    let translateX =
      // NOTE Left position assumes that item is packed to the left or it is 100% wide.
      // NOTE Right position assumes that item is packed to the right or it is 100% wide.
      expectedPosition === DIRECTIONS.LEFT
        ? `calc(-100% - ${HORIZONTAL_GAP + EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW}px)`
        : expectedPosition === DIRECTIONS.RIGHT
          ? `calc(100% + ${HORIZONTAL_GAP + EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW}px)`
          : state === STATES.EXITING
            ? lastTransformMap[id]?.translateX || "0"
            : "0";

    let translateY =
      expectedPosition === DIRECTIONS.BOTTOM
        ? isFirstAtBottom
          ? `calc(100% + ${(isGroupMove ? fullHeightSum - fullEnteringHeightSum : heightSum - enteringHeightSum) + VERTICAL_GAP + EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW}px)`
          : `calc(100vh - ${isGroupMove ? fullEnteringHeightSum - fullExitingHeightSum : enteringHeightSum - exitingHeightSum}px)`
        : state === STATES.EXITING
          ? lastTransformMap[id]?.translateY // keep the same once the item is exiting, so that exiting item moves only horizontally
          : isFirstAtBottom
            ? state === STATES.ENTERING
              ? `calc(-100% - ${enteringHeightSum - exitingHeightSum + ROW_GAP}px)`
              : -(enteringHeightSum - exitingHeightSum) + "px"
            : enteringHeightSum - exitingHeightSum + "px";

    let translateZ = "0";

    classNameList.push(
      Config.Css.css({
        [`& [data-uu5-alert-id="${id}"]`]: {
          translate: `${translateX} ${translateY} ${translateZ}`,
          // if nothing is entering/exiting, we must turn off `transition` entirely (see comments above)
          transition:
            hasOngoingTransitions || hasStartingTransitions ? `translate ${TRANSITION_DURATION}ms ease` : undefined,
          gridArea: id,
          width: screenSize === "xs" || screenSize === "s" ? "100%" : ALERT_WIDTH,
          // NOTE Not using `rowGap: ROW_GAP` on grid because during item ENTERING the gap would emerge immediately and thus
          // the items would jump by ROW_GAP downwards. Instead, we consider the gap as a part of item's height (and style it as margin).
          [isFirstAtBottom ? "marginTop" : "marginBottom"]: ROW_GAP,
        },
      }),
    );
    transformMap[id] = { translateX, translateY, translateZ };
    gridTemplateRows.push(state === STATES.ENTERING_START || state === STATES.ENTERING ? `minmax(0, 0)` : "auto");
    gridTemplateAreas.push(`"${id}"`);

    heightSum += (height || 0) + ROW_GAP;
    if (state === STATES.ENTERING) {
      enteringHeightSum += (height || 0) + ROW_GAP;
    } else if (state === STATES.EXITING) {
      exitingHeightSum += (height || 0) + ROW_GAP;
    }
  }
  gridTemplateAreas.push('"closeAll"', '"sizer"');
  gridTemplateRows.push("auto", "minmax(0, 1fr)");
  classNameList.push(
    Config.Css.css({
      gridTemplateRows: (isFirstAtBottom ? gridTemplateRows.reverse() : gridTemplateRows).join(" "),
      gridTemplateAreas: (isFirstAtBottom ? gridTemplateAreas.reverse() : gridTemplateAreas).join(" "),
      overflow: hasOngoingTransitions || hasStartingTransitions ? "hidden" : "auto",
    }),
  );

  let hasEnteringTransitions = alertList.some(
    (it) => it.state === STATES.ENTERING_START || it.state === STATES.ENTERING,
  );
  classNameList.push(
    Config.Css.css({
      ...ScrollableBox.getScrollbarStyles({ background }),
      // - on desktop/mobile, if we're scrolled in the middle and new item enters (to top/bottom) => use "smooth" scroll to top/bottom
      // - on mobile, when transitions end => use "auto" (instant) scroll for scroll correction after grid unfreeze
      // - on both, when scrolled entirely down, alert gets unmounted (browser updates scrollTop immediately), we start exiting transition
      //   and resurrect the element => scroll entirely down again using "auto" (instant) scroll
      scrollBehavior: hasEnteringTransitions ? "smooth" : "auto",
    }),
  );

  // styles for Close all button
  let itemCountAfterTransitionsAreFinished = alertList.filter(
    (it) => it.state !== STATES.EXITING_START && it.state !== STATES.EXITING,
  ).length;
  let isExitingDueToCloseAll = hasOngoingTransitions && directionMap["closeAll"]?.exitDirection?.endsWith("-groupped");
  let closeAllExitDirection = directionMap["closeAll"]?.exitDirection?.replace("-groupped", "");
  // if exiting all due to "Close all" then go based on direction, otherwise stay in place and just do opacity transition
  // (and in all other cases update y-axis depending on how items are entering/exiting)
  let closeAllTranslateY =
    isExitingDueToCloseAll && closeAllExitDirection === DIRECTIONS.BOTTOM
      ? isFirstAtBottom
        ? `calc(100% + ${fullHeightSum - fullEnteringHeightSum + VERTICAL_GAP + EXTRA_ENTERING_OFFSET_TO_ACCOUNT_FOR_BOX_SHADOW}px)`
        : `calc(100vh - ${fullEnteringHeightSum - fullExitingHeightSum}px)`
      : itemCountAfterTransitionsAreFinished <= 1
        ? lastTransformMap["closeAll"]?.translateY || "0"
        : isFirstAtBottom
          ? -(enteringHeightSum - exitingHeightSum) + "px"
          : enteringHeightSum - exitingHeightSum + "px";
  let closeAllStyles = {
    opacity: itemCountAfterTransitionsAreFinished <= 1 ? "0" : "1",
    gridArea: "closeAll",
    translate: `0 ${closeAllTranslateY} 0`,
    transition:
      hasOngoingTransitions || hasStartingTransitions
        ? `opacity ${TRANSITION_DURATION}ms ease, translate ${TRANSITION_DURATION}ms ease`
        : undefined,
    "@starting-style": {
      translate: "0 0 0",
      opacity: "0",
    },
  };
  transformMap["closeAll"] = { translateY: closeAllTranslateY };

  return { classNameList, transformMap, closeAllStyles, fullEnteringHeightSum, fullExitingHeightSum };
}

function useOneWayTransition(duration, elementRef, initialState) {
  let [state, setState] = useState(initialState);
  useLayoutEffect(() => {
    if (state === GENERIC_STATES.START) {
      elementRef.current.offsetWidth; // touch this to force browser re-calculate layout (otherwise transition might not start properly due to browser optimizations)
      setState(GENERIC_STATES.RUN);
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [state]);
  useLayoutEffect(() => {
    if (state == GENERIC_STATES.RUN) {
      let timeout;
      let rafId = requestAnimationFrame(() => {
        timeout = setTimeout(() => setState(GENERIC_STATES.READY), duration);
      });
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timeout);
      };
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [state]);

  return [state, setState];
}
//@@viewOff:helpers

const AlertBusViewStacked = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AlertBusViewStacked",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { alertList: propsAlertList = [], onCloseAll } = props;

    const [screenSize] = useScreenSize();

    const background = useBackground();

    // NOTE We assume that these values don't change between renders.
    const { isMobileOrTablet } = useDevice();
    const alwaysExpanded = !isMobileOrTablet;
    // NOTE Not all direction/styling combinations are supported yet (e.g. desktop + DIRECTIONS.LEFT doesn't really work).
    const enterDirection = isMobileOrTablet ? DIRECTIONS.BOTTOM : DIRECTIONS.RIGHT;
    const exitDirection = isMobileOrTablet ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT;
    const closeAllExitDirection = isMobileOrTablet ? DIRECTIONS.BOTTOM : exitDirection;
    const isFirstAtBottom = isMobileOrTablet;

    const elementRef = useRef();
    const expectedGridSizeElRef = useRef();
    let lastTransformMapRef = useRef({});
    let lastTransformMap = lastTransformMapRef.current;

    let {
      itemList: alertList,
      endTransition,
      containerForUnmountedElementsRef,
      hasStartingTransitions,
      hasOngoingTransitions,
    } = useEnterExitTransitionList({
      itemIdList: propsAlertList,
      getElement: (id) => elementRef.current?.querySelector(`[data-uu5-alert-id="${id}"]`),
      onResurrectUnmountedElement: (resurrectedElement, item) => {
        // on mobile, resurrect element in reverse order (move resurrected to be first child) as they were
        // shown also in reverse order (this affects ~z-index of items that are exiting while stacked)
        if (
          isFirstAtBottom &&
          isStackedOrExpanding && // eslint-disable-line no-use-before-define
          resurrectedElement.parentNode.firstChild !== resurrectedElement
        ) {
          resurrectedElement.parentNode.insertBefore(resurrectedElement, resurrectedElement.parentNode.firstChild);
        }

        // TODO This doesn't work properly if unmounted element was already transitioning y-axis - we would need
        // to know what was getComputedStyle(item.element).translate *just before unmount happenned* and use that
        // for our @starting-style. E.g. on desktop if we slow down transition to 3s, close 1st alert (top-most) and while its exiting,
        // close also 2nd alert which has already moved slightly upwards - after the click, this 2nd alert will jump
        // a bit, because it was already transitioning y-axis from 0 to e.g. -50px, i.e. was at e.g. -12px, got unmounted,
        // we got info that it's no longer in the list, we'll make it re-appear here, but we don't have that -12px value
        // for our @starting-style...
        // NOTE This must use value of `transformMap` from previous render (not from the last render).
        let { translateX = 0, translateY = 0, translateZ = 0 } = lastTransformMap[item.id] || {};
        resurrectedElement.className = Utils.Css.joinClassName(
          resurrectedElement.className,
          Config.Css.css({
            "@starting-style": { "&&&": { translate: `${translateX} ${translateY} ${translateZ}` } },
          }),
        );

        // if we're on mobile && grid is scrolled down entirely && we resurrect something -> keep scroll position entirely down
        if (
          isFirstAtBottom &&
          !isStackedOrExpanding // eslint-disable-line no-use-before-define
        ) {
          // NOTE We cannot directly use elementRef.current.scrollHeight because something can be transitioning to/from below
          // bottom edge, but since our grid has `overflow`, it enlarges the scrollHeight (but we don't want to count this extra
          // enlargement).
          //   => read grid size based on absolutely-positioned element which starts in 1st cell and ends in last cell (and add paddings)
          let expectedFullHeight = expectedGridSizeElRef.current.clientHeight + 2 * VERTICAL_GAP;
          if (
            elementRef.current.scrollTop +
              elementRef.current.clientHeight +
              1 +
              resurrectedElement.offsetHeight +
              ROW_GAP >=
            expectedFullHeight
          ) {
            if (expectedFullHeight - elementRef.current.clientHeight !== elementRef.current.scrollTop) {
              elementRef.current.scrollTop = expectedFullHeight - elementRef.current.clientHeight;
            }
          }
        }
      },
      forcedTransitionEndTimeout: FORCED_TRANSITION_END_TIMEOUT,
    });

    // assign directionality if starting entering/exiting
    let directionMapRef = useRef({});
    let directionMap = directionMapRef.current;
    let idSetToCleanup = new Set(Object.keys(directionMap));
    for (let item of alertList) {
      directionMap[item.id] ??= {};
      idSetToCleanup.delete(item.id);
      if (item.state === STATES.ENTERING_START || item.state === STATES.ENTERING) {
        directionMap[item.id].enterDirection ??= enterDirection;
      } else if (item.state === STATES.EXITING_START || item.state === STATES.EXITING) {
        directionMap[item.id].exitDirection ??= exitDirection;
      }
    }
    if (alertList.length >= 2) idSetToCleanup.delete("closeAll");
    for (let id of idSetToCleanup) delete directionMap[id];

    let [expandedState, setExpandedState] = useOneWayTransition(
      TRANSITION_DURATION,
      elementRef,
      alwaysExpanded ? GENERIC_STATES.READY : undefined,
    );
    let [finishedExpansion, setFinishedExpansion] = useState(alwaysExpanded);
    if (!alwaysExpanded && alertList.length <= 1) {
      if (expandedState) {
        expandedState = undefined;
        setExpandedState(expandedState);
      }
      if (finishedExpansion) {
        finishedExpansion = false;
        setFinishedExpansion(finishedExpansion);
      }
    }
    let expanded = !!expandedState;
    let isExpanding = expanded && !finishedExpansion;
    let isStackedOrExpanding = !expanded || !finishedExpansion;

    // finish expanding (only after expanding as well as all entering/exiting transitions are finished)
    useLayoutEffect(() => {
      if (
        !finishedExpansion &&
        expandedState === GENERIC_STATES.READY &&
        !hasOngoingTransitions &&
        !hasStartingTransitions
      ) {
        setFinishedExpansion(true);
      }
    }, [expandedState, finishedExpansion, hasOngoingTransitions, hasStartingTransitions]);

    let hasAnyTransition = hasStartingTransitions || hasOngoingTransitions || isExpanding;
    useLayoutEffect(() => {
      if (!hasAnyTransition) {
        for (let { element } of alertList) element?.offsetWidth; // touch this to force browser re-calculate layout (otherwise `transition: undefined` might be skipped, i.e. it'll be animated due to browser optimizations if next render occurs immediately and with different `transition: Xpx`)
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [hasAnyTransition]);

    function onTransitionEnd(e) {
      let { target } = e;
      let id = target.getAttribute("data-uu5-alert-id");
      if (!id) return;
      endTransition(id);
    }

    function onClick(e) {
      let { target } = e;
      let ignoreClick = expanded || alertList.length <= 1 || e.button !== 0 || target.closest("a, button");
      if (!ignoreClick) {
        setExpandedState(GENERIC_STATES.START);
      }
    }

    function handleCloseAll(e) {
      let direction = closeAllExitDirection + "-groupped";
      for (let it of Object.values(directionMap)) it.exitDirection ??= direction;
      directionMap["closeAll"] ??= {};
      directionMap["closeAll"].exitDirection = direction;
      onCloseAll(e);
    }

    // update visibility state
    function updateVisibility() {
      let changed;
      let visibilityMap = {};
      for (let alertData of propsAlertList) visibilityMap[alertData.id] = alertData.visible;
      for (let i = 0; i < alertList.length; i++) {
        let alert = alertList[i];
        let { id, state, element } = alert;
        if (!(id in visibilityMap)) continue;
        // visible <=> alert progress (duration) should be counting down
        let visible =
          state === STATES.ENTERING || state === STATES.ENTERING_START
            ? false
            : !expanded
              ? i === 0
              : (isFullyVisible(element, elementRef.current) ?? true);
        if (visibilityMap[id] !== visible) {
          visibilityMap[id] = visible;
          changed = true;
        }
      }
      if (changed) props.onVisibilityChange(new Utils.Event({ visibilityMap }));
    }

    function onScroll(e) {
      updateVisibility();
    }

    useEffect(() => {
      updateVisibility();
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [alertList, expanded]);

    // compute styles based on transition states
    let activeItemAtTransitionStartRef = useRef(0);
    let activeItemAtTransitionStart = activeItemAtTransitionStartRef.current;
    if (!hasOngoingTransitions && !hasStartingTransitions && !isExpanding) {
      activeItemAtTransitionStart = alertList[0];
    }
    useEffect(() => {
      activeItemAtTransitionStartRef.current = activeItemAtTransitionStart;
    });

    let classNameList, transformMap, closeAllStyles, fullEnteringHeightSum, fullExitingHeightSum;
    if (isStackedOrExpanding) {
      // styling for stacked list as well as for expansion transition from stacked to unstacked
      ({ classNameList, transformMap, closeAllStyles } = getStackedItemStyles({
        alertList,
        hasStartingTransitions,
        hasOngoingTransitions,
        isExpanding,
        activeItemAtTransitionStart,
        lastTransformMap,
        isFirstAtBottom,
        directionMap,
        screenSize,
      }));
    } else {
      // styling for unstacked list (only after expansion transition + all ongoing item transitions during expansion ended)
      ({ classNameList, transformMap, closeAllStyles, fullEnteringHeightSum, fullExitingHeightSum } =
        getUnstackedItemStyles({
          alertList,
          hasStartingTransitions,
          hasOngoingTransitions,
          lastTransformMap,
          isFirstAtBottom,
          directionMap,
          screenSize,
          background,
        }));
    }

    useEffect(() => {
      lastTransformMapRef.current = transformMap;
    });

    // update scroll position when transition starts / ends
    let hasEnteringTransitions = alertList.some(
      (it) => it.state === STATES.ENTERING_START || it.state === STATES.ENTERING,
    );
    let lastFullEnteringHeightSum = usePreviousValue(fullEnteringHeightSum, fullEnteringHeightSum);
    let lastFullExitingHeightSum = usePreviousValue(fullExitingHeightSum, fullExitingHeightSum);
    let wasExpanding = usePreviousValue(isExpanding, false);
    useLayoutEffect(() => {
      if (!isStackedOrExpanding) {
        let newScrollTop;
        if (isFirstAtBottom) {
          if (
            !hasAnyTransition &&
            elementRef.current.scrollTop + elementRef.current.clientHeight + 1 < elementRef.current.scrollHeight
          ) {
            if (wasExpanding) {
              // scroll entirely down
              newScrollTop = elementRef.current.scrollHeight - elementRef.current.clientHeight;
            } else {
              // transitions just ended => update scroll based on what newly entered - what exited
              newScrollTop = elementRef.current.scrollTop + lastFullEnteringHeightSum - lastFullExitingHeightSum;
            }
          } else if (hasEnteringTransitions) {
            // transitions just started and there is an entering item => scroll to it (smoothly - see scrollBehavior)
            newScrollTop =
              expectedGridSizeElRef.current.clientHeight + 2 * VERTICAL_GAP - elementRef.current.clientHeight;
          }
        } else {
          if (hasEnteringTransitions) {
            // transitions just started and there is an entering item => scroll to it (smoothly - see scrollBehavior)
            newScrollTop = 0;
          }
        }

        if (newScrollTop != null) {
          newScrollTop = Math.max(
            0,
            Math.min(newScrollTop, elementRef.current.scrollHeight - elementRef.current.clientHeight),
          );
          if (newScrollTop !== elementRef.current.scrollTop) {
            elementRef.current.scrollTop = newScrollTop;
          }
        }
      }
      // NOTE `hasEnteringTransitions` is deliberately not in dependencies (if exiting tranitions are ongoing and new
      // item starts entering, we don't want to re-execute this effect).
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [hasAnyTransition, isFirstAtBottom, isStackedOrExpanding]);

    // useEffect(() => {
    //   console.log(
    //     alertList,
    //     transformMap,
    //     hasOngoingTransitions,
    //     hasStartingTransitions,
    //     isExpanding,
    //     propsAlertList,
    //     structuredClone(directionMap),
    //     closeAllStyles,
    //   );
    // });
    //@@viewOff:private

    //@@viewOn:render
    classNameList.push(Css.main({ ...props, isMobileOrTablet, isFirstAtBottom }));
    const attrs = Utils.VisualComponent.getAttrs(props, classNameList.join(" "));

    return (
      <div
        {...attrs}
        ref={Utils.Component.combineRefs(attrs.ref, elementRef)}
        onTransitionEnd={onTransitionEnd}
        onClick={onClick}
        onScroll={onScroll}
      >
        {/* NOTE This is just a portal target element, i.e. no direct children here. */}
        <div ref={props.portalRef} className={Config.Css.css({ display: "contents" })} />

        {/* for resurrected unmounted elements */}
        <div className={Config.Css.css({ display: "contents" })} ref={containerForUnmountedElementsRef} />

        {/* for measuring grid size without counting (temporarily) displaced items during entering transitions which cause overflow at the bottom */}
        <div ref={expectedGridSizeElRef} className={Css.expectedGridSizeEl()} />

        {expanded && alertList.length >= 2 ? (
          <BackgroundProvider background="full">
            <Button
              icon="uugds-close"
              effect="upper"
              colorScheme="neutral"
              significance="highlighted"
              className={Css.closeAll({ closeAllStyles })}
              onClick={handleCloseAll}
            >
              <Lsi import={importLsi} path={["AlertBus", "closeAll"]} />
            </Button>
          </BackgroundProvider>
        ) : null}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { AlertBusViewStacked };
export default AlertBusViewStacked;
//@@viewOff:exports
