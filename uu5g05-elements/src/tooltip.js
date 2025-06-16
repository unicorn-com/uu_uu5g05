//@@viewOn:imports
import { createVisualComponent, PropTypes, useEffect, useState, Utils } from "uu5g05";
import Config from "./config/config.js";
import Popover from "./popover.js";
import Text from "./text.js";
import useSpacing from "./use-spacing.js";
import useKeyEvent from "./_internal/use-key-event.js";
//@@viewOff:imports

const Css = {
  popover: ({ spaceC }) => {
    return Config.Css.css({
      padding: spaceC,
      animation: `${Config.Css.keyframes({ "0%": { opacity: 0 }, "100%": { opacity: 1 } })} 0.2s linear`,
    });
  },
  text: () => Config.Css.css({ display: "flex", textAlign: "center" }),
};

const Tooltip = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Tooltip",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Popover.propTypes,
    significance: PropTypes.oneOf(["common", "highlighted"]),
    delayMs: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    preferredPosition: "top-center",
    displayArrow: true,
    delayMs: 1000,
    borderRadius: "elementary",
    significance: "highlighted",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { className, children, delayMs, elementAttrs, elementRef, ...popoverProps } = props;
    let { onClose } = popoverProps;
    const spacing = useSpacing();

    const [display, setDisplay] = useState(!delayMs);

    useEffect(() => {
      if (delayMs) {
        const timeout = setTimeout(() => setDisplay(true), delayMs);
        return () => clearTimeout(timeout);
      }
    }, []);

    const tooltipRef = useKeyEvent("keydown", "Escape", (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClose(e);
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return display ? (
      <Popover
        {...popoverProps}
        closeOnScroll
        className={Utils.Css.joinClassName(className, Css.popover(spacing))}
        elementRef={Utils.Component.combineRefs(elementRef, tooltipRef)}
        elementAttrs={{ ...elementAttrs, role: elementAttrs?.role || "tooltip" }}
        bottomSheet={false}
      >
        <Text category="interface" segment="content" type="medium" className={Css.text()}>
          {children}
        </Text>
      </Popover>
    ) : null;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Tooltip };
export default Tooltip;
