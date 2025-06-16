//@@viewOn:imports
import {
  createComponent,
  createVisualComponent,
  PropTypes,
  useState,
  Utils,
  useEffect,
  useRef,
  Lsi,
  useDevice,
} from "uu5g05";
import Uu5Elements, { useScrollableParentElement, Label } from "uu5g05-elements";
import Config from "./config/config.js";
import Message from "./message.js";
//@@viewOff:imports

const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;
const ADDITIONAL_TEXT_SIZE_MAP_MOBILE = {
  xxs: "s",
  xs: "s",
  s: "m",
  m: "m",
  l: "m",
  xl: "m",
};
const ADDITIONAL_TEXT_SIZE_MAP = {
  xxs: "xs",
  xs: "xs",
  s: "s",
  m: "s",
  l: "m",
  xl: "m",
};

const Css = {
  main({ layout, label, containerSize }) {
    let gridTemplateAreas, gridTemplateColumns;

    const [, labelCount, inputCount] = layout?.match(/^(\d):(\d)$/) || [];

    if (labelCount) {
      gridTemplateAreas = `"${[
        ...Array.from({ length: +labelCount }, () => (label ? "label" : ".")),
        ...Array.from({ length: +inputCount }, () => "input"),
      ].join(" ")}"`;

      gridTemplateAreas += "\n";

      gridTemplateAreas += `"${[
        ...Array.from({ length: +labelCount }, () => "."),
        ...Array.from({ length: +inputCount }, () => "message"),
      ].join(" ")}"`;

      gridTemplateColumns = `repeat(${+labelCount + +inputCount}, 1fr)`;
    }
    const { h: height } = Uu5Elements.UuGds.SizingPalette.getValue(["spot", "basic", containerSize]) || {};

    return Config.Css.css({
      display: "grid",
      alignItems: "center",
      justifyItems: "baseline",
      columnGap: Uu5Elements.UuGds.getValue(["SpacingPalette", "relative", "c"]) * height,
      gridTemplateAreas,
      gridTemplateColumns,
    });
  },
  label({ layout, containerSize = "m" }) {
    const { h: height } = Uu5Elements.UuGds.SizingPalette.getValue(["spot", "basic", containerSize]) || {};

    let layoutStyles = {};
    if (layout && layout !== "vertical") {
      layoutStyles = { gridArea: "label", alignSelf: "baseline", minHeight: height };
    } else {
      let marginBottom = Uu5Elements.UuGds.getValue(["SpacingPalette", "relative", "c"]) * height;
      layoutStyles = { marginBottom };
    }

    return Config.Css.css({ display: "flex", alignItems: "center", ...layoutStyles });
  },
  input({ layout }) {
    return Config.Css.css({
      gridArea: layout && layout !== "vertical" ? "input" : undefined,
      justifySelf: "stretch",
      alignSelf: "stretch", // info: for FormTextArea, because height must be for whole cell in grid
    });
  },
  message({ layout }) {
    return Config.Css.css({
      gridArea: layout && layout !== "vertical" ? "message" : undefined,
      marginTop: Uu5Elements.UuGds.getValue(["SpacingPalette", "inline", "d"]), // TODO gds does not specify this, is was 0.4em
    });
  },
};

