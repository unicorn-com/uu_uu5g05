//@@viewOn:imports
import { useLayoutEffect, useRef, useState, useMemo } from "../hooks/react-hooks.js";
import Config from "../config/config.js";
import BackgroundProvider from "../providers/background-provider.js";
import * as Utils from "../utils.js";
import createComponent from "../create-component/create-component.js";
import useBackground from "../hooks/use-background.js";
import useDevice from "../hooks/use-device.js";
import useMemoObject from "../hooks/use-memo-object.js";
import useEvent from "../hooks/use-event.js";
import useAppBackground from "../hooks/use-app-background.js";
import useElementSizeEvent from "../hooks/use-element-size-event.js";
import Uu5Loader from "../utils/uu5-loader.js";
import UtilsObject from "../utils/object.js";
//@@viewOff:imports

//@@viewOn:constants
const BORDER_SEPARATOR_WIDTH = 1;
const BOX_SHADOW_TRANSITION_LENGTH = 100;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ order, isFirst, scopeItemData, index, background, shapeStyles, UuGds }) => {
    const borderColor = UuGds?.getValue(["Shape", "line", background, "building", "subdued"]).default.colors?.border;
    const elevation = UuGds?.EffectPalette.getValue(["elevationUpper"]);
    return Config.Css.css({
      // NOTE We're using bigger specificity because our Emotion classes generation order doesn't follow React hierarchy and
      // all components will end up using <style> element which is later in <head> than uu5g05's <style> element (because
      // the components are in libraries that depend on uu5g05 and our <style> elements follow the loading order).
      // Shape styles use normal specificity as they should set just a default background (which is fine to override by the wrapped component).
      ...shapeStyles,
      "&&": {
        position: "fixed",
        insetInline: 0,
        // first items have bigger zIndex so that when they start opening they'll be above the box-shadow
        // (and when they're disappearing, the box-shadow of next item starts to shine through)
        zIndex: 890 - index, // less than useStickyTop
        order,
        borderTop:
          scopeItemData?.height > BORDER_SEPARATOR_WIDTH && borderColor
            ? BORDER_SEPARATOR_WIDTH + "px solid " + borderColor
            : undefined,
        boxShadow: elevation ? getBoxShadowValue(elevation, scopeItemData?.height > BORDER_SEPARATOR_WIDTH) : undefined,
        clipPath: elevation ? `inset(${-elevation.blurRadius}px 0 0 0)` : undefined, // show box-shadow only at upper edge
        transition: isFirst ? `box-shadow linear ${BOX_SHADOW_TRANSITION_LENGTH}ms` : undefined,
      },
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getBoxShadowValue({ inset, offsetX, offsetY, blurRadius, spreadRadius, color }, useColor) {
  return `${inset ? "inset" : ""} ${offsetX}px ${offsetY}px ${blurRadius}px ${spreadRadius}px ${useColor ? color : "transparent"}`;
}

function getShapeStyles({ background, colorScheme, significance }, UuGds) {
  if (!UuGds) return [];
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

const FIXED_CB_CONTAIN = new Set(["layout", "paint", "strict", "content"]);
function getContainingBlockForPositionFixed(el) {
  el = el.parentNode;
  while (el && el.tagName) {
    let cs = getComputedStyle(el);
    if (
      cs.transform !== "none" ||
      cs.filter !== "none" ||
      cs.backdropFilter !== "none" ||
      cs.perspective !== "none" ||
      FIXED_CB_CONTAIN.has(cs.contain) ||
      cs.containerType !== "normal" ||
      // NOTE Not checking will-change, we'll assume that such element has transform / filter / something.
      cs.contentVisibility === "auto"
    ) {
      return el;
    }
    el = el.parentNode;
  }
}

function useMobileFixedBottomStyle() {
  const { platform } = useDevice();
  const isIos = platform === "ios";
  const DEFAULT_BOTTOM = "env(safe-area-inset-bottom, 0px)";

  const bottom = `var(--uu5-mobile-fixed-bottom, ${isIos ? "auto" : DEFAULT_BOTTOM})`;
  const top = `var(--uu5-mobile-fixed-top, ${isIos ? "100vh" : "auto"})`;
  const transform = `var(--uu5-mobile-fixed-transform,  ${isIos ? "translateY(-100%)" : "none"})`;

  let lastScrollRef = useRef(0);
  let debouncedRef = useRef();
  if (isIos && !debouncedRef.current) {
    // debounced due to iOS bounce animation when scrolling to the end/start of an element, which changes
    // scroll direction and generally worsens issues described below
    debouncedRef.current = Utils.Function.debounce(function (fixedBottomValue, fixedTopValue) {
      // use top-based positioning for iOS after scrolling ends because it works better
      // when near the end of the page as compared to using bottom-based positioning
      document.body.style.setProperty("--uu5-mobile-fixed-bottom", "auto");
      document.body.style.setProperty("--uu5-mobile-fixed-top", `calc(${fixedTopValue}px - ${DEFAULT_BOTTOM})`);
      document.body.style.setProperty("--uu5-mobile-fixed-transform", "translateY(-100%)");
    }, 500);
  }
  useLayoutEffect(() => {
    let recalculate = () => {
      // NOTE We could always use newBottom, but there is visual delay before browser paints it
      // so user touches screen, scrolls a bit and the component gets scrolled a bit too and after
      // a few milliseconds it goes back to the proper position. Therefore we'll guess when the keyboard
      // is likely opened and:
      // 1. If keyboard is closed, we can use fixed position with `bottom: env(safe-area-inset-bottom, 0px)`
      //    which in this case always sticks to the proper position.
      // 2. If keyboard is opened, fixed position bottom must be recalculated on each visualViewport scroll/resize
      //    (and there is the aforementioned visual glitch).
      // TODO Solve with VirtualKeyboard API when it becomes stable - https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API
      let newBottom = window.innerHeight - visualViewport.height - visualViewport.offsetTop;
      let isKeyboardLikelyOpened = innerHeight - visualViewport.height > 200;
      let finalBottomValue =
        !isKeyboardLikelyOpened || Math.abs(newBottom) < 1
          ? DEFAULT_BOTTOM // reserve for overlaid mobile native bar (with square, circle and triangle buttons)
          : `max(${newBottom}px, ${DEFAULT_BOTTOM})`;

      // NOTE iOS has bugs related to visualViewport when keyboard is opened, e.g. it doesn't trigger "scroll"
      // event immediately after slight scroll but only after certain threshold (it will however trigger it
      // after user ends touch). It also provides incomplete info while scroll is ongoing...
      let finalTopValue = visualViewport.height + visualViewport.offsetTop;
      if (isIos) {
        let direction = pageYOffset - lastScrollRef.current > 0 ? "down" : "up";
        debouncedRef.current(finalBottomValue, finalTopValue);
        finalBottomValue = direction === "up" ? window.innerHeight - visualViewport.height + "px" : DEFAULT_BOTTOM;
      }
      if (!isIos || pageYOffset - lastScrollRef.current !== 0) {
        // use bottom-based positioning even for iOS if scrolling
        if (document.body.style.getPropertyValue("--uu5-mobile-fixed-bottom") !== finalBottomValue) {
          document.body.style.setProperty("--uu5-mobile-fixed-bottom", finalBottomValue);
        }
        let usedTopValue = "auto";
        if (document.body.style.getPropertyValue("--uu5-mobile-fixed-top") !== usedTopValue) {
          document.body.style.setProperty("--uu5-mobile-fixed-top", usedTopValue);
        }
        let usedTransform = "none";
        if (document.body.style.getPropertyValue("--uu5-mobile-fixed-transform") !== usedTransform) {
          document.body.style.setProperty("--uu5-mobile-fixed-transform", usedTransform);
        }

        lastScrollRef.current = pageYOffset;
      }
    };
    recalculate();

    addEventListener("resize", recalculate, true);
    visualViewport.addEventListener("resize", recalculate, true);
    visualViewport.addEventListener("scroll", recalculate, true);
    return () => {
      removeEventListener("resize", recalculate, true);
      visualViewport.addEventListener("resize", recalculate, true);
      visualViewport.addEventListener("scroll", recalculate, true);
    };
  }, [isIos]);

  let style = { bottom, top, transform };
  return { style };
}

const scopeMap = new Map();
function updateScopeMapItem(scope, id, changes, trigger, createIfMissing = false) {
  let scopeData = scopeMap.get(scope);
  let itemIndex = scopeData ? scopeData.itemList.findIndex((it) => it.id === id) : -1;
  if (changes === null && itemIndex !== -1) {
    scopeData.itemList.splice(itemIndex, 1);
    if (scopeData.itemList.length === 0) scopeMap.delete(scope);
  } else if (changes) {
    if (itemIndex === -1) {
      if (!scopeData) {
        if (createIfMissing) scopeMap.set(scope, (scopeData = { itemList: [] }));
        else return; // do nothing else (we might have been called due to debounce after unmount / between unmount and async unmount cleanup)
      }
      scopeData.itemList.push({ id, ...changes });
    } else {
      Object.assign(scopeData.itemList[itemIndex], changes);
    }
    scopeData.itemList.sort((a, b) => a.order - b.order); // lower order first, then stable
  }
  trigger({ scope }); // force update of all registered items in this scope
}

let idCounter = 0;
function useViewportStickyBottomScopeData({ registerData } = {}) {
  const [id] = useState(registerData ? () => idCounter++ : -1);
  const scopeRef = useRef();

  const [, setState] = useState();
  const forceUpdate = () => setState({});
  const trigger = useEvent("Uu5.withViewportStickyBottom/scopeDataChange", (e) => {
    if (e.scope !== scopeRef.current) return;
    forceUpdate();
  });

  // useRef for referential stability of the fn
  const elementRef = useRef((el) => {
    if (!el) return;
    scopeRef.current = getContainingBlockForPositionFixed(el) || document.body;
    if (registerData) updateScopeMapItem(scopeRef.current, id, registerData, trigger, true);
  }).current;

  useLayoutEffect(() => {
    return () => updateScopeMapItem(scopeRef.current, id, null, trigger);
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, []);

  const isInRoot = scopeRef.current === document.body;
  const scopeData = scopeMap.get(scopeRef.current);
  const scopeItemData = scopeData?.itemList.find((it) => it.id === id);

  function updateScopeData(changes) {
    if (scopeRef.current) updateScopeMapItem(scopeRef.current, id, changes, trigger);
  }

  return { elementRef, isInRoot, scopeData, scopeItemData, updateScopeData };
}

//@@viewOff:helpers

function withViewportStickyBottom(Component, { order = 0 } = {}) {
  const ResultComponent = createComponent({
    uu5Tag: `withViewportStickyBottom(${Component.uu5Tag})`,
    render(props) {
      const { elementRef, isInRoot, scopeData, scopeItemData, updateScopeData } = useViewportStickyBottomScopeData({
        registerData: { order },
      });

      const index = scopeItemData ? scopeData.itemList.indexOf(scopeItemData) : -1;
      const bottom =
        index === -1 ? 0 : (scopeData?.itemList.slice(index + 1).reduce((sum, it) => sum + it.height || 0, 0) ?? 0);
      const { style: mobileStyle } = useMobileFixedBottomStyle();
      const isFirst =
        scopeItemData?.height > BORDER_SEPARATOR_WIDTH &&
        scopeData.itemList.slice(0, index).every((it) => (it.height || 0) <= BORDER_SEPARATOR_WIDTH);

      const { ref: sizeRef } = useElementSizeEvent(({ height }) => updateScopeData({ height }), { interval: 0 });

      const Uu5Elements = Uu5Loader.get("uu5g05-elements", import.meta.url);
      const UuGds = Uu5Elements?.UuGds;
      const [appBackground] = useAppBackground();
      const ctxBackground = useBackground();
      // NOTE We would optimally like to get GDS "background" of our scope element (DOM "containing block" of this fixed-positioned portal)
      // but we currently can just estimate it using app/ctx backgrounds.
      const background = isInRoot ? appBackground : ctxBackground;
      const [shapeStyles, gdsBackground] = getShapeStyles(
        { background, colorScheme: "building", significance: "common" },
        UuGds,
      );

      // memoized component because we use immediate height observing (interval=0) for nicer box-shadow behaviour
      const usedClassName = Utils.Css.joinClassName(
        props.className,
        Css.main({ order, isFirst, scopeItemData, index, background, shapeStyles, UuGds }),
      );
      const usedElementRef = Utils.Component.combineRefs(elementRef, sizeRef, props.elementRef);
      const usedStyle = useMemoObject(
        { ...props.style, ...mobileStyle, bottom: `calc(${bottom}px + ${mobileStyle.bottom || "0px"})` },
        UtilsObject.shallowEqual,
      );
      const component = useMemo(
        () => <Component {...props} className={usedClassName} elementRef={usedElementRef} style={usedStyle} />,
        [props, usedClassName, usedElementRef, usedStyle],
      );
      return <BackgroundProvider background={gdsBackground ?? background}>{component}</BackgroundProvider>;
    },
  });

  Utils.Component.mergeStatics(ResultComponent, Component);
  return ResultComponent;
}

export { withViewportStickyBottom, useViewportStickyBottomScopeData as _useViewportStickyBottomScopeData };
export default withViewportStickyBottom;
