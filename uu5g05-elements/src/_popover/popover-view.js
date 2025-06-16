//@@viewOn:imports
import {
  createVisualComponent,
  useEffect,
  useRef,
  useEvent,
  PropTypes,
  Utils,
  BackgroundProvider,
  useAppBackground,
  useLayoutEffect,
  useState,
  usePreviousValue,
  useMemoObject,
  useMemo,
} from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import ScrollableBox from "../scrollable-box.js";
import Tools from "../_internal/tools.js";
//@@viewOff:imports

export const ARROW_HALF_SIZE = 8;

const Css = {
  scrollableBox: ({ padding }) => {
    return Config.Css.css({
      padding,
      display: "inherit",
      minHeight: "inherit",
      maxHeight: "inherit",
      minWidth: "inherit",
      maxWidth: "inherit",
      borderRadius: "inherit",
      flexDirection: "column",
    });
  },
  arrow: ({ position = "", backgroundColor, arrowStyle, borderRadius }) => {
    const [popoverPos] = position.split("-");
    const borderSide = `border${popoverPos.charAt(0).toUpperCase() + popoverPos.slice(1)}Color`;

    return Config.Css.css({
      width: 0,
      height: 0,
      display: "inline-block",
      borderWidth: ARROW_HALF_SIZE,
      borderColor: "transparent",
      borderStyle: "solid",
      pointerEvents: "none",
      [borderSide]: backgroundColor,
      ...arrowStyle,
    });
  },
};

function getShapeStyles({ background, colorScheme, significance }) {
  const states = UuGds.getValue(["Shape", "overlay", background, colorScheme, significance]);
  const gdsBackground = states.default.colors?.gdsBackground;
  const styles = {
    ...UuGds.Shape.getStateStyles(withoutGdsEffect(states.default), true),

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": {
        ...UuGds.Shape.getStateStyles(withoutGdsEffect(states.saving), true),
      },
    },

    // for demo
    "&.saving": {
      ...UuGds.Shape.getStateStyles(withoutGdsEffect(states.saving), true),
    },
  };
  return [styles, gdsBackground];
}

function withoutGdsEffect(state) {
  if (!state?.effect) return state;
  let { effect, ...restState } = state;
  return restState;
}

function getDropShadow({ background, colorScheme, significance }) {
  const states = UuGds.getValue(["Shape", "overlay", background, colorScheme, significance]);
  const styles = {
    ...getDropShadowFilterStyle(states.default?.effect),

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": {
        ...getDropShadowFilterStyle(states.saving?.effect),
      },
    },

    // for demo
    "&.saving": {
      ...getDropShadowFilterStyle(states.saving?.effect),
    },
  };
  return styles;
}
function getDropShadowFilterStyle(gdsEffect) {
  if (!gdsEffect) return;
  const { offsetX, offsetY, blurRadius, color } = gdsEffect;
  return {
    filter: `drop-shadow(${offsetX}px ${offsetY}px ${blurRadius / 2}px ${color})`,
  };
}

