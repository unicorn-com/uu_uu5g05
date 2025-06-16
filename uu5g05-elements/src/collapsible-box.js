//@@viewOn:imports
import {
  createVisualComponent,
  PropTypes,
  usePreviousValue,
  useRef,
  useState,
  Utils,
  _CollapseAnimationProvider as CollapseAnimationProvider,
  useDevice,
} from "uu5g05";
import Config from "./config/config.js";
import useTransition from "./_internal/use-transition.js";
//@@viewOff:imports

const TRANSITION_DURATION = Config.COLLAPSIBLE_BOX_TRANSITION_DURATION;
const TRANSITION = `height ${TRANSITION_DURATION}ms ease-out`;

const Css = {
  main() {
    return Config.Css.css({
      transition: TRANSITION,
    });
  },
};

//@@viewOn:helpers
function useCollapseTransition(collapsed) {
  const ref = useRef();
  const [state, run] = useTransition(TRANSITION_DURATION, ref);
  const [direction, setDirection] = useState(collapsed ? "close" : "open");

  const prevCollapsed = usePreviousValue(collapsed, collapsed);
  if (collapsed !== prevCollapsed) {
    run();
    let newDirection = collapsed ? "close" : "open";
    if (direction !== newDirection) setDirection(newDirection);
  }

  // measure element when starting to open/close
  const prevState = usePreviousValue(state, state);
  const contentHeightRef = useRef();
  if (
    (direction === "close" && state === "init") ||
    // if opening, read scrollHeight only if we don't have remembered height from previous close
    // (because in flex containers the scrollHeight might be smaller than intended due to flexing and us having
    // height 0px at this moment)
    (direction === "open" && state === "run" && prevState === "init" && !contentHeightRef.current)
  ) {
    contentHeightRef.current = ref.current?.[direction === "close" ? "offsetHeight" : "scrollHeight"];
  }

  let style;

  // close: init: 123 -> run: 0 -> end: 0
  // open: init: 0 -> run: 123 -> end: null
  if ((direction === "close" && state === "init") || (direction === "open" && state === "run")) {
    style = {
      height: contentHeightRef.current,
      overflow: "hidden",
      flex: "none",
    };
  } else if (collapsed || (direction === "open" && state === "init")) {
    style = { height: 0, overflow: "hidden", flex: "none" };
  }

  return { style, ref };
}

//@@viewOff:helpers

const CollapsibleBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "CollapsibleBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    collapsed: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    collapsed: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { collapsed, children } = props;
    const { style, ref: elRef } = useCollapseTransition(collapsed);

    const { isHeadless } = useDevice();

    let [alreadyExpanded, setAlreadyExpanded] = useState(isHeadless || !collapsed);
    if (!alreadyExpanded && !collapsed) {
      alreadyExpanded = true;
      setAlreadyExpanded(true);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let renderResult;
    if (typeof children === "function") {
      renderResult = children({ elementRef: elRef, style: { ...style, transition: TRANSITION }, alreadyExpanded });
    } else {
      const { ref, ...attrs } = Utils.VisualComponent.getAttrs(props, Css.main(props));
      renderResult = (
        <div {...attrs} ref={Utils.Component.combineRefs(ref, elRef)} style={{ ...attrs.style, ...style }}>
          {alreadyExpanded ? children : undefined}
        </div>
      );
    }
    return <CollapseAnimationProvider isAnimating={!!style}>{renderResult}</CollapseAnimationProvider>;
    //@@viewOff:render
  },
});

export { CollapsibleBox };
export default CollapsibleBox;