let scrollIntoViewRequest = { id: 0 };
async function scrollIntoView(elRef, scrollContainer) {
  scrollIntoViewRequest.cleanup?.();
  let operationId = ++scrollIntoViewRequest.id;

  scrollContainer ||= document.scrollingElement;
  let doScroll = () => {
    let el = elRef.current;
    if (!el) return;

    let elRect = el.getBoundingClientRect();
    let visualViewportRect = {
      left: visualViewport.offsetLeft,
      right: visualViewport.offsetLeft + visualViewport.width,
      width: visualViewport.width,
      top: visualViewport.offsetTop,
      bottom: visualViewport.offsetTop + visualViewport.height,
      height: visualViewport.height,
    };
    let scrollYDelta = -(visualViewportRect.height / 2 - elRect.height / 2 + visualViewportRect.top - elRect.top);
    let scrollXDelta =
      elRect.left < visualViewportRect.right && elRect.right > visualViewportRect.left
        ? 0
        : // horizontally not fully visible => scroll so that it is 16px from left edge of visual viewport
          16 - elRect.left + visualViewportRect.left;
    if (scrollYDelta || scrollXDelta) {
      let scrollToX = scrollContainer.scrollLeft + scrollXDelta;
      let scrollToY = scrollContainer.scrollTop + scrollYDelta;
      scrollContainer.scrollTo({ left: scrollToX, top: scrollToY, behavior: "smooth" });
    }
  };

  // wait until 1st of any of these happens and then perform the scroll:
  // a) visualViewport resizes (virtual keyboard got shown on mobile)
  // b) scroll happenned on container (browser tried to scroll the input into view)
  // c) nothing happens for certain time, e.g. 300ms
  let waitList = [];
  let cleanupList = [];
  waitList.push(
    new Promise((resolve) => {
      visualViewport.addEventListener("resize", resolve);
      cleanupList.push(() => visualViewport.removeEventListener("resize", resolve));
    }),
  );
  waitList.push(
    new Promise((resolve) => {
      scrollContainer.addEventListener("scroll", resolve);
      cleanupList.push(() => scrollContainer.removeEventListener("scroll", resolve));
    }),
  );
  waitList.push(
    new Promise((resolve) => {
      let timeout = setTimeout(resolve, 300);
      cleanupList.push(() => clearTimeout(timeout));
    }),
  );
  await Promise.any(waitList);
  cleanupList.forEach((fn) => fn());
  if (operationId !== scrollIntoViewRequest.id) return; // newer scrollIntoView() has been already called in the meantime
  doScroll();

  // keep re-scrolling for some time (600ms) because visualViewport sometimes gets resized multiple times
  visualViewport.addEventListener("resize", doScroll);
  scrollIntoViewRequest.cleanup = () => {
    // eslint-disable-next-line no-use-before-define
    clearTimeout(timeout);
    visualViewport.removeEventListener("resize", doScroll);
    scrollIntoViewRequest.cleanup = undefined;
  };
  let timeout = setTimeout(scrollIntoViewRequest.cleanup, 600);
}