const PopoverView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PopoverView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onClose: PropTypes.func,
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
    borderRadius: PropTypes.oneOf(["none", "elementary", "moderate", "expressive"]),
    relative: PropTypes.bool,
    maxHeight: PropTypes.unit,
    arrowStyle: PropTypes.object,
    position: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onClose: undefined,
    colorScheme: "building",
    significance: "common",
    borderRadius: "moderate",
    relative: false,
    maxHeight: undefined,
    arrowStyle: undefined,
    position: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    let {
      onClose,
      colorScheme,
      significance,
      borderRadius,
      relative,
      maxHeight,
      arrowStyle,
      position,
      elementAttrs: propsElementAttrs,
      children,
      background: propsBackground, // deprecated
      elementRef,
      ...otherProps
    } = props;

    const popoverRef = useRef();

    const closeElementAttrs = useClose(popoverRef, onClose);
    const usedElementAttrs = { ...propsElementAttrs };
    for (let [k, v] of Object.entries(closeElementAttrs)) {
      if (typeof v === "function") {
        usedElementAttrs[k] = Tools.combineListeners(usedElementAttrs[k], v);
      } else {
        usedElementAttrs[k] = v;
      }
    }

    const [appBackground] = useAppBackground();
    const background = props.background ?? appBackground; // TODO Next major - remove props.background.
    const [shapeStyles, gdsBackground] = getShapeStyles({ ...props, background });
    shapeStyles.borderRadius = UuGds.getValue(["RadiusPalette", "box", borderRadius]);

    const hasWrapper = !!maxHeight;
    const className = Utils.Css.joinClassName(Config.Css.css(shapeStyles), props.className);

    let { elementAttrs, componentProps } = Utils.VisualComponent.splitProps(
      {
        ...otherProps,
        elementAttrs: usedElementAttrs,
        elementRef: Utils.Component.combineRefs(elementRef, popoverRef),
      },
      className,
    );

    // transfer padding into nested div when using wrapper
    let [padding, setPadding] = useState();
    const prevClassName = usePreviousValue(props.className, props.className);
    const prevStyle = usePreviousValue(props.style, props.style);
    if ((prevClassName !== props.className || prevStyle !== props.style) && padding !== undefined) {
      padding = undefined;
      setPadding(padding);
    }
    useLayoutEffect(() => {
      if (hasWrapper) {
        let computedStyle = getComputedStyle(popoverRef.current);
        let newPadding = computedStyle.padding;
        if (newPadding === "0px" || newPadding === "0" || !newPadding) newPadding = undefined;
        if (newPadding !== padding) setPadding(newPadding);
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [props.className, props.style, hasWrapper]);

    componentProps = useMemoObject(componentProps, Utils.Object.shallowEqual);
    let content = useMemo(
      () =>
        hasWrapper ? (
          <ScrollableBox
            {...componentProps}
            className={Css.scrollableBox({ padding })}
            maxHeight={maxHeight}
            scrollIndicator={"disappear"}
          >
            {children}
          </ScrollableBox>
        ) : (
          children
        ),
      [children, componentProps, hasWrapper, maxHeight, padding],
    );
    let popoverBody = hasWrapper ? (
      // NOTE We need this extra <div> because of "disappear" effect (without the <div> the element's background would
      // disappear too, i.e. stuff under Popover would shine through).
      <div
        {...elementAttrs}
        style={{ ...elementAttrs.style, padding: padding !== undefined ? 0 : elementAttrs.style?.padding }}
      >
        {content}
      </div>
    ) : (
      <div {...elementAttrs}>{content}</div>
    );
    if (arrowStyle) {
      // arrow cannot be inside of ScrollableBox => move it outside as a standalone div
      popoverBody = (
        <>
          {popoverBody}
          <div
            className={Css.arrow({
              position,
              backgroundColor: shapeStyles.backgroundColor,
              arrowStyle,
              borderRadius: +shapeStyles.borderRadius,
            })}
          />
        </>
      );
    }

    return <BackgroundProvider background={gdsBackground ?? appBackground}>{popoverBody}</BackgroundProvider>;
  },
});

function useClose(ref, onClose) {
  // flag whether click handler for closing is active (popover might have been opened during click event
  // and since we add our own global click handler, we want to skip the opening one)
  const interactiveRef = useRef(false);
  useEffect(() => {
    let rafId = requestAnimationFrame(() => (interactiveRef.current = true));
    return () => cancelAnimationFrame(rafId);
  }, []);

  const lastMouseDownTargetRef = useRef();
  useEvent("mousedown", (e) => (lastMouseDownTargetRef.current = e.target), window, { capture: true });

  const viewportWidth = window.innerWidth;

  function closePopup(event) {
    if (!interactiveRef.current) return;

    // because scrolling up on mobile show browser panel and change height of viewport, but popover should not close
    if (event.type === "resize" && viewportWidth === window.innerWidth) return;

    const popoverElement = ref.current;
    if (
      typeof onClose === "function" &&
      (event.target === window || !popoverElement.contains(event.target)) &&
      (!(event.target instanceof HTMLElement) || document.contains(event.target))
    ) {
      let looksLikeSelect = event.type === "click" && lastMouseDownTargetRef.current !== event.target;
      if (!looksLikeSelect) onClose(event);
    }
  }

  // NOTE Using "click" event for closing instead of (probably more appropriate) "mousedown".
  // With "mousedown" there was a problem when clicking an item in a submenu (2nd Popover) - submenu got unmounted
  // before click because during "mousedown" the 1st Popover detected that you're clicking outside of it so it got closed
  // (and if we expand this detection to include submenu's Popover, then the 1st Popover won't close and click will
  // be properly fired on 2nd Popover but afterwards the 1st Popover wouldn't close, because when triggerring props.onClick
  // on 2nd Popover, only current Popover (2nd) gets closed).

  const elementAttrs = {
    ...useEventIfNotFromNestedComponent("click", closePopup),
    ...useEventIfNotFromNestedComponent("contextmenu", closePopup, "onContextMenu"),
  };
  useEvent("resize", closePopup, window);
  useEvent("orientationchange", closePopup, window);

  return elementAttrs;
}

