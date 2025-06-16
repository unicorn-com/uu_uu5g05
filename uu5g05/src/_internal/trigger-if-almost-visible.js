//@@viewOn:imports
import createComponent from "../create-component/create-component.js";
import { useRef, useState, useLayoutEffect } from "../hooks/react-hooks.js";
import useEvent from "../hooks/use-event.js";
import Config from "../config/config.js";
//@@viewOff:imports

// TODO Add support for any/nearest scroll element. Currently only scrolling on window is supported.
export const TriggerIfAlmostVisible = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TriggerIfAlmostVisible",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render({ onTrigger, triggerDistance = 1000, children }) {
    //@@viewOn:private
    let elementRef = useRef();
    let [triggerred, setTriggerred] = useState(false);

    let scrollElementRect = useWindowRect();
    let [elementRect, setElementRect] = useState();
    useLayoutEffect(() => {
      if (!triggerred) {
        setElementRect(elementRef.current.getBoundingClientRect());

        let onScroll = (e) => setElementRect(elementRef.current.getBoundingClientRect());
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
      }
    }, [triggerred]);

    useLayoutEffect(() => {
      if (elementRef.current && typeof onTrigger === "function" && !triggerred && scrollElementRect && elementRect) {
        if (scrollElementRect.bottom + triggerDistance > elementRect.top) {
          setTriggerred(true);
          onTrigger();
        }
      }
    }, [scrollElementRect, elementRect, triggerDistance, onTrigger, triggerred]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <div ref={elementRef}>{triggerred ? children : null}</div>;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const useWindowRect = () => {
  let [rect, setRect] = useState(getWindowRect);
  useEvent("resize", () => setRect(getWindowRect), window);
  return rect;
};

function getWindowRect() {
  return { left: 0, top: 0, width: innerWidth, height: innerHeight, right: innerWidth, bottom: innerHeight };
}
//@@viewOff:helpers

export default TriggerIfAlmostVisible;