function withFormInput(Input, defaultProps) {
  const { width, ...propTypes } = Input?.propTypes || {};
  const { width: _, ..._defaultProps } = Input?.defaultProps || {};

  const ResultComponent = createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + (Input ? `withFormInput(${Input.uu5Tag})` : "FormInput"),
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...propTypes,

      layout: PropTypes.oneOf(["vertical", "1:1", "1:2", "2:3"]),
      label: Label.propTypes.children,
      info: Label.propTypes.info,
      feedback: Message.propTypes.feedback,
      message: Message.propTypes.children,
      messageParams: PropTypes.arrayOf(PropTypes.any),
      messagePosition: PropTypes.oneOf(["bottom", "tooltip"]),
      infoMessage: PropTypes.string,
      inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
      inputAttrs: PropTypes.object,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ..._defaultProps,

      layout: "vertical",
      label: undefined,
      info: undefined,
      feedback: undefined,
      message: undefined,
      messageParams: undefined,
      messagePosition: "bottom",
      infoMessage: undefined,
      inputRef: undefined,
      inputAttrs: undefined,
      size: "m",
      ...defaultProps,
    },
    //@@viewOff:defaultProps
    render(props) {
      //@@viewOn:private
      let {
        layout,
        label,
        info,
        feedback,
        message,
        messagePosition,
        messageParams,
        infoMessage,
        inputRef,
        inputAttrs,
        testId,
        ...inputProps
      } = props;
      for (let k in createVisualComponent.defaultProps) delete inputProps[k]; // don't duplicate className, id, ..., onto <input> (they're meant for root <div>)
      inputProps.disabled = props.disabled;

      const { required, background, pending, readOnly, disabled, size } = inputProps;

      const { isMobileOrTablet } = useDevice();
      const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
      const additionalTextSize =
        (isMobileOrTablet && ADDITIONAL_TEXT_SIZE_MAP_MOBILE[size]) || ADDITIONAL_TEXT_SIZE_MAP[size];

      const inputElRef = useRef();

      const [id0] = useState(() => Utils.String.generateId());
      const id = inputAttrs?.id || id0;
      const mountedRef = useRef(false);
      useEffect(() => {
        mountedRef.current = true;
      }, []);

      const [tooltipSettings, setTooltipSettings] = useState([]);
      const [feedbackElement, setFeedbackElement] = useState();
      if (feedback && message && messagePosition === "tooltip") {
        inputAttrs = {
          ...inputAttrs,
          onMouseEnter: () => setTooltipSettings((arr) => [...new Set([...arr, "hover"])]),
          onMouseLeave: () => setTooltipSettings((arr) => arr.filter((v) => v !== "hover")),
        };
      }

      const scrollContainer = useScrollableParentElement();
      const [scrollKey, setScrollKey] = useState(0);
      useEffect(() => {
        if (scrollKey) scrollIntoView(inputElRef, scrollContainer);
        // eslint-disable-next-line uu5/hooks-exhaustive-deps
      }, [scrollKey]);
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      const attrs = Utils.VisualComponent.getAttrs(props, Css.main({ ...props, containerSize }));

      inputProps.disabled = attrs.disabled;
      delete attrs.disabled; // disabled is only on input

      const labelId = id + "-label";

      return (
        <div {...attrs}>
          {label != null && (
            <Label
              id={labelId}
              testId={testId ? testId + "-label" : undefined}
              className={Css.label({ ...props, containerSize })}
              htmlFor={pending || readOnly || disabled ? undefined : id}
              required={required}
              info={info}
              size={containerSize}
              background={background}
            >
              {label}
            </Label>
          )}
          <Input
            {...inputProps}
            feedback={feedback}
            feedbackRef={messagePosition === "tooltip" ? setFeedbackElement : undefined}
            className={Css.input(props)}
            width="100%"
            elementAttrs={{
              ...inputAttrs,
              id,
              "aria-label": pending || readOnly ? labelId : inputAttrs?.["aria-label"],
            }}
            elementRef={Utils.Component.combineRefs(inputRef, inputElRef)}
            onFocus={(e) => {
              inputProps.onFocus?.(e);
              if (isMobileOrTablet) {
                // NOTE Postpone scrolling into view by 1 render because auto-focused inputs, e.g. in Popover with bottomSheet,
                // trigger onFocus right after mount. But during mount (1st render) we do not have the correct scrollContainer
                // yet (because its Provider must mount first, and only then it gets the element and stores it into state and
                // passes it onto context in 2nd render).
                setScrollKey((v) => v + 1);
              }
              setTooltipSettings((arr) => [...new Set([...arr, "focus"])]);
            }}
            onBlur={(e) => {
              inputProps.onBlur?.(e);
              setTooltipSettings((arr) => arr.filter((v) => v !== "focus"));
            }}
            testId={testId ? testId + "-input" : undefined}
          />
          {messagePosition === "tooltip" && tooltipSettings.length > 0 && message && feedbackElement && (
            <Uu5Elements.Tooltip
              element={feedbackElement}
              colorScheme={Config.COLOR_SCHEME_MAP[feedback]}
              significance="highlighted"
              delayMs={500}
              testId={testId ? testId + "-message" : undefined}
            >
              {message && typeof message === "object" && !Utils.Element.isValid(message) ? (
                <Lsi lsi={message} params={messageParams} />
              ) : (
                message
              )}
            </Uu5Elements.Tooltip>
          )}
          {infoMessage || (message && messagePosition === "bottom") ? (
            <Message
              size={additionalTextSize}
              className={Css.message(props)}
              background={background}
              feedback={!infoMessage ? feedback : undefined}
              params={!infoMessage ? messageParams : undefined}
              initialShowDelayed={mountedRef.current}
              testId={testId ? testId + "-message" : undefined}
            >
              {infoMessage || message}
            </Message>
          ) : null}
        </div>
      );
      //@@viewOff:render
    },
  });
  Utils.Component.mergeStatics(ResultComponent, Input);
  return ResultComponent;
}

//@@viewOn:helpers
//@@viewOff:helpers

export { withFormInput };
export default withFormInput;
