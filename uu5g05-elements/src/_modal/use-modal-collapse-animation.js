//@@viewOn:imports
import { useDevice, usePreviousValue, useRef } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

function useModalCollapseAnimation(collapsed, metrics) {
  const { isMobileOrTablet } = useDevice();
  let prevCollapse = usePreviousValue(collapsed, collapsed);
  let collapsing = collapsed !== prevCollapse && collapsed;
  let uncollapsing = collapsed !== prevCollapse && !collapsed;

  let lastResultRef = useRef({});
  let result = metrics ? lastResultRef.current : {};
  if (metrics && (collapsing || uncollapsing)) {
    let {
      dialogRect,
      headerRect,
      headerCollapsedWidth,
      actionGroupMarginRightCollapseStart,
      anchorGroupMarginRightCollapseEnd,
      actionGroupWidth,
      actionGroupInitialMarginLeft,
      actionGroupRemovableMarginLeft,
      collapseButtonOffsetRight,
      dialogParentRect,
    } = metrics;
    let reverse = uncollapsing;

    // 0s
    let opacityKeyframes = Config.Css.keyframes({
      "0%": { opacity: 1 },
      "100%": { opacity: 0 },
      // NOTE We need keyframes to have different names (normal vs. reverse), because simply changing
      // animation-direction from "normal" to "reverse" wouldn't run animation again (we would have to
      // keep count of already played animation-iteration-count for each animation/element and increase it
      // when we would want to play the animation again; switching between 2 animation keyframes names is simpler).
      //   => add ignored rule to have different keyframes name
      "101%": reverse ? { content: '"-"' } : undefined,
    });

    // after opacity
    let dialogKeyframes;
    if (isMobileOrTablet) {
      dialogKeyframes = Config.Css.keyframes({
        "0%": {
          height: dialogRect.height,
        },
        "100%": {
          height: headerRect.height,
          overflow: "hidden",
        },
        "101%": reverse ? { content: '"-"' } : undefined,
      });
    } else {
      dialogKeyframes = Config.Css.keyframes({
        "0%": {
          marginRight: dialogParentRect.right - dialogRect.right,
          width: dialogRect.width,
          height: dialogRect.height,
        },
        "100%": {
          marginRight: dialogParentRect.right - dialogRect.right + collapseButtonOffsetRight,
          width: headerCollapsedWidth,
          height: headerRect.height,
          overflow: "hidden",
        },
        "101%": reverse ? { content: '"-"' } : undefined,
      });
    }

    let marginLeftEnd = actionGroupInitialMarginLeft - actionGroupRemovableMarginLeft;
    if (isMobileOrTablet) {
      marginLeftEnd = actionGroupInitialMarginLeft + collapseButtonOffsetRight;
    }
    let actionGroupKeyframes = Config.Css.keyframes({
      "0%": {
        marginRight: actionGroupMarginRightCollapseStart,
        marginLeft: actionGroupInitialMarginLeft,
        width: actionGroupWidth,
      },
      "100%": {
        marginRight: anchorGroupMarginRightCollapseEnd,
        marginLeft: marginLeftEnd,
        width: actionGroupWidth,
        pointerEvents: "none",
      },
      "101%": reverse ? { content: '"-"' } : undefined,
    });

    let buttonNotClickableKeyframes = Config.Css.keyframes({
      "0%": { pointerEvents: "none" },
      "100%": { pointerEvents: "none" },
      "101%": reverse ? { content: '"-"' } : undefined,
    });
    let contentExtractionKeyframes = Config.Css.keyframes({
      "0%": {
        opacity: 1,
        position: "static",
        pointerEvents: "all",
        animationTimingFunction: "step-start",
        width: dialogRect.width,
        height: dialogRect.height,
      },
      "100%": {
        opacity: 0,
        position: "absolute",
        pointerEvents: "none",
        animationTimingFunction: "step-start",
        width: dialogRect.width,
        height: dialogRect.height,
      },
      "101%": reverse ? { content: '"-"' } : undefined,
    });

    let opacityDuration = Config.MODAL_TRANSITION_DURATION / 6;
    let sizingDuration = 5 * opacityDuration;

    let durations = [opacityDuration, sizingDuration];
    if (reverse) durations = durations.reverse();
    let delays = [];
    for (let i = 0; i < durations.length; i++) delays[i] = delays[i - 1] + durations[i - 1] || 0;
    let direction = reverse ? "reverse" : "normal";
    let fillMode = reverse ? "backwards" : "forwards";
    let cssAnim = (...keyframes) => {
      if (reverse) keyframes = keyframes.reverse();
      return keyframes
        .map((name, i) => name && `${name} ${durations[i]}ms ${delays[i]}ms ${fillMode} ${direction}`)
        .filter(Boolean)
        .join(", ");
    };

    let dialogStyle = { animation: cssAnim(null, dialogKeyframes) };
    let buttonStyle = { animation: cssAnim(opacityKeyframes, buttonNotClickableKeyframes) };
    let collapseButtonStyle = { pointerEvents: "all" };
    let bodyStyle = { animation: cssAnim(opacityKeyframes, contentExtractionKeyframes) };
    let actionGroupStyle = { animation: cssAnim(null, actionGroupKeyframes) };
    result = { dialogStyle, actionGroupStyle, buttonStyle, collapseButtonStyle, bodyStyle };
  }

  lastResultRef.current = result;
  return result;
}

export { useModalCollapseAnimation };
export default useModalCollapseAnimation;
