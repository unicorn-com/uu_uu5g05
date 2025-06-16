//@@viewOn:imports
import { createComponent, useRef, useState, useUpdateEffect, Utils, PropTypes, useMemo } from "uu5g05";
import PopoverView from "../_popover/popover-view.js";
import withBottomSheet, { STATIC_TOP_GAP } from "../_internal/with-bottom-sheet.js";
import useSwipe from "../_internal/use-swipe.js";
import ScrollableBox from "../scrollable-box.js";
import Config from "../config/config.js";
import UuGds from "../_internal/gds.js";
//@@viewOff:imports

const WithBottomSheet = withBottomSheet(PopoverView, true);

const MAX_HEIGHT = `calc(${window.innerHeight * 0.6}px - env(safe-area-inset-bottom))`;
const MAX_HEIGHT_EXPANDED = `calc(${window.innerHeight - STATIC_TOP_GAP}px - env(safe-area-inset-bottom))`;

const ANIMATION_LENGTH = Config.MODAL_TRANSITION_DURATION;
const ANIMATIONS = {
  initial: () =>
    Config.Css.keyframes({
      "0%": { transform: "translateY(100%)" },
      "100%": { transform: "translateY(0%)" },
    }),
  collapsed: () =>
    Config.Css.keyframes({
      "0%": { transform: "translateY(0%)" },
      "100%": { transform: "translateY(100%)" },
    }),
};

const Css = {
  main: ({ height, expanded }) => {
    const staticCss = Config.Css.css({
      display: "flex",
      flexDirection: "column",
      transition: `max-height ${ANIMATION_LENGTH}ms linear`,
      "&&": {
        boxShadow: "none",
        paddingLeft: UuGds.SpacingPalette.getValue(["fixed", "e"]),
        paddingRight: UuGds.SpacingPalette.getValue(["fixed", "e"]),
        paddingBottom: UuGds.SpacingPalette.getValue(["fixed", "e"]),
      },
    });

    const dynamicCss = Config.Css.css({
      animation: expanded == null ? ANIMATIONS.collapsed() : ANIMATIONS.initial(),
      animationDuration: `${ANIMATION_LENGTH}ms`, // must be with animation
      animationFillMode: "forwards", // must be with animation

      height,
      "&&": {
        maxHeight: height == null ? (expanded == null ? 0 : expanded ? MAX_HEIGHT_EXPANDED : MAX_HEIGHT) : "none",
      },
    });

    return [staticCss, dynamicCss].join(" ");
  },
  half: () => Config.Css.css({ touchAction: "none", overflow: "hidden" }),
  swipeIndicator: (props) =>
    Config.Css.css({
      padding: UuGds.SpacingPalette.getValue(["fixed", "c"]),
      borderTopLeftRadius: "inherit",
      borderTopRightRadius: "inherit",

      "&::after": {
        content: "' '",
        display: "block",
        ...Css.swipeIndicatorLine(props),
      },
    }),
  swipeIndicatorLine: ({ background = "light" } = {}) => {
    const states = UuGds.getValue(["Shape", "background", background, "dim", "highlighted"]);
    const bgStyles = UuGds.Shape.getStateStyles(states.default, true);
    return {
      height: 4,
      width: 36,
      borderRadius: 2,
      backgroundColor: bgStyles.backgroundColor,
      margin: "0 auto",
    };
  },
};

const PopoverBottomSheet = createComponent({
  //@@viewOn:statics
  uu5Tag: `PopoverBottomSheet`,
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    initialState: PropTypes.oneOf(["half", "full"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    disableOverscroll: true,
    initialState: "half",
    borderRadius: "expressive",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { className, elementRef, children, initialState, maxHeight, ...propsToPass } = props;
    const { onClose } = propsToPass;

    const componentRef = useRef();
    const scrollRef = useRef();

    const [expanded, setExpanded] = useState(initialState === "full");
    useUpdateEffect(() => {
      if (expanded == null) setTimeout(() => typeof onClose === "function" && onClose({}), ANIMATION_LENGTH);
      // scrollTop = 0 because in expanded = false it is not able to scroll and sometimes it could be scrolled down a little
      else if (!expanded) scrollRef.current.scrollTop = 0;
    }, [expanded]);

    const [height, setHeight] = useState(null);

    const swipeData = useRef();
    const swipeRef = useSwipe(
      {
        onSwipeStart(e) {
          const isScrollable = scrollRef.current.scrollHeight > scrollRef.current.clientHeight;
          swipeData.current = {
            y: e.touches[0].pageY,
            isScrollable,
            scrollTop: scrollRef.current.scrollTop,
          };
        },
        onSwipe(e) {
          const y = e.touches[0].pageY;

          const deltaY = swipeData.current.y - e.touches[0].pageY;
          if (scrollRef.current.scrollHeight > scrollRef.current.clientHeight || deltaY < 0) {
            if (expanded && scrollRef.current.scrollHeight > scrollRef.current.clientHeight) {
              // swipe up
              if (deltaY > 0) return;
              // swipe down + is not scrolled top
              else if (deltaY < 0 && swipeData.current.scrollTop !== 0) return;
            }
            setHeight(Math.round((height || componentRef.current.getBoundingClientRect().height) + deltaY));
            swipeData.current.y = y;
          }

          // stop scrolling of background
          if (e.cancelable) e.preventDefault();
        },
        onSwipeEnd(e) {
          if (e.data) {
            if (e.data.yDirection === "up") {
              if (!expanded && swipeData.current.isScrollable) setExpanded(true);
            } else if (e.data.yDirection === "down") {
              if (height != null) {
                if (expanded && initialState === "half" && height > 120) setExpanded(false);
                else setExpanded(null);
              }
            }
          }

          setHeight(null);
          swipeData.current = null;
        },
      },
      80,
    );

    let combinedRefs = Utils.Component.combineRefs(elementRef, componentRef, swipeRef);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    // memoized so that it doesn't get re-rendered during swipe movements
    let usedChildren = useMemo(() => {
      let usedChildren;
      const childIsAFunction = typeof children === "function";
      if (childIsAFunction) {
        usedChildren = children({
          scrollRef,
          state: expanded ? "full" : expanded == null ? "closed" : "half",
          reposition: () => {}, // reposition function is valid only for standard popover
        });
      } else {
        usedChildren = (
          <ScrollableBox
            maxHeight="100%"
            scrollIndicator={{ top: "disappear", bottom: "disappear" }}
            disableOverscroll
            elementRef={scrollRef}
            className={expanded ? undefined : Config.Css.css({ touchAction: "none" })}
          >
            {children}
          </ScrollableBox>
        );
      }
      return usedChildren;
    }, [children, expanded]);

    return (
      <WithBottomSheet
        {...propsToPass}
        className={Utils.Css.joinClassName(className, Css.main({ height, expanded }))}
        elementRef={combinedRefs}
      >
        <div className={Css.swipeIndicator()} />
        {usedChildren}
      </WithBottomSheet>
    );
    //@@viewOff:render
  },
});

export { PopoverBottomSheet };
export default PopoverBottomSheet;
