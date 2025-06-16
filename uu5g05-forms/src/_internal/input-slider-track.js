//@@viewOn:imports
import { Utils, createVisualComponent, useBackground, useRef } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { THUMB_COLOR_SCHEME, TRACK_HEIGHT_IN_PERCENT } from "./input-slider.js";
import useDrag from "./use-drag.js";
import { roundToStepDecimalCount } from "./tools.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ size, background, onChange }) => {
    const trackHeight = getTrackHeight(size);
    const trackStates = Uu5Elements.UuGds.Shape.getValue(["ground", background, "neutral", "distinct"]);
    const trackStyle = {
      display: "flex",
      alignItems: "center",
      position: "relative",
      cursor: onChange ? "pointer" : undefined,
      "&:before": {
        content: '""',
        width: "100%",
        borderRadius: trackHeight,
        height: trackHeight,
        ...Uu5Elements.UuGds.Shape.getStateStyles(trackStates.default, true),
      },
    };
    return Config.Css.css(trackStyle);
  },
  fill: ({ size, background, value }) => {
    const trackHeight = getTrackHeight(size);
    const fillStates = Uu5Elements.UuGds.Shape.getValue(["ground", background, THUMB_COLOR_SCHEME, "distinct"]);
    const fillStyle = {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      pointerEvents: value.length > 1 ? undefined : "none", // do not allow dragging open-ended single-value slider (instead, allow simply clicking on target value)
      "&:before": {
        content: '""',
        width: "100%",
        borderRadius: trackHeight,
        height: trackHeight,
        ...Uu5Elements.UuGds.Shape.getStateStyles(fillStates.default, true),
      },
    };
    return Config.Css.css(fillStyle);
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getTrackHeight(size) {
  const { h: inputHeight } = Uu5Elements.UuGds.SizingPalette.getValue(["spot", "basic", size]);
  return Math.round(TRACK_HEIGHT_IN_PERCENT * inputHeight);
}
//@@viewOff:helpers

const InputSliderTrack = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputSliderTrack",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { selectionRange, value, min, max, step, draggableWidth, onChange } = props;
    const background = useBackground();

    const fillDragStartInfoRef = useRef();
    function handleFillDrag(e, isEnd) {
      let isFirst = fillDragStartInfoRef.current === undefined;
      fillDragStartInfoRef.current ??= value;
      let { dx } = e.data;
      let valueDx = (dx / draggableWidth) * (max - min);
      if (step) valueDx = roundToStepDecimalCount(Math.round(valueDx / step) * step, step);
      else valueDx = Math.round(valueDx);
      let newValue;
      let startValue = fillDragStartInfoRef.current;
      if (valueDx > 0) {
        let maxValueDx = max - Math.max(...startValue);
        if (maxValueDx < valueDx) valueDx = maxValueDx;
        if (valueDx > 0) newValue = startValue.map((it) => roundToStepDecimalCount(it + valueDx, step));
      } else if (valueDx < 0) {
        let minValueDx = min - Math.min(...startValue);
        if (valueDx < minValueDx) valueDx = minValueDx;
        if (valueDx < 0) newValue = startValue.map((it) => roundToStepDecimalCount(it + valueDx, step));
      } else {
        newValue = startValue;
      }
      if (isFirst || isEnd || (newValue && !Utils.Object.shallowEqual(newValue, value))) {
        onChange(new Utils.Event({ value: newValue ?? value, interactionRange: isEnd ? undefined : "all" }));
      }
    }
    const { elementAttrs: fillDragElementAttrs, className: fillDragClassName } = useDrag({
      onDragging: handleFillDrag, // TODO choose value
      onDragEnd: (e) => {
        handleFillDrag(e, true);
        fillDragStartInfoRef.current = undefined;
      },
    });

    const trackDragStartInfoRef = useRef();
    const { elementAttrs: trackDragElementAttrs, className: trackDragClassName } = useDrag({
      onDragStart: handleTrackDrag,
      onDragging: handleTrackDrag,
      onDragEnd: (e) => {
        handleTrackDrag(e, true);
        trackDragStartInfoRef.current = undefined;
      },
    });

    function handleTrackDrag(e, isEnd) {
      let rect = e.data.element.getBoundingClientRect();
      let clickLeft = e.clientX - rect.left - (rect.width - draggableWidth) / 2;
      let newSingleValue = (clickLeft / draggableWidth) * (max - min) + min;
      newSingleValue = Math.max(min, Math.min(newSingleValue, max));
      if (step) newSingleValue = roundToStepDecimalCount(Math.round((newSingleValue - min) / step) * step + min, step);
      else newSingleValue = Math.round(newSingleValue);
      newSingleValue = Math.max(min, Math.min(newSingleValue, max));
      let minValueIndex = 0;
      let maxValueIndex = 0;
      for (let i = 1; i < value.length; i++) {
        if (value[i] < value[minValueIndex]) minValueIndex = i;
        if (value[i] > value[maxValueIndex]) maxValueIndex = i;
      }
      let isFirst;
      if (!trackDragStartInfoRef.current) {
        isFirst = true;
        if (newSingleValue < value[minValueIndex]) {
          trackDragStartInfoRef.current = { startValue: value, valueIndex: minValueIndex };
        } else if (newSingleValue > value[maxValueIndex]) {
          trackDragStartInfoRef.current ??= { startValue: value, valueIndex: maxValueIndex };
        }
      }
      if (trackDragStartInfoRef.current) {
        const { valueIndex } = trackDragStartInfoRef.current;
        if (isFirst || isEnd || value[valueIndex] !== newSingleValue) {
          let newValue = [...value];
          newValue[valueIndex] = newSingleValue;
          onChange(new Utils.Event({ value: newValue, valueIndex, interactionRange: isEnd ? undefined : "single" }, e));
        }
      }
    }
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main({ ...props, background }));

    return (
      <div
        {...attrs}
        {...(onChange ? trackDragElementAttrs : undefined)}
        className={Utils.Css.joinClassName(attrs.className, trackDragClassName)}
      >
        {selectionRange ? (
          <div
            className={Utils.Css.joinClassName(fillDragClassName, Css.fill({ ...props, background }))}
            style={{ marginInline: `${Math.max(0, selectionRange[0])}px ${Math.max(0, selectionRange[1])}px` }}
            {...(onChange ? fillDragElementAttrs : undefined)}
          />
        ) : null}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { InputSliderTrack };
export default InputSliderTrack;
//@@viewOff:exports
