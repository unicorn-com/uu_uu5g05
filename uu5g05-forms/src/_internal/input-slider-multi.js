//@@viewOn:imports
import {
  createVisualComponent,
  PropTypes,
  useElementSize,
  useMemo,
  useRef,
  useState,
  Utils,
  Lsi,
  useUserPreferences,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import InputSlider, { THUMB_COLOR_SCHEME } from "./input-slider.js";
import Config from "../config/config.js";
import withValidationInput from "../with-validation-input.js";
import InputSliderTrack from "./input-slider-track.js";
import { roundToDecimalCount } from "./tools.js";
//@@viewOff:imports

//@@viewOn:constants
const SIZE_CFG = { s: "small", m: "medium", l: "large" };
const DEFAULT_TICK_COLOR_SCHEME = "building";
const DEFAULT_TICK_SIGNIFICANCE = "common";
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ size, width }) => {
    let { height, borderRadius } = Uu5Elements.UuGds.getSizes("spot", "basic", size, "full");
    return Config.Css.css({
      display: "grid",
      gridTemplateColumns: "minmax(0, auto)",
      gridTemplateRows: "minmax(0, 1fr) auto",
      maxWidth: width,
      width,
      height,
      borderRadius,
      position: "relative", // for multi-dimensional value
    });
  },
  itemList: ({ itemListWithNumber }) => {
    let otherStyles = {};
    if (itemListWithNumber) {
      otherStyles = { position: "relative" };
    } else {
      otherStyles = { justifyContent: "space-between" };
    }
    return Config.Css.css({
      display: "flex",
      width: "100%",
      ...otherStyles,
    });
  },
  tick: ({ thumbWidth, style, itemListWithNumber, value, max, min, contentWidth, inRange }) => {
    let otherStyles = {};
    if (itemListWithNumber) {
      let left = getTickPosition(value, max, min, contentWidth, thumbWidth);
      otherStyles = { position: "absolute", left };
    }
    return Config.Css.css({
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "a"]),
      width: thumbWidth, // the tick is the same width as the thumb for centering
      ...style,
      ...otherStyles,

      "&:before": {
        content: '""',
        height: 4,
        width: 1,
        background: style.color,
        position: "relative",
        zIndex: 0,
      },
    });
  },
  sliderInput: () => {
    return Config.Css.css({
      gridArea: "1 / 1 / 2 / 2",
      zIndex: 1,
      position: "relative",
    });
  },
  sliderInputThumbOnlyStyle: ({ value, min, max, contentWidth, thumbWidth, thumbOnly, feedback }) => {
    let left = getThumbLeftPx(value, min, max, contentWidth, thumbWidth);
    const thumbColorScheme = feedback ? Config.COLOR_SCHEME_MAP[feedback] : THUMB_COLOR_SCHEME;
    let outlineConfig = Uu5Elements.UuGds.EffectPalette.getValue(["outlineIndentedExpressive"], {
      colorScheme: thumbColorScheme,
    });
    let outlineReserve = 0;
    if (outlineConfig) {
      if (!Array.isArray(outlineConfig)) outlineConfig = [outlineConfig];
      for (let item of outlineConfig) {
        if (!item?.inset) outlineReserve = Math.max(outlineReserve, item?.spreadRadius || 0);
      }
    }
    return {
      clipPath: `rect(-20px ${left + thumbWidth + outlineReserve}px calc(100% + 20px) ${left - outlineReserve}px)`,
    };
  },
  track: () => {
    return Config.Css.css({
      gridArea: "1 / 1 / 2 / 2",
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getThumbLeftPx(value, min, max, contentWidth, thumbWidth) {
  let valueInPercents = ((value - min) / (max - min)) * 100;
  let valueInPixels = (valueInPercents * contentWidth) / 100;
  let deviation = (valueInPercents * thumbWidth) / 100;
  return valueInPixels - deviation;
}

function getTooltipPosition(tooltipRef, value, max, min, contentWidth, thumbWidth) {
  let pageX = 0;
  let pageY = 0;
  if (tooltipRef.current) {
    let componentTop = tooltipRef.current.getBoundingClientRect().top;
    let componentLeft = tooltipRef.current.getBoundingClientRect().left;
    pageY = componentTop + window.scrollY;
    pageX = componentLeft + getThumbLeftPx(value, min, max, contentWidth, thumbWidth) + window.scrollX;
  }
  return { pageX, pageY };
}

function getDisplayTooltip(itemList, step, tickStep, min, max, maxTickCount, value, displayTooltip) {
  const isItemList = Array.isArray(itemList) && itemList.length > 0;
  const isStringInItemList = itemList?.findIndex((item) => typeof item.value === "string") > -1;
  let forceDisplayTooltip;

  if (isItemList && isStringInItemList) {
    // itemList prop with string
    forceDisplayTooltip = true; // specific tooltip can still be omitted if itemList doesn't contain tooltip for such item
  } else if ((step && !tickStep) || (tickStep && tickStep === step)) {
    if ((max - min) / step > maxTickCount) {
      // no space available for all values
      forceDisplayTooltip = true;
    }
    // all values are displayed = displayTooltip prop solves tooltip
  } else if (step && tickStep && tickStep > step) {
    // tickStep never displays all values
    forceDisplayTooltip = true;
  }

  return forceDisplayTooltip ?? displayTooltip;
}

function getValidTooltipContent(tooltip) {
  let tooltipContent;
  if (typeof tooltip === "object" && !tooltip.type?.uu5Tag && !tooltip.type?.displayName) {
    tooltipContent = <Lsi lsi={tooltip} />;
  } else {
    tooltipContent = tooltip;
  }
  return tooltipContent;
}

function getTooltipContent(itemList, value) {
  let tooltipContent = value;

  if (Array.isArray(itemList) && itemList.length > 0) {
    if (itemList.findIndex((item) => typeof item.value === "string") > -1) {
      let tooltip = itemList[value]?.tooltip;
      if (tooltip != null && tooltip !== "") tooltipContent = getValidTooltipContent(tooltip);
      else tooltipContent = null; // do not show any tooltip
    } else {
      let currentItem = itemList.find((item) => item.value === value);
      if (currentItem?.tooltip) tooltipContent = getValidTooltipContent(currentItem.tooltip);
    }
  }
  return tooltipContent;
}

function getTickPosition(value, max, min, contentWidth, thumbWidth) {
  let pageX = 0;
  let valueInPercents = ((value - min) / (max - min)) * 100;
  let valueInPixels = (valueInPercents * contentWidth) / 100;
  let deviation = (valueInPercents * thumbWidth) / 100;
  pageX = valueInPixels - deviation;
  return pageX;
}

const FLOAT_EPSILON = 1e-7;
function getNewTickCount(step, maxTickCount, diffMaxMin, multiplierFrom) {
  let result;
  let multiplier = Math.max(multiplierFrom, Math.round(diffMaxMin / (step * maxTickCount)));
  for (; multiplier * step + FLOAT_EPSILON <= diffMaxMin; multiplier++) {
    let remainder = diffMaxMin % (step * multiplier);
    // consolidate float remainder for decimal steps such as 0.1 (e.g. `1 % (0.1 * 2)` is 0.19999999999999996 instead of 0)
    if (Math.abs(remainder) < FLOAT_EPSILON || Math.abs(step * multiplier - remainder) < FLOAT_EPSILON) remainder = 0;
    let newTickCount = Math.round(diffMaxMin / (step * multiplier)); // round for decimal steps such as 0.1

    if (remainder === 0 && newTickCount <= maxTickCount) {
      result = newTickCount;
      break;
    } else if (multiplier * step >= diffMaxMin) {
      // no suitable number of ticks found, we'll have only 1st & last tick
      result = 1;
      break;
    }
  }
  return result;
}

function formatNumber(value, { numberGroupingSeparator, numberDecimalSeparator }) {
  if (typeof value !== "number") return value;
  return Utils.Number.format(value, {
    groupingSeparator: numberGroupingSeparator,
    decimalSeparator: numberDecimalSeparator,
  });
}
//@@viewOff:helpers

const { thumbOnly, ...propTypes } = InputSlider.propTypes;
const { thumbOnly: _, ...defaultProps } = InputSlider.defaultProps;
const _MultiSliderInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "_MultiSliderInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    value: PropTypes.arrayOf(InputSlider.propTypes.value),
    tickStep: PropTypes.number,
    displayTick: PropTypes.bool,
    displayTooltip: PropTypes.bool,
    maxTickWidth: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    tickStep: undefined,
    displayTick: true,
    displayTooltip: true,
    maxTickWidth: 30,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      value: propsValue,
      onChange,
      displayTick,
      itemList,
      tickStep,
      displayTooltip: propsDisplayTooltip,
      maxTickWidth,
      thumbSignificanceList: propsThumbSignificanceList,
      ...otherProps
    } = props;
    const { min, max, step, size, className, width, readOnly, disabled } = otherProps;

    const [userPreferences] = useUserPreferences();
    const { numberGroupingSeparator, numberDecimalSeparator } = userPreferences || {};

    const isOpenLeft = propsValue[0] === null;
    const isOpenRight = propsValue.length > 1 && propsValue[propsValue.length - 1] === null;
    const [value, thumbSignificanceList] = useMemo(() => {
      let result = propsValue;
      let tsl = propsThumbSignificanceList;
      if (isOpenLeft || isOpenRight) {
        result = propsValue.slice(isOpenLeft ? 1 : 0, isOpenRight ? -1 : undefined);
        tsl = propsThumbSignificanceList.slice(isOpenLeft ? 1 : 0, isOpenRight ? -1 : undefined);
      }
      // clamp values so that thumbs aren't outside of our area (in 2-dimensional value it would mean that user cannot actually
      // move them because he doesn't see them and clicking a filled track would want to be dragging whole range and would do nothing)
      result = result.map((it) => (typeof it === "number" ? Math.max(min, Math.min(max, it)) : it));
      return [result, tsl];
    }, [isOpenLeft, isOpenRight, max, min, propsValue, propsThumbSignificanceList]);

    const isItemList = Array.isArray(itemList) && itemList.length > 0;
    const isStringInItemList = itemList?.findIndex((item) => typeof item.value === "string") > -1;
    const itemListWithString = isItemList && isStringInItemList;

    const elementRef = useRef();
    const [trackInteractionInfo, setTrackInteractionInfo] = useState(); // { interactionRange: "all|single", valueIndex }, e.g. when user drags
    const [focusInfo, setFocusInfo] = useState(); // valueIndex (when user focuses one of thumbs)

    function triggerOnChange(newValue, e) {
      if (isOpenLeft) newValue.unshift(null);
      if (isOpenRight) newValue.push(null);
      onChange(new Utils.Event({ value: newValue }, e));
    }

    function handleThumbChange(e, index) {
      let origValuePart = value[index];
      let newValuePart = e.data.value;
      if (origValuePart === newValuePart) return;
      let newValue = [...value];
      newValue[index] = newValuePart;
      triggerOnChange(newValue, e);
      if (focusInfo?.index !== index) {
        // on mobile (Android) the input doesn't get focus automatically when user drags it using thumb
        elementRef.current?.querySelector(`input:nth-of-type(${index + 1})`)?.focus();
      }
    }
    function handleThumbFocus(e, index) {
      setFocusInfo({ index });
      if (typeof props.onFocus === "function") props.onFocus(e);
    }
    function handleThumbBlur(e, index) {
      setFocusInfo((cur) => (cur?.index === index ? undefined : cur));
      if (typeof props.onBlur === "function") props.onBlur(e);
    }

    function handleTrackChange(e) {
      triggerOnChange([...e.data.value], e);
      if (e.data.valueIndex != null) {
        elementRef.current?.querySelector(`input:nth-of-type(${e.data.valueIndex + 1})`)?.focus();
      }
      setTrackInteractionInfo(
        e.data.interactionRange ? { range: e.data.interactionRange, index: e.data.valueIndex } : undefined,
      );
    }

    const { h: thumbWidth } = Uu5Elements.UuGds.SizingPalette.getValue(["spot", "minor", size]);
    const { ref: elementSizeRef, contentWidth } = useElementSize();
    const multiplierRef = useRef(2);
    const maxTickCount = Math.floor(contentWidth / maxTickWidth);

    const [hoverInfo, setHoverInfo] = useState(null);

    const displayTooltip = useMemo(() => {
      return getDisplayTooltip(itemList, step, tickStep, min, max, maxTickCount, value, propsDisplayTooltip);
    }, [itemList, max, maxTickCount, min, propsDisplayTooltip, step, tickStep, value]);

    const selectedFrom = isOpenLeft ? -Infinity : Math.min(...value);
    const selectedTo = isOpenRight ? Infinity : Math.max(...value);
    const displayedTicks = useMemo(() => {
      if (!displayTick || !contentWidth) return null;

      let totalTicks = [];
      if (contentWidth && !isItemList) {
        // ticks are displayed according to props or available space
        // the total number of ticks must be calculated
        let tickCountFromStep = step ? (max - min) / step : undefined;
        let tickCountFromTickStep = tickStep ? (max - min) / tickStep : undefined;

        // ticks are displayed according to user props
        let finalTickCount = maxTickCount;
        if (tickCountFromStep && tickCountFromStep < finalTickCount) finalTickCount = tickCountFromStep;
        if (tickCountFromTickStep && tickCountFromTickStep < maxTickCount) {
          finalTickCount = tickCountFromTickStep;
        }

        // ticks are displayed according to available space
        let tickCountFromUser = tickCountFromTickStep ?? tickCountFromStep;
        if (tickCountFromUser && tickCountFromUser > maxTickCount) {
          let finalStep = tickStep ?? step;
          finalTickCount = getNewTickCount(finalStep, maxTickCount, max - min, multiplierRef.current);
        }
        if (finalTickCount) {
          let stepDecimalCount = step != null ? (step + "").split(".")[1]?.length || 0 : 0;
          for (let i = 0; i <= finalTickCount; i++) {
            // NOTE Tick value is not necessarily rounded to props.step (e.g. for step={15} tickStep={20}), even though
            // noone is going to use it like that.
            let value = min + ((max - min) / finalTickCount) * i;
            value = roundToDecimalCount(value, stepDecimalCount); // round to step's decimal count (e.g. step=0.1, show tick value with at most 1 decimal place)
            totalTicks.push({
              value,
              children: formatNumber(value, { numberDecimalSeparator, numberGroupingSeparator }),
            });
          }
        }
      } else if (itemList) {
        // ticks are displayed according to itemList prop
        // the total number of ticks is equal to the length of the itemList
        totalTicks = itemList;
      }

      const textProps = {
        category: "interface",
        segment: "content",
        type: SIZE_CFG[size],
        colorScheme: DEFAULT_TICK_COLOR_SCHEME,
        significance: DEFAULT_TICK_SIGNIFICANCE,
      };

      return (
        <div className={Css.itemList({ itemListWithNumber: isItemList && !itemListWithString })}>
          {/* hidden tick to define the correct height */}
          {isItemList && !itemListWithString && (
            <Uu5Elements.Text key="hidden_tick" {...textProps}>
              {({ style }) => (
                <div className={Css.tick({ style: { ...style, visibility: "hidden" } })}>Hidden_tick</div>
              )}
            </Uu5Elements.Text>
          )}
          {totalTicks.map((tick, i) => {
            let children = tick.children;
            if (children && typeof children === "object" && !Utils.Element.isValid(children)) {
              children = <Lsi lsi={children} />;
            }
            let inRange = tick.value >= selectedFrom && tick.value <= selectedTo;
            if (thumbSignificanceList?.[0] === "common" && tick.value === selectedFrom) inRange = false;
            if (thumbSignificanceList?.[1] === "common" && tick.value === selectedTo) inRange = false;
            let usedTextProps = inRange ? { ...textProps, colorScheme: THUMB_COLOR_SCHEME } : textProps;
            return (
              <Uu5Elements.Text key={i + "_tick_" + tick.value} {...usedTextProps}>
                {({ style }) => (
                  <div
                    className={Css.tick({
                      thumbWidth,
                      style,
                      itemListWithNumber: isItemList && !itemListWithString,
                      value: tick.value,
                      max,
                      min,
                      contentWidth,
                      inRange,
                    })}
                  >
                    {children}
                  </div>
                )}
              </Uu5Elements.Text>
            );
          })}
        </div>
      );
    }, [
      displayTick,
      contentWidth,
      isItemList,
      itemList,
      size,
      itemListWithString,
      step,
      max,
      min,
      tickStep,
      maxTickCount,
      selectedFrom,
      selectedTo,
      thumbWidth,
      numberDecimalSeparator,
      numberGroupingSeparator,
      thumbSignificanceList,
    ]);
    //@@viewOff:private

    //@@viewOn:render
    function renderTooltip(singleValue, key, tooltipProps) {
      let tooltipContent = getTooltipContent(itemList, singleValue);
      if (tooltipContent != null) {
        let { pageX, pageY } = getTooltipPosition(elementRef, singleValue, max, min, contentWidth, thumbWidth);
        return (
          <Uu5Elements.Tooltip
            key={key}
            delayMs={300}
            pageX={pageX + thumbWidth / 2}
            pageY={pageY}
            preferredPosition="top-center"
            displayArrow
            {...tooltipProps}
          >
            {formatNumber(tooltipContent, { numberGroupingSeparator, numberDecimalSeparator })}
          </Uu5Elements.Tooltip>
        );
      }
    }
    const classNames = Utils.Css.joinClassName(className, Css.main({ size, width }));
    const { elementAttrs, componentProps } = Utils.VisualComponent.splitProps(otherProps, classNames);
    const { ref, ...attrs } = elementAttrs;

    return (
      <div
        {...attrs}
        ref={Utils.Component.combineRefs(ref, elementSizeRef, elementRef)}
        inert={attrs?.inert ?? (disabled ? "" : undefined)}
      >
        <InputSliderTrack
          className={Css.track()}
          size={size}
          value={value}
          min={min}
          max={max}
          step={step}
          draggableWidth={contentWidth - thumbWidth}
          onChange={!disabled && !readOnly ? handleTrackChange : undefined}
          selectionRange={
            selectedFrom < selectedTo
              ? [
                  selectedFrom === -Infinity || selectedFrom === min
                    ? 0
                    : getThumbLeftPx(selectedFrom, min, max, contentWidth, thumbWidth) + thumbWidth / 2,
                  selectedTo === Infinity || selectedTo === max
                    ? 0
                    : contentWidth - (getThumbLeftPx(selectedTo, min, max, contentWidth, thumbWidth) + thumbWidth / 2),
                ]
              : undefined
          }
          elementAttrs={{
            onMouseEnter: () => setHoverInfo({ all: true }),
            onMouseLeave: () => setHoverInfo(undefined),
          }}
        />
        {value.map((it, i) => (
          <InputSlider
            key={i}
            {...componentProps}
            className={Css.sliderInput()}
            thumbOnly
            thumbSignificance={thumbSignificanceList?.[i]}
            style={Css.sliderInputThumbOnlyStyle({ ...props, value: it, contentWidth, thumbWidth })}
            disabled={false} // to not have visually duplicit opacity; the input will be disabled because our main div is disabled & inert
            onChange={
              !disabled && !readOnly && typeof onChange === "function" ? (e) => handleThumbChange(e, i) : undefined
            }
            onFocus={!disabled ? (e) => handleThumbFocus(e, i) : undefined}
            onBlur={!disabled ? (e) => handleThumbBlur(e, i) : undefined}
            value={it}
            autoFocus={componentProps.autoFocus && i === 0}
            elementAttrs={{
              tabIndex: attrs.tabIndex,
              onMouseEnter: () => setHoverInfo({ index: i }),
              onMouseLeave: () => setHoverInfo(undefined),
            }}
          />
        ))}
        {displayedTicks}
        {displayTooltip
          ? value.map((it, i) =>
              trackInteractionInfo?.range === "all" || trackInteractionInfo?.index === i || focusInfo?.index === i
                ? renderTooltip(it, i, { delayMs: 0 })
                : hoverInfo?.index === i
                  ? renderTooltip(it, i)
                  : null,
            )
          : null}
      </div>
    );
    //@@viewOff:render
  },
});

const MultiSliderInput = withValidationInput(_MultiSliderInput);

//@@viewOn:exports
export { MultiSliderInput };
export default MultiSliderInput;
//@@viewOff:exports
