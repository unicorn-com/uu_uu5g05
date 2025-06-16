//@@viewOn:imports
import {
  createVisualComponent,
  PropTypes,
  useRef,
  useContentSize,
  useLayoutEffect,
  createComponent,
  ToolbarProvider,
  Utils,
  useValueChange,
  useDevice,
} from "uu5g05";
import _Modal from "./_modal/modal.js";
import Drawer from "./drawer.js";
import Config from "./config/config.js";
import useLazyFocusLockComponent from "./_modal/use-lazy-focus-lock-component.js";
import Toolbar from "./toolbar.js";

//@@viewOff:imports

//@@viewOn:helpers
function withToolbar(Component) {
  const ResultComponent = createComponent({
    uu5Tag: `withToolbar(${Component.uu5Tag})`,
    render(props) {
      const { children, ...otherProps } = props;

      return (
        <Component {...otherProps}>
          {(...args) => (
            <ToolbarProvider>
              <Toolbar _modal />
              {typeof children === "function" ? (
                children(...args)
              ) : (
                <div className={Config.Css.css(args[0]?.style)}>{children}</div>
              )}
            </ToolbarProvider>
          )}
        </Component>
      );
    },
  });
  Utils.Component.mergeStatics(ResultComponent, Component);
  return ResultComponent;
}

function useLeft(initialLeftOpen, leftOpen, onLeftChange) {
  const contentSize = useContentSize();

  const handleLeftChange =
    typeof onLeftChange === "function" ? (open) => onLeftChange(new Utils.Event({ open })) : null;

  return useValueChange(
    handleLeftChange ? leftOpen : initialLeftOpen == null ? ["xs", "s"].indexOf(contentSize) === -1 : initialLeftOpen,
    handleLeftChange,
  );
}

function ModalChildren({
  leftWidth,
  leftType,
  setLeftOpenRef,
  left,
  initialLeftOpen,
  leftOpen: leftOpenProp,
  onLeftChange,
  padding,
  children,
  ...otherProps
}) {
  const [leftOpen, setLeftOpen] = useLeft(initialLeftOpen, leftOpenProp, onLeftChange);
  const isChildrenFn = typeof children === "function";

  const { browserName } = useDevice();

  useLayoutEffect(() => {
    setLeftOpenRef.current = setLeftOpen;
  }, [setLeftOpenRef, setLeftOpen]);

  return (
    <Drawer
      {...otherProps}
      open={leftOpen}
      height="100%"
      width={leftWidth}
      type={leftType}
      onChange={(event) => setLeftOpen(event.data.open)}
      content={left}
      padding={!isChildrenFn ? padding : undefined}
      testId={leftOpen ? "drawer-open" : "drawer-closed"}
      _drawerClassName={
        // Safari has issue with calculating children height with using display: "grid" on the parent element.
        browserName === "safari" ? Config.Css.css({ gridTemplateRows: "minmax(auto, 100%)" }) : undefined
      }
    >
      {isChildrenFn ? (...args) => children({ style: padding, ...args }) : children}
    </Drawer>
  );
}
//@@viewOff:helpers

let Modal = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Modal",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ..._Modal.propTypes,
    initialLeftOpen: PropTypes.bool,
    leftWidth: PropTypes.number,
    leftType: Drawer.propTypes.type,
    left: PropTypes.any,
    leftOpen: PropTypes.bool,
    onLeftChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ..._Modal.defaultProps,
    scrollable: true,
    initialLeftOpen: undefined,
    leftWidth: undefined,
    leftType: undefined,
    left: undefined,
    leftOpen: undefined,
    onLeftChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      children,
      initialLeftOpen,
      leftWidth,
      leftType,
      left,
      leftOpen,
      onLeftChange,
      scrollable,
      actionLeft,
      ...propsToPass
    } = props;

    const setLeftOpenRef = useRef();

    const buttonLeftPanel = {
      icon: "uugds-sidebar-left",
      significance: "subdued",
      onClick: () => setLeftOpenRef.current((prev) => !prev),
      elementAttrs: { "aria-label": "menu" },
    };

    const focusLockComponent = useLazyFocusLockComponent(props.open);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <_Modal
        {...propsToPass}
        scrollable={left ? false : scrollable}
        actionLeft={left ? buttonLeftPanel : actionLeft}
        focusLockComponent={focusLockComponent}
      >
        {left
          ? (modalProps) => (
              <ModalChildren
                left={left}
                leftWidth={leftWidth}
                leftType={leftType}
                initialLeftOpen={initialLeftOpen}
                leftOpen={leftOpen}
                onLeftChange={onLeftChange}
                setLeftOpenRef={setLeftOpenRef}
                padding={modalProps.style}
                borderRadius={props.borderRadius}
              >
                {children}
              </ModalChildren>
            )
          : children}
      </_Modal>
    );
    //@@viewOff:render
  },
});

Modal = withToolbar(Modal);

export { Modal };
export default Modal;
