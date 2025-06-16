//@@viewOn:imports
import {
  Utils,
  createVisualComponent,
  PropTypes,
  useRef,
  useEffect,
  PortalElementProvider,
  useAppBackground,
  BackgroundProvider,
} from "uu5g05";
import Config from "../config/config.js";
import ModalStandard from "../_modal/modal-standard.js";
import Button from "../button.js";
import Text from "../text.js";
import Icon from "../icon.js";
import UuGds from "../_internal/gds";
import useModalPortalElement from "../_modal/use-modal-portal-element.js";
import useModalTransition from "../_modal/use-modal-transition";
import Overlay from "../_modal/overlay";
import ModalView from "../_modal/modal-view";
import Body from "../_internal/body";
import withBottomSheet from "../_internal/with-bottom-sheet.js";
import { matchPopoverPortalType, getShapeStyles } from "../_modal/modal-content.js";
//@@viewOff:imports

const Css = {
  main: () => Config.Css.css({ textAlign: "center" }),
  dialog({ width, _maxHeight, shapeStyles }) {
    const staticClassName = Config.Css.css({
      ...shapeStyles,

      display: "flex",
      flexDirection: "column",
      transition: `background-color ${Config.MODAL_TRANSITION_DURATION}ms`,
      outline: "none",

      padding: 0,
      position: "relative",
      margin: "0 auto",
      maxWidth: "100%",
      maxHeight: _maxHeight ? _maxHeight : "100%",

      borderRadius: UuGds.getValue(["RadiusPalette", "box", "moderate"]),
    });

    const dynamicClassName = Config.Css.css({
      width: width === null ? undefined : width === "full" ? "100%" : width,
    });

    return [staticClassName, dynamicClassName].join(" ");
  },
  body: () =>
    Config.Css.css({
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
    }),
  iconText: () => Config.Css.css`
    && {
      line-height: normal;
      font-size: 64px;
      display: block;
      text-align: center;
    }
  `,
  content: () => Config.Css.css({ marginTop: 0, display: "block" }),
  info: (hasHeader) =>
    Config.Css.css({
      marginTop: hasHeader ? UuGds.getValue(["SpacingPalette", "fixed", "c"]) : undefined,
      display: "block",
    }),
  buttons: ({ actionDirection }) =>
    Config.Css.css({
      display: "flex",
      flexDirection: actionDirection === "vertical" ? "column" : "row",
      flex: actionDirection === "vertical" ? "none" : "1 0 0",
      gap: UuGds.getValue(["SpacingPalette", "fixed", "c"]), // TODO should be "e" for "cancel button", how to do that?
      marginTop: UuGds.getValue(["SpacingPalette", "fixed", "g"]),
    }),
};

let DialogView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DialogView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    open: ModalStandard.propTypes.open.isRequired,
    onClose: ModalStandard.propTypes.onClose,
    actionList: PropTypes.arrayOf(PropTypes.shape(Button.propTypes)).isRequired,
    header: PropTypes.node,
    icon: Icon.propTypes.icon,
    info: PropTypes.node,
    width: PropTypes.oneOfType([PropTypes.unit, PropTypes.oneOf(["full"])]),
    actionDirection: PropTypes.oneOf(["vertical", "horizontal"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    open: false,
    onClose: undefined,
    actionList: [],
    icon: undefined,
    header: undefined,
    info: undefined,
    width: 320,
    actionDirection: "vertical",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      open,
      icon,
      header,
      info,
      children,
      actionList,
      onClose,
      actionDirection,
      width,
      isMobileOrTablet,
      focusLockComponent: FocusLockComponent,
      _maxHeight,
      ...propsToPass
    } = props;

    const element = useModalPortalElement();
    const {
      ref: overlayRef,
      displayed,
      overlayClassName,
      dialogClassName,
    } = useModalTransition(open, true, isMobileOrTablet);

    const firstButtonRef = useRef();
    const dialogRef = useRef();

    useEffect(() => {
      if (open && !dialogRef.current?.contains(document.activeElement)) firstButtonRef.current?.focus();
    }, [open]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const buttonClassName = Config.Css.css({ flex: "1 1 auto" });
    const buttons = actionList.map((it, i) => {
      let props = { ...it };
      if (!props.itemList) {
        props.onClick = (...args) => {
          if (typeof it.onClick === "function") it.onClick(...args);
          if (!args[0]?.defaultPrevented && typeof onClose === "function") onClose(args[0]);
        };
      }
      return (
        <Button
          key={i}
          {...props}
          elementRef={i === 0 ? Utils.Component.combineRefs(props.elementRef, firstButtonRef) : props.elementRef}
          className={Utils.Css.joinClassName(buttonClassName, props.className)}
        />
      );
    });

    const [appBackground] = useAppBackground();
    const background = appBackground;
    let [shapeStyles, gdsBackground] = getShapeStyles({ background });

    const { ref, ...attrs } = Utils.VisualComponent.getAttrs(props, Css.dialog({ width, _maxHeight, shapeStyles }));

    return (
      displayed &&
      Utils.Dom.createPortal(
        <Overlay
          className={overlayClassName}
          elementRef={overlayRef}
          onClose={onClose}
          closeOnEsc={false}
          closeOnOverlayClick={false}
        >
          <ModalView
            className={Utils.Css.joinClassName(dialogClassName, propsToPass.className, Css.main())}
            _bottomSheetDisabled
          >
            <BackgroundProvider background={gdsBackground ?? appBackground}>
              <FocusLockComponent>
                {({ ref: focusLockRef, className: focusLockClassName, ...focusLockElementProps }) => (
                  <dialog
                    {...attrs}
                    open
                    tabIndex={0}
                    {...focusLockElementProps} // onFocus, onBlur, data-focus-lock*
                    className={Utils.Css.joinClassName(attrs.className, focusLockClassName)}
                    ref={Utils.Component.combineRefs(ref, dialogRef, focusLockRef)}
                  >
                    <PortalElementProvider filter={matchPopoverPortalType}>
                      <Body
                        paddingHorizontal={true}
                        paddingTop={true}
                        scrollIndicator="disappear"
                        contentMaxHeight="auto"
                        className={Css.body()}
                        skipContentSizeProvider={width === null}
                        width={typeof width === "number" ? width : undefined}
                      >
                        {icon && (
                          <Text className={Css.iconText()} colorScheme="dim">
                            <Icon testId="icon" icon={icon} />
                          </Text>
                        )}
                        {header && (
                          <Text
                            className={Css.content()}
                            colorScheme="building"
                            category="interface"
                            segment="title"
                            type="micro"
                          >
                            {header}
                          </Text>
                        )}
                        {info && (
                          <Text
                            className={Css.info(!!header)}
                            colorScheme="dim"
                            category="interface"
                            segment="content"
                            type="medium"
                          >
                            {info}
                          </Text>
                        )}
                        {children}
                        {buttons && buttons.length > 0 && (
                          <div data-testid="button-group" className={Css.buttons(props)}>
                            {buttons}
                          </div>
                        )}
                      </Body>
                    </PortalElementProvider>
                  </dialog>
                )}
              </FocusLockComponent>
            </BackgroundProvider>
          </ModalView>
        </Overlay>,
        element,
      )
    );
    //@@viewOff:render
  },
});

DialogView = withBottomSheet(DialogView, true);

export { DialogView };
export default DialogView;
