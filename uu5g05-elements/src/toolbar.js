//@@viewOn:imports
import {
  BackgroundProvider,
  DeviceProvider,
  PropTypes,
  Utils,
  createVisualComponent,
  _useActivePublisher as useActivePublisher,
  useBackground,
  useCallback,
  useElementSize,
  useLayoutEffect,
  usePreviousValue,
  useRef,
  useState,
  useToolbar,
  useUnmountedRef,
  withStickyTop,
  withViewportStickyBottom,
} from "uu5g05";
import Config from "./config/config.js";
import UuGds from "./_internal/gds.js";
import Box from "./box.js";
import CollapsibleBox from "./collapsible-box.js";
import Line from "./line.js";
import useSpacing from "./use-spacing.js";
//@@viewOff:imports

//@@viewOn:constants
const TOOLBAR_CLOSE_ANIMATION_DURATION = 300;
const isViewportStickyBottom = DeviceProvider.device.isMobileOrTablet;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  contentWhenInToolbar: ({ background }) => {
    let borderColor = UuGds.getValue(["Shape", "line", background, "building", "subdued"]).default.colors?.border;
    return Config.Css.css({
      "&:where(&:has(>menu:not(:empty)))": {
        borderTop: borderColor ? "1px solid " + borderColor : undefined,
        borderBottom: borderColor ? "1px solid " + borderColor : undefined,
      },
    });
  },
  content: ({ spacing, _modal }) => {
    let paddingInline = spacing.d;
    if (_modal) paddingInline = paddingInline / 2;
    let paddingBlock = UuGds.SpacingPalette.getValue(["fixed", "c"]);
    return Config.Css.css({
      // NOTE Using flexbox instead of grid because of easier integration with ActionGroup default styles
      // (with CSS grid we would have to modify gridTemplateColumns to have stuff like minmax(36px, 200px)
      // based on ActionGroup contents so that shortenning of both left&right ActionGroup-s would work).
      display: "flex",
      columnGap: 4,
      "&:where(&:has(>menu:not(:empty)))": {
        paddingInline,
        paddingBlock,
      },
    });
  },
  menu: () => {
    return Config.Css.css({
      display: "contents",
    });
  },
  separator: ({ separatorWidth }) => {
    return Config.Css.css({
      flex: "0 10000 2px",
      width: 2, // for initial size when in absolutely-positioned ancestor (e.g. Popover)
      minWidth: 1,
      // if separator remained at 2px (it wasn't flex-shrinked to 1px), it means that there is enough space for both left&right toolbar,
      // i.e. we want the separator to be hidden
      visibility: Math.floor(separatorWidth) > 1 ? "hidden" : undefined,
      marginBlock: UuGds.SpacingPalette.getValue(["fixed"]).b,
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function Wrapper(props) {
  const { /*position,*/ background, children, setCounter } = props;
  useLayoutEffect(() => {
    setCounter((v) => v + 1);
    return () => setCounter((v) => v - 1);
  }, [setCounter]);

  // NOTE Reset background on context as the left/right toolbar content could have been rendered from
  // a component which is on full background, but the toolbar content is in the end in our own div (outside
  // of the full-bg component). Happened in uu5richtextg01 editor/input/e00.html with significance="highlighted".
  return children != null ? <BackgroundProvider background={background}>{children}</BackgroundProvider> : null;
}

function SoftBackgroundProvider({ children }) {
  const parentBackground = useBackground();
  const background = parentBackground === "light" ? "soft" : parentBackground;
  return <BackgroundProvider background={background}>{children}</BackgroundProvider>;
}
//@@viewOff:helpers

const ToolbarContent = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ToolbarContent",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onVisibilityChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onVisibilityChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onVisibilityChange, children, _modal, ...propsToPass } = props;
    const { setLeftElement, setRightElement } = useToolbar();
    const background = useBackground();
    const spacing = useSpacing();

    const leftRef = useRef();
    const rightRef = useRef();
    const unmountedRef = useUnmountedRef();

    const activePublisherElementAttrs = useActivePublisher();
    propsToPass.elementAttrs = {
      ...propsToPass.elementAttrs,
      ...activePublisherElementAttrs,
    };

    const [leftCounter, setLeftCounter] = useState(0);
    const usedSetLeftElement = useCallback(
      (element) => {
        let renderContent = (props) => (
          <Wrapper
            {...props}
            setCounter={(v) => (!unmountedRef.current ? setLeftCounter(v) : undefined)}
            background={background}
          />
        );
        setLeftElement(element, renderContent);
      },
      [background, setLeftElement, unmountedRef],
    );

    const [rightCounter, setRightCounter] = useState(0);
    const usedSetRightElement = useCallback(
      (element) => {
        let renderContent = (props) => (
          <Wrapper
            {...props}
            setCounter={(v) => (!unmountedRef.current ? setRightCounter(v) : undefined)}
            background={background}
          />
        );
        setRightElement(element, renderContent);
      },
      [background, setRightElement, unmountedRef],
    );

    const isEmpty = leftCounter + rightCounter === 0;

    // this remaining logic handles case when we detect that Toolbar became empty, i.e. we want
    // closing animation to take place (but we no longer have any content in our left/right portals
    // because it was already unmounted)
    //   => work around this by remembering last present DOM nodes in left/right portals and re-attach
    //      their DOM clones temporarily when starting the close animation
    const lastLeftDomElementRef = useRef();
    const lastRightDomElementRef = useRef();
    useLayoutEffect(() => {
      if (!isEmpty) {
        // NOTE Left/right children get removed by React before our effect so guard against it.
        if (leftRef.current?.lastChild || rightRef.current?.lastChild) {
          lastLeftDomElementRef.current = leftRef.current?.lastChild;
          lastRightDomElementRef.current = rightRef.current?.lastChild;
        }
      }
    });
    // NOTE We need to postpone sending of `collapsed={true}` into CollapsibleBox by 1 render,
    // because our re-attaching runs later than CollapsibleBox's effect (which reads our offsetHeight).
    //   => the postponed value is kept in isUsedEmpty
    let [isUsedEmpty, setIsUsedEmpty] = useState(isEmpty);
    if (!isEmpty && isUsedEmpty) {
      isUsedEmpty = false;
      setIsUsedEmpty(isUsedEmpty);
    }
    const wasEmpty = usePreviousValue(isEmpty, false);
    useLayoutEffect(() => {
      if (typeof onVisibilityChange === "function") onVisibilityChange(new Utils.Event({ visible: !isEmpty }));

      if (isEmpty && !wasEmpty) {
        // re-attach cloned content for a while
        let leftClone = lastLeftDomElementRef.current?.cloneNode(true);
        let rightClone = lastRightDomElementRef.current?.cloneNode(true);
        if (leftClone) leftRef.current.appendChild(leftClone);
        if (rightClone) rightRef.current.appendChild(rightClone);
        let cleanup = () => {
          leftClone?.remove();
          rightClone?.remove();
          lastLeftDomElementRef.current = undefined;
          lastRightDomElementRef.current = undefined;
        };
        let timeout = setTimeout(cleanup, TOOLBAR_CLOSE_ANIMATION_DURATION);
        setIsUsedEmpty(true);
        return () => {
          clearTimeout(timeout);
          cleanup();
        };
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [isEmpty]);

    const { ref: separatorSizeRef, width: separatorWidth } = useElementSize({ width: 2 });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(propsToPass, Css.content({ ...props, background, spacing, _modal }));

    const element = (
      <div {...attrs}>
        <menu className={Css.menu()} ref={Utils.Component.combineRefs(leftRef, usedSetLeftElement)} />
        {leftCounter > 0 && rightCounter > 0 ? (
          <Line
            colorScheme="building"
            significance="subdued"
            direction="vertical"
            className={Css.separator({ separatorWidth })}
            elementRef={separatorSizeRef}
          />
        ) : null}
        <menu className={Css.menu()} ref={Utils.Component.combineRefs(rightRef, usedSetRightElement)} />
        {typeof children !== "function" ? children : null}
      </div>
    );

    return typeof children === "function" ? children({ visible: !isEmpty, children: element }) : element;
    //@@viewOff:render
  },
});

const _Toolbar = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Toolbar",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onVisibilityChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onVisibilityChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onVisibilityChange, style: propsStyle, _modal, ...restProps } = props;
    const [visible, setVisible] = useState(false);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const propsStyleObject = typeof propsStyle === "string" ? Utils.Style.parse(propsStyle) : propsStyle;
    return (
      <CollapsibleBox collapsed={!visible}>
        {({ elementRef, style }) => (
          <Box
            {...restProps}
            shape="background"
            colorScheme="building"
            significance="common"
            elementRef={Utils.Component.combineRefs(elementRef, props.elementRef)}
            style={{
              ...propsStyleObject,
              ...style,
              transition: [propsStyleObject?.transition, style?.transition].filter(Boolean).join(", ") || undefined,
            }}
          >
            <SoftBackgroundProvider>
              {({ background }) => (
                // NOTE If we passed paddings (e.g. 8px around) onto CollapsibleBox, collapsed state would have
                // height 16px (and background). And `overflow: hidden`, etc. wouldn't do anything because of flexbox/grid usage.
                // => render extra div for our paddings
                <ToolbarContent
                  onVisibilityChange={(e) => {
                    setVisible(e.data.visible);
                    typeof onVisibilityChange === "function" && onVisibilityChange(e);
                  }}
                  className={isViewportStickyBottom ? undefined : Css.contentWhenInToolbar({ background })}
                  _modal={_modal}
                />
              )}
            </SoftBackgroundProvider>
          </Box>
        )}
      </CollapsibleBox>
    );
    //@@viewOff:render
  },
});

const Toolbar = isViewportStickyBottom ? withViewportStickyBottom(_Toolbar) : withStickyTop(_Toolbar);
Toolbar.Content = ToolbarContent;

export { Toolbar };
export default Toolbar;
