//@@viewOn:imports
import { createVisualComponent, Utils, useLayoutEffect, useRef, useElementSize, useState, PropTypes } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
const MIN_FONT_SIZE_AFTER_SHRINKING = 15;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () => {
    return Config.Css.css({
      display: "inline-block", // anything but "inline", because useElementSize (ResizeObserver) doesn't work on inline elements
      wordBreak: "break-word",
      maxHeight: "100%",
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function _estimateLineBoxes(inlineBoxList) {
  // there might be multiple inline boxes on a single line, each having different y/height in its rect;
  // we'll assume that there're no special usages / overflows / floats / negative vertical margins
  let lineBoxes = [];
  if (inlineBoxList.length > 0) {
    let sorted = [...inlineBoxList].sort((a, b) => a.top - b.top || b.bottom - a.bottom);
    let curLineBox = { top: sorted[0].top, bottom: sorted[0].bottom };
    for (let i = 1; i < sorted.length; i++) {
      let rect = sorted[i];
      if (rect.top >= curLineBox.bottom) {
        lineBoxes.push(curLineBox);
        curLineBox = { top: rect.top, bottom: rect.bottom };
      } else {
        curLineBox.bottom = Math.max(curLineBox.bottom, rect.bottom);
      }
    }
    lineBoxes.push(curLineBox);
  }
  return lineBoxes;
}
function _findFirstNotFullyVisibleLineBoxRect(sortedRectList, elRect) {
  // binary search for first rect such that its bottom is below elRect.bottom
  let l = 0;
  let r = sortedRectList.length;
  while (l < r) {
    let s = Math.floor((l + r) / 2);
    if (sortedRectList[s].bottom <= elRect.bottom) l = s + 1;
    else r = s;
  }
  let rect = sortedRectList[l];
  let lineBoxCount = l;

  return { rect, lineBoxCount };
}
//@@viewOff:helpers

const AutoFittedText = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AutoFittedText",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    component: PropTypes.string.isRequired,
    textStyle: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { component: Comp, textStyle, children, elementAttrs } = props;

    const ref = useRef();
    const { ref: sizeRef, width, height } = useElementSize();

    const [fitStateClassName, setFitStateClassName] = useState();
    const [internalTooltip, setInternalTooltip] = useState();

    // eslint-disable-next-line uu5/hooks-exhaustive-deps
    useLayoutEffect(() => {
      let el = ref.current;
      if (!el) return;
      function getOverflow(el) {
        let widthOverflow = Math.max(0, el.scrollWidth - el.clientWidth) > 1; // in some cases browser ends up with `scrollHeight === clientHeight + 1` but there's no overflow anywhere...
        let heightOverflow = Math.max(0, el.scrollHeight - el.clientHeight) > 1;
        let isOverflow = widthOverflow || heightOverflow;
        return [!!isOverflow, widthOverflow, heightOverflow];
      }
      let origCssText = el.style.cssText;
      if (fitStateClassName) el.classList.remove(fitStateClassName);

      // measure without any fitting
      let [isOverflow /*, widthOverflow, heightOverflow*/] = getOverflow(el);

      let newFitState = "";
      let newInternalTooltip;
      if (isOverflow) {
        let letterSpacing = -0.5;
        newFitState += `letter-spacing: ${letterSpacing}px;`;
        el.style.cssText = origCssText + ";" + newFitState;
        [isOverflow] = getOverflow(el);

        // NOTE If we fit now, we could try another (increased) letter-spacing-s instead of always trying only -0.5.
        // But that could mean that there would be more variability in visual of components so maybe don't do that.
        if (isOverflow) {
          let computedStyle = getComputedStyle(el);
          let fontSize = parseFloat(computedStyle.fontSize);
          if (fontSize > MIN_FONT_SIZE_AFTER_SHRINKING) {
            let fontSizeReduction = Math.max(0.8, MIN_FONT_SIZE_AFTER_SHRINKING / fontSize);
            let lineHeight = parseFloat(computedStyle.lineHeight);
            newFitState += `font-size: ${fontSizeReduction * fontSize}px; line-height: ${
              fontSizeReduction * lineHeight
            }px;`;
            el.style.cssText = origCssText + ";" + newFitState;
            [isOverflow] = getOverflow(el);
          }

          if (isOverflow) {
            // try to figure out exactly where the last visible line ends (and compute bottom offset which needs
            // to be masked out so that next line's characters do not intrude into visible area; masking is done by
            // using transparent border-bottom)
            let visibleRowCount;
            let bottomMaskOffset;
            let computedStyle = getComputedStyle(el);
            let hasExactLineHeight = computedStyle.lineHeight.endsWith("px");
            if (!hasExactLineHeight) {
              // figure out last fully visible row (index) from lineboxes
              let range = document.createRange();
              range.selectNodeContents(el);
              let inlineBoxList = range.getClientRects();
              let lineBoxList = _estimateLineBoxes(inlineBoxList);
              let elRect = el.getBoundingClientRect();
              let { rect, lineBoxCount } = _findFirstNotFullyVisibleLineBoxRect(lineBoxList, elRect);
              visibleRowCount = lineBoxCount;
              bottomMaskOffset = rect ? Math.max(0, elRect.bottom - rect.top) : undefined;
            } else {
              // figure out last fully visible row (index) by simple division based on lineHeight
              let lineHeight = parseFloat(computedStyle.lineHeight);
              let visibleContentHeight =
                el.clientHeight - parseFloat(computedStyle.paddingTop) - parseFloat(computedStyle.paddingBottom);
              visibleRowCount = Math.floor(visibleContentHeight / lineHeight);
              bottomMaskOffset = visibleContentHeight - visibleRowCount * lineHeight;
            }
            if (visibleRowCount < 1) {
              // e.g. component's height is too small so not even single row is fully visible => let the partially
              // visible row remain visible
              visibleRowCount = 1;
              bottomMaskOffset = undefined;
            }

            let isInline = /inline/.test(computedStyle.display);
            if (visibleRowCount === 1 && computedStyle.whiteSpace === "nowrap") {
              // if using `white-space: nowrap` then force not using -webkit-line-clamp because in Chrome this combo doesn't work
              // (and prefer white-space because for some reason user sees more text when ellipsis is added by this instead of -webkit-line-clamp)
              newFitState += `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; -webkit-line-clamp: initial; display: ${
                isInline ? "inline-block" : "block"
              }; -webkit-box-orient: initial;`;
            } else {
              newFitState += `overflow: hidden; text-overflow: ellipsis; -webkit-line-clamp: ${visibleRowCount}; display: -webkit-${
                isInline ? "inline-" : ""
              }box; -webkit-box-orient: vertical;`;
            }
            if (bottomMaskOffset != null) {
              newFitState += `border-bottom: ${bottomMaskOffset}px solid transparent; margin-bottom: ${-bottomMaskOffset}px;`;
            }
            newInternalTooltip = el.textContent;
          }
        }
        el.style.cssText = origCssText;
      }

      if (fitStateClassName) el.classList.add(fitStateClassName);
      // class name has increased specificity so that we have:
      // our's default (not fitted) -> developer's (not fitted, specificity 1 or 2) -> our's (fitted, specificity 3)
      let newFitStateClassName = newFitState ? Config.Css.css(`&&& { ${newFitState} }`) : undefined;
      if (newFitStateClassName !== fitStateClassName) setFitStateClassName(newFitStateClassName);
      if (newInternalTooltip !== internalTooltip) setInternalTooltip(newInternalTooltip);
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [children, width, height]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const usedTooltip = elementAttrs?.title !== undefined ? elementAttrs?.title : internalTooltip;

    let renderResult;
    if (typeof children === "function") {
      // TODO If needed, we can send also refit() fn into FAAC.
      renderResult = children({
        style: textStyle,
        elementRef: Utils.Component.combineRefs(ref, sizeRef),
        elementAttrs: { title: usedTooltip },
      });
    } else {
      const attrs = Utils.VisualComponent.getAttrs(
        { ...props, elementAttrs: { ...elementAttrs, title: usedTooltip } },
        Utils.Css.joinClassName(Css.main(props), Config.Css.css(textStyle), fitStateClassName),
      );
      const elementRef = Utils.Component.combineRefs(ref, sizeRef, attrs.ref);
      renderResult = (
        <Comp {...attrs} ref={elementRef}>
          {children}
        </Comp>
      );
    }

    return renderResult;
    //@@viewOff:render
  },
});

//@@viewOn:helpers

//@@viewOff:helpers

export { AutoFittedText };
export default AutoFittedText;
