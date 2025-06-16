//@@viewOn:imports
import {
  createComponent,
  PropTypes,
  Utils,
  useToolbar,
  ToolbarProvider,
  BackgroundProvider,
  useBackground,
  useEffect,
  usePreviousValue,
  useRef,
  useState,
  useUpdateEffect,
  useLayoutEffect,
} from "uu5g05";
import Config from "./config/config.js";
import Popover from "./popover.js";
import Box from "./box.js";
import Toolbar from "./toolbar.js";
import UuGds from "./_internal/gds.js";

//@@viewOff:imports

//@@viewOn:constants
const FADE_IN_DURATION = 300;
const FALLBACK_AROUND_ELEMENT_MARKER = {};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function PopoverWithFadeIn(props) {
  const { style, hidden: propsHidden, ...otherProps } = props;
  const [hidden, setHidden] = useState(propsHidden);
  useEffect(() => {
    // postpone using of new `hidden` prop so that we don't collide with Popover's positioning
    // (CSS translate affects result of getBoundingClientRect())
    setHidden(propsHidden);
  }, [propsHidden]);

  const popoverRef = useRef();

  const prevHidden = usePreviousValue(hidden, hidden);
  const pendingAnimateRef = useRef(false);
  const willAnimate = prevHidden !== hidden || pendingAnimateRef.current;
  const [animate, setAnimate] = useState();
  useUpdateEffect(() => {
    pendingAnimateRef.current = true;
    let timeout1 = setTimeout(() => {
      pendingAnimateRef.current = false;
      setAnimate(true);
    }, 0);
    let timeout2 = setTimeout(() => setAnimate(false), FADE_IN_DURATION);
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [hidden]);

  return (
    <Popover
      {...otherProps}
      elementRef={Utils.Component.combineRefs(popoverRef, otherProps.elementRef)}
      style={{
        ...style,
        ...(hidden
          ? { visibility: "hidden", pointerEvents: "none" }
          : willAnimate || animate
            ? { pointerEvents: "none" }
            : undefined),
        transition: animate ? `translate ${FADE_IN_DURATION}ms, opacity ${FADE_IN_DURATION}ms` : undefined,
        translate: willAnimate || animate ? (prevHidden ? "0 16px" : "0") : undefined,
        opacity: willAnimate || animate ? (prevHidden ? "0" : "1") : undefined,
      }}
      keepInViewport
    />
  );
}

function SoftBackgroundProvider({ children }) {
  const parentBackground = useBackground();
  const background = parentBackground === "light" ? "soft" : parentBackground;
  return <BackgroundProvider background={background}>{children}</BackgroundProvider>;
}

const ToolbarContainer = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ToolbarContainer",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    verticalOffset: PropTypes.number,
    toolbarHidden: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    verticalOffset: -10,
    toolbarHidden: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, verticalOffset, toolbarHidden } = props;

    const [aroundElement, setAroundElement] = useState();
    // fallback used in case of non-visual component (which doesn't process props.elementRef) in combination
    // with page without main Toolbar, e.g. when in old uuApp with uuDcc
    // NOTE Contrary to uuDcc, uuEcc detects whether it's necessary to use Popover-based Toolbar and already
    // solves it for us - uuEcc Section is internall wrapped by ToolbarProvider with Popover-based Toolbar if needed.
    // (This is detected in uuEcc's internal ToolbarPreferencesProvider which is on production but we don't have it
    // in our demos, but that doesn't actually matter because in our demos we always render Toolbar - see ecc.jsx).
    const [fallbackAroundElement, setFallbackAroundElement] = useState();

    let [popoverHidden, setPopoverHidden] = useState(true);
    if (toolbarHidden && !popoverHidden) {
      popoverHidden = true;
      setPopoverHidden(popoverHidden);
    }

    useLayoutEffect(() => {
      setAroundElement((v) => v || FALLBACK_AROUND_ELEMENT_MARKER);
    }, []);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <ToolbarProvider>
        {!toolbarHidden ? (
          <PopoverWithFadeIn
            hidden={popoverHidden}
            bottomSheet={false} // having toolbar in bottom sheet makes no sense (main page would be blocked while toolbar is shown)
            elementOffset={-verticalOffset}
            element={
              aroundElement === FALLBACK_AROUND_ELEMENT_MARKER ? fallbackAroundElement?.parentNode : aroundElement
            }
            preferredPosition="top-right"
          >
            <Box shape="background" colorScheme="building" significance="common">
              <SoftBackgroundProvider>
                <Toolbar.Content
                  className={Config.Css.css({
                    padding: UuGds.SpacingPalette.getValue(["fixed", "b"]),
                  })}
                  onVisibilityChange={(e) => setPopoverHidden(!e.data.visible)}
                />
              </SoftBackgroundProvider>
            </Box>
          </PopoverWithFadeIn>
        ) : null}
        {children({ elementRef: setAroundElement })}
        {aroundElement === FALLBACK_AROUND_ELEMENT_MARKER ? <span ref={setFallbackAroundElement} /> : null}
      </ToolbarProvider>
    );
    //@@viewOff:render
  },
});
//@@viewOff:helpers

function withToolbar(Component) {
  const Comp = createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withToolbar(${Component.uu5Tag || ""})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
      tooltip: PropTypes.lsi,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
      tooltip: undefined,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { toolbarless } = useToolbar();
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      let component;

      if (toolbarless) {
        component = (
          <ToolbarContainer>
            {({ elementRef }) => (
              <Component {...props} elementRef={Utils.Component.combineRefs(elementRef, props.elementRef)} />
            )}
          </ToolbarContainer>
        );
      } else {
        component = <Component {...props} />;
      }

      return component;
      //@@viewOff:render
    },
  });

  Utils.Component.mergeStatics(Comp, Component);

  return Comp;
}

export { withToolbar };
export default withToolbar;
