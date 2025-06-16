//@@viewOn:imports
import { useEffect, usePreviousValue, useRef, useState } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const TRANSITION_DURATION = Config.MODAL_TRANSITION_DURATION;
// NOTE Keep duration === opacity + sizing + opacity. So that if 1 item is activating and another
// deactivating at the same time, they start their sizing at the same time.
const TRANSITION_SIZING_DURATION = (3 / 4) * TRANSITION_DURATION;
const TRANSITION_OPACITY_DURATION = (TRANSITION_DURATION - TRANSITION_SIZING_DURATION) / 2;

const DIALOG_HEIGHTS = [0, 32, 16, 0];
const DIALOG_HEIGHTS_MOBILE = [0, 36, 8, 0];
const DIALOG_WIDTH_OFFSETS = [0, 32, 64, 128];

function cssTransition(transitionProps1, transitionProps2, reverse) {
  let durations = [TRANSITION_OPACITY_DURATION, TRANSITION_SIZING_DURATION];
  if (reverse) durations = durations.reverse();
  let delays = [];
  for (let i = 0; i < durations.length; i++) delays[i] = delays[i - 1] + durations[i - 1] || 0;
  let parts = [transitionProps1, transitionProps2];
  if (reverse) parts.reverse();
  return parts
    .map((transitionProps, i) => {
      return Object.keys(transitionProps).map(
        (cssProp) =>
          `${cssProp.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())} ${durations[i]}ms ${
            delays[i] + (reverse ? TRANSITION_OPACITY_DURATION : 0)
          }ms ${transitionProps[cssProp]}`,
      );
    })
    .flat()
    .join(",");
}