/**
 * Calls handler() if event happenned outside of current component. Returns elementAttrs that must
 * be passed onto component's root element.
 *
 * NOTE Handler can be called with event that is already processed (no longer stoppable / preventable).
 *
 * @param {*} eventName
 * @param {*} handler
 * @param {*} reactEventPropName
 * @param {*} triggerEvenIfEventPropagationStopped
 * @returns
 */
function useEventIfNotFromNestedComponent(
  eventName,
  handler,
  reactEventPropName = "on" + eventName.replace(/^./, (m) => m.toUpperCase()),
  triggerEvenIfEventPropagationStopped = true,
) {
  // NOTE The event propagation, e.g. "click":
  // 1. window, capturing phase (handleNativeEventCapture), cleanup, mark event as outside of component
  // 2.   React, capturing phase (handleReactEventCapture), mark event as inside of component, plan flag cleanup
  // 3.   React, bubbling phase (not handled here)
  // 4. window, bubbling phase (handleNativeEvent), call handler() if event marked as outside
  // 5. planned cleanups && trigger if event propagation got stopped
  // - steps 2 and 3 can be left out (e.g. click outside of component)
  // - steps 2+3+4 or 3+4 or 4 can be left out due to stopPropagation:
  //   - step 4 left out - we'll call handler only if 2+3 got skipped due to click outside (and triggerEvenIfEventPropagationStopped must be true)
  //   - steps 3+4 left out - handler() not called
  //   - steps 2+3+4 left out - currently, we'll handle this as click outside of component, i.e. handler() called (only if triggerEvenIfEventPropagationStopped)
  const isFromNestedComponentRef = useRef();
  const isFromNestedComponentCleanupTimeoutRef = useRef();
  const triggerTimeoutRef = useRef();
  useEffect(() => {
    return () => {
      clearTimeout(isFromNestedComponentCleanupTimeoutRef.current);
      clearTimeout(triggerTimeoutRef.current);
    };
  }, []);

  function handleNativeEventCapture(e) {
    isFromNestedComponentRef.current = false;
    clearTimeout(isFromNestedComponentCleanupTimeoutRef.current);

    clearTimeout(triggerTimeoutRef.current);
    if (triggerEvenIfEventPropagationStopped) {
      triggerTimeoutRef.current = setTimeout(() => {
        let wasFromNestedComponent = isFromNestedComponentRef.current;
        isFromNestedComponentRef.current = false;
        clearTimeout(isFromNestedComponentCleanupTimeoutRef.current);
        if (!wasFromNestedComponent) {
          handler?.(e);
        }
      }, 0);
    }
  }

  function handleReactEventCapture(e) {
    isFromNestedComponentRef.current = true;
    clearTimeout(isFromNestedComponentCleanupTimeoutRef.current);
    isFromNestedComponentCleanupTimeoutRef.current = setTimeout(() => {
      isFromNestedComponentRef.current = false;
    }, 0);
  }

  function handleNativeEvent(e) {
    let wasFromNestedComponent = isFromNestedComponentRef.current;
    isFromNestedComponentRef.current = false;
    clearTimeout(isFromNestedComponentCleanupTimeoutRef.current);

    clearTimeout(triggerTimeoutRef.current);

    if (!wasFromNestedComponent) {
      handler?.(e);
    }
  }

  useEvent(eventName, handleNativeEvent, window);
  useEvent(eventName, handleNativeEventCapture, window, { capture: true });

  const elementAttrs = {
    [`${reactEventPropName}Capture`]: handleReactEventCapture,
  };
  return elementAttrs;
}

export { PopoverView, getDropShadow };
export default PopoverView;
