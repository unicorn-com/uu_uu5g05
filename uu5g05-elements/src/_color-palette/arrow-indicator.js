//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useRef, useState, useElementSize, useEffect } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

const ArrowIndicator = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ArrowIndicator",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    intervalCount: PropTypes.number,
    initialPosition: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    intervalCount: undefined,
    initialPosition: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { intervalCount, initialPosition, ...otherProps } = props;
    const elementRef = useRef();
    const { ref, width } = useElementSize();
    const [position, setPosition] = useState();
    useEffect(() => {
      if (initialPosition) {
        const result = calculatePosition(undefined, elementRef, width, intervalCount, initialPosition);
        setPosition(result.position);
      }
    }, [elementRef, initialPosition, intervalCount, width]);

    const combinedRef = Utils.Component.combineRefs(elementRef, ref);

    const attrs = Utils.VisualComponent.getAttrs(otherProps, CLASS_NAMES.main(position));

    function handleClick(e) {
      const result = calculatePosition(e, elementRef, width, props.intervalCount);
      setPosition(result.position);
      if (typeof props.onClick === "function") {
        props.onClick(new Utils.Event({ value: result.roundedPosition }, e));
      }
    }
    //@@viewOff:private

    //@@viewOn:render
    return (
      <div {...attrs} ref={combinedRef} onClick={(e) => handleClick(e)}>
        {props.children}
      </div>
    );
    //@@viewOff:render
  },
});
//@@viewOn:helpers
const CLASS_NAMES = {
  main: (position) =>
    Config.Css.css({
      position: "relative",
      overflow: "hidden",
      "::after": {
        content: '""',
        position: "absolute",
        width: 10,
        height: 10,
        background: "#FFFFFF",
        left: position,
        border: "1px solid #000000",
        top: -6,
        transform: "rotate(45deg)",
      },
    }),
};

function calculatePosition(e, elementRef, width, intervalCount, initialValue) {
  const elementPosition = elementRef.current.getBoundingClientRect();
  let step = width / 100;
  let clickPosition;
  if (intervalCount) step = width / intervalCount;
  if (initialValue) {
    clickPosition = step * initialValue;
  } else {
    clickPosition = e.clientX - elementPosition.x;
  }
  const roundedPosition = Math.ceil(clickPosition / step);
  const position = roundedPosition * step - step / 2 - 6; // 6 is half of the width of indicator arrow
  return { position, roundedPosition };
}
//@@viewOff:helpers

export { ArrowIndicator };
export default ArrowIndicator;