function useModalBusActiveAnimation(
  isInitialized,
  index,
  activeIndex,
  itemListLength,
  dialogRef,
  metrics,
  activeModalMetrics,
  isMobileOrTablet,
) {
  let prevIndex = usePreviousValue(index, -1);
  let prevActiveIndex = usePreviousValue(activeIndex, -1);
  let prevItemListLength = usePreviousValue(itemListLength, 0);
  let activating = index !== -1 && index === activeIndex && (prevIndex === -1 || prevIndex !== prevActiveIndex);
  if (activating && prevItemListLength === 0 && itemListLength > 0) activating = false; // don't consider it as "activating" if we're single Modal getting opened in ModalBus (i.e. skip animation - only ModalBus will do its own animation)
  let deactivating = prevIndex !== -1 && index !== activeIndex && prevIndex === prevActiveIndex;
  let dialogHeights = isMobileOrTablet ? DIALOG_HEIGHTS_MOBILE : DIALOG_HEIGHTS;

  let everDeactivatedRef = useRef(false);
  if (deactivating) everDeactivatedRef.current = true;
  if (!isInitialized) everDeactivatedRef.current = false;

  let isMounted = !!metrics;
  let activeIndexOffset = index === -1 && !deactivating ? 0 : index - activeIndex;
  let distance = Math.abs(activeIndexOffset);
  let clippedIndexDistance = Math.min(3, distance);
  let dialogStyle = {};

  let [state, run] = useSimpleTransition(
    activating ? TRANSITION_DURATION : TRANSITION_SIZING_DURATION + TRANSITION_OPACITY_DURATION,
    dialogRef,
    function applyBefore() {
      if (deactivating) {
        let gcs = getComputedStyle(dialogRef.current);
        dialogRef.current.style.width = gcs.width;
        dialogRef.current.style.height = gcs.height;
      } else if (activating && prevIndex === -1) {
        // just opened a modal && is getting activated (this is after mount and before commiting 2nd render;
        // 1st render was in full height)
        dialogRef.current.style.height = "0px";
      }
    },
  );

  let result = {};
  if (isInitialized) {
    let isTransiting = state === "run";
    if (state !== "run" && (activating || deactivating)) {
      run();
      isTransiting = true;
    }

    if (activeIndexOffset === 0) {
      let inactiveModalsHeight = 0;
      for (let i = -2; i <= +2; i++) {
        if (i + index >= 0 && i + index < itemListLength) inactiveModalsHeight += dialogHeights[Math.abs(i)] || 0;
      }
      dialogStyle.maxHeight = `calc(100% - ${inactiveModalsHeight}px)`;
      if (isMobileOrTablet && itemListLength - 1 === activeIndex) {
        dialogStyle.borderBottomLeftRadius = 0;
        dialogStyle.borderBottomRightRadius = 0;
      }
    } else {
      dialogStyle.maxHeight = "100%";
    }
    if (activeIndexOffset === 0 && isTransiting) {
      dialogStyle.width = `min(100%, ${metrics.dialogRect.width}px)`;
      dialogStyle.height = metrics.dialogRect.height;
      dialogStyle.overflow = "hidden";
    } else if (activeIndexOffset !== 0 && isMounted) {
      dialogStyle.width = `calc(min(100%, ${activeModalMetrics.dialogRect.width}px) - ${DIALOG_WIDTH_OFFSETS[clippedIndexDistance]}px)`;
      dialogStyle.height = dialogHeights[clippedIndexDistance];
      dialogStyle.overflow = "hidden";
      dialogStyle[activeIndexOffset > 0 ? "borderTopLeftRadius" : "borderBottomLeftRadius"] = 0;
      dialogStyle[activeIndexOffset > 0 ? "borderTopRightRadius" : "borderBottomRightRadius"] = 0;
    }
    dialogStyle.zIndex = 5 - clippedIndexDistance;
    dialogStyle.transition = cssTransition(
      {},
      { width: "ease", height: "ease", maxHeight: "ease", borderRadius: "ease" },
      activating,
    );
    if (!isMounted || prevIndex === -1) {
      let keyframes = Config.Css.keyframes({ "0%": { opacity: 0 }, "100%": { opacity: 1 } });
      dialogStyle.animation = `${keyframes} ${TRANSITION_OPACITY_DURATION}ms `;
    }

    let headerStyle = {};
    headerStyle.opacity = isMounted && clippedIndexDistance >= 2 ? 0 : 1;
    if (isMounted && clippedIndexDistance >= 1) {
      headerStyle.transform = `translate(0, ${-metrics.headerPaddingTop - 1}px)`;
    } else {
      headerStyle.transform = `translate(0, 0)`;
    }
    headerStyle.transition = `opacity ${TRANSITION_SIZING_DURATION}ms ${TRANSITION_OPACITY_DURATION}ms, transform ${TRANSITION_SIZING_DURATION}ms ${TRANSITION_OPACITY_DURATION}ms`;

    let headerTextStyle = {};
    headerTextStyle.transition = `transform ${TRANSITION_SIZING_DURATION}ms ${TRANSITION_OPACITY_DURATION}ms`;
    headerTextStyle.transform = isMounted && clippedIndexDistance >= 1 ? `scale(0.7)` : `scale(1)`;
    headerTextStyle.transformOrigin = "left center";

    let bodyStyle = {};
    if ((activeIndexOffset === 0 && isTransiting) || (activeIndexOffset !== 0 && isMounted)) {
      bodyStyle.width = metrics.dialogRect.width;
      bodyStyle.height = metrics.dialogRect.height - metrics.headerRect.height;
      bodyStyle.pointerEvents = "none";
      bodyStyle.opacity = 0;
    } else {
      bodyStyle.opacity = 1;
    }
    if (isMounted && (everDeactivatedRef.current || itemListLength > 1) && isTransiting) {
      let isTransitingActivation = activeIndexOffset === 0;
      let keyframes = Config.Css.keyframes({
        "0%": { position: "static" },
        "100%": { position: "absolute" },
        // NOTE We need keyframes to have different names (normal vs. reverse), because simply changing
        // animation-direction from "normal" to "reverse" wouldn't run animation again (we would have to
        // keep count of already played animation-iteration-count for each animation/element and increase it
        // when we would want to play the animation again; switching between 2 animation keyframes names is simpler).
        //   => add ignored rule to have different keyframes name
        "101%": isTransitingActivation ? { content: '"-"' } : undefined,
      });
      let keyframes2 = Config.Css.keyframes({
        // NOTE Using `opacity` instead of toggling `visibility` because visibility would unfocus autoFocus-ed input.
        "0%": { opacity: 1 },
        "100%": { opacity: 0 },
        "101%": isTransitingActivation ? { content: '"-"' } : undefined,
      });

      // NOTE When activating, whole duration is opacity+size+opacity (see useSimpleTransition() params above),
      // but the `position: static/absolute` should be active only during first opacity+size segments.
      // When deactivating, whole duration is size+opacity, and `position: ...` should be active during all of that.
      // NOTE `animation-fill-mode: both` applies the rules from "0%"/"100%" even during animation delay (which is what we want).
      // NOTE `animation-timing-function: step-start` effectively applies rules from "100%" rule (assuming `animation-direction: normal`)
      // because we have just 0% and 100% and the animation will contain just single step and therefore it's the one at 100% boundary.
      let positionAnimation = isTransitingActivation
        ? `${keyframes} ${TRANSITION_SIZING_DURATION + TRANSITION_OPACITY_DURATION}ms 0ms step-start reverse backwards`
        : `${keyframes} ${TRANSITION_SIZING_DURATION}ms ${TRANSITION_OPACITY_DURATION}ms step-start normal forwards`;
      let opacityAnimation = isTransitingActivation
        ? `${keyframes2} ${TRANSITION_OPACITY_DURATION}ms ${TRANSITION_SIZING_DURATION + TRANSITION_OPACITY_DURATION}ms ease reverse both`
        : `${keyframes2} ${TRANSITION_OPACITY_DURATION}ms 0ms ease normal both`;
      bodyStyle.animation = `${positionAnimation}, ${opacityAnimation}`;
    } else if (isMounted && !isTransiting && activeIndexOffset !== 0) {
      // deactivated and not animating
      bodyStyle.position = "absolute";
      bodyStyle.opacity = "0";
    }
    if (isTransiting) {
      bodyStyle.transition = cssTransition({}, { width: "step-start", height: "step-start" }, activating);
    }

    let buttonStyle = {};
    if (activeIndexOffset !== 0 && isMounted) {
      buttonStyle.opacity = 0;
      buttonStyle.pointerEvents = "none";
    } else {
      buttonStyle.opacity = 1;
    }
    buttonStyle.transition = cssTransition({ opacity: "ease" }, {}, activating);

    let collapseButtonStyle = buttonStyle;

    result = { dialogStyle, headerStyle, headerTextStyle, buttonStyle, collapseButtonStyle, bodyStyle, isTransiting };
  } else {
    result.dialogStyle = { opacity: 0 };
  }
  return result;
}

function useSimpleTransition(duration, targetElementRef, applyBeforeFn) {
  let [state, setState] = useState("end");
  let prevState = usePreviousValue(state, state);
  let run = () => {
    let newState = state !== "run" ? "run" : state; // if already running then keep running, but reset timeout
    if (state === newState) return;
    setState(newState);
    if (typeof applyBeforeFn === "function") {
      applyBeforeFn();
    }
    // this forces browser to perform reflow; without this, the transition might not get animated
    // because of browser optimizations
    if (targetElementRef?.current) targetElementRef.current.offsetWidth;
  };

  useEffect(() => {
    if (state === "run" && prevState !== "run") {
      let timeout;
      let rafId = requestAnimationFrame(() => {
        timeout = setTimeout(() => setState("end"), duration);
      });
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timeout);
      };
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [state]);

  return [state, run];
}
export { useModalBusActiveAnimation, TRANSITION_OPACITY_DURATION, TRANSITION_SIZING_DURATION };
export default useModalBusActiveAnimation;
