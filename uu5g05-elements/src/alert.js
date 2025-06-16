//@@viewOn:imports
import { createComponent, Utils, useLayoutEffect, useEffect, useState, PortalElementProvider } from "uu5g05";
import Config from "./config/config.js";
import { _useAlertBusContext } from "./_internal/_alert-bus-context.js";
import AlertContent from "./_internal/alert-content.js";
import UuGds from "./_internal/gds.js";
//@@viewOff:imports

const VERTICAL_POSITION = UuGds.getValue(["SpacingPalette", "fixed", "e"]); // TODO gds toto nespecifikuje
const HORIZONTAL_POSITION = UuGds.getValue(["SpacingPalette", "fixed", "h"]); // TODO gds toto nespecifikuje

const Css = {
  missingAlertBus: () => {
    return Config.Css.css({
      position: "fixed",
      top: HORIZONTAL_POSITION,
      left: 0,
      right: 0,
      margin: "0 auto",
      // margin: "0 32px 0 auto",
      width: "fit-content",
      maxWidth: `calc(100vw - ${VERTICAL_POSITION}px)`,
    });
  },
};

const Alert = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Alert",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...AlertContent.propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...AlertContent.defaultProps,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { registerAlert, unregisterAlert, container, alertMap, missingAlertBus } = _useAlertBusContext();

    const { elementProps, componentProps } = Utils.VisualComponent.splitProps(
      props,
      missingAlertBus ? Css.missingAlertBus(props) : undefined,
    );
    let { durationMs, ...otherProps } = componentProps;
    let { priority } = otherProps;

    // 10s for not error priority
    if (durationMs === undefined && priority !== "error" && props.colorScheme !== "negative") durationMs = 10000;

    const [alertId, setAlertId] = useState();
    let { visible, closeKey } = alertMap?.[alertId] || {};
    useEffect(() => {
      if (closeKey) {
        if (typeof props.onClose === "function") props.onClose();
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [closeKey]);

    // NOTE Must be in layout effect so that unregistration happens synchronously and therefore
    // AlertBus has chance to cloneNode so that it can do the exiting animation.
    useLayoutEffect(() => {
      let alertItem = registerAlert();
      setAlertId(alertItem.id);

      return () => unregisterAlert(alertItem.id);
    }, []);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let result = null;

    if (alertId && container) {
      result = Utils.Dom.createPortal(
        <PortalElementProvider>
          <AlertContent
            {...elementProps}
            {...otherProps}
            durationMs={durationMs}
            elementAttrs={{
              ...elementProps?.elementAttrs,
              "data-uu5-alert-id": alertId,
            }}
            _progressing={visible ?? true}
          />
        </PortalElementProvider>,
        container,
      );
    }

    return result;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Alert };
export default Alert;
