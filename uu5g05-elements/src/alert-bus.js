//@@viewOn:imports
import {
  createVisualComponent,
  Utils,
  useState,
  PropTypes,
  useMemo,
  useEffect,
  useUpdateEffect,
  useRef,
  _usePortalElement as usePortalElement,
  useEvent,
} from "uu5g05";
import Config from "./config/config.js";
import AlertBusContext from "./_internal/alert-bus-context.js";
import _AlertBusContext from "./_internal/_alert-bus-context.js";
import Alert from "./alert.js";
import AlertBusView from "./_internal/alert-bus-view.js";
import Alerts from "./_internal/alerts.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:helpers
let closeKeyCounter = 0;

function useAlertPortalElement() {
  return usePortalElement({
    type: "alert",
    onCreate: (el) => {
      el.classList.add(Config.Css.css({ zIndex: Config.zIndex.alert }));
    },
  });
}
//@@viewOff:helpers

const AlertBus = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AlertBus",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    element: PropTypes.instanceOf(Element),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    element: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, element, _onLocalClean } = props;
    const [registeredAlertList, setRegisteredAlertList] = useState([]); // [{ id, visible, closeKey }]
    const [localAlertList, setLocalAlertList] = useState([]);
    const [container, setContainer] = useState();
    const portalElement = useAlertPortalElement();
    const counterRef = useRef(0);

    useUpdateEffect(() => {
      if (localAlertList.length === 0 && typeof _onLocalClean === "function") _onLocalClean();
    }, [localAlertList]);

    useEffect(() => {
      if (registeredAlertList.length === 0) {
        // reset counter if no alerts are registered within certain time (i.e. wait for any transitions that might be finishing),
        // we reset counter to re-use IDs as they're used in CSS selectors and we want to minimize number of injected rules
        let timeout = setTimeout(() => (counterRef.current = 0), Config.ALERT_TRANSITION_DURATION + 1000);
        return () => clearTimeout(timeout);
      }
    });

    function registerAlert() {
      const id = "a" + counterRef.current++; // start with character so that id is usable as grid-area identifier
      const newAlert = { id };

      setRegisteredAlertList((oldAlertList) => {
        return [newAlert, ...oldAlertList];
      });

      return newAlert;
    }

    function unregisterAlert(id) {
      setRegisteredAlertList((oldAlertList) => oldAlertList.filter((alert) => alert.id !== id));
    }

    function addAlert(alertProps) {
      const newAlert = alertProps?.id ? alertProps : { ...alertProps, id: Utils.String.generateId() };

      setLocalAlertList((oldAlertList) => [...oldAlertList, newAlert]);

      return newAlert.id;
    }

    function removeAlert(id) {
      setLocalAlertList((oldAlertList) => oldAlertList.filter((alert) => alert.id !== id));
    }

    function updateAlert(id, alertProps) {
      setLocalAlertList((oldAlertList) => {
        return oldAlertList.map((alert) => {
          if (alert.id === id) {
            return { ...alert, ...alertProps };
          } else {
            return alert;
          }
        });
      });
    }

    function handleCloseAll(e) {
      ++closeKeyCounter;
      setRegisteredAlertList((list) => list.map((it) => ({ ...it, closeKey: closeKeyCounter + "" })));
    }

    function handleVisibilityChange(e) {
      let { visibilityMap } = e.data;
      setRegisteredAlertList((list) => list.map((it) => ({ ...it, visible: visibilityMap[it.id] ?? it.visible })));
    }

    const alertMap = useMemo(() => {
      let map = {};
      for (let item of registeredAlertList) map[item.id] = item;
      return map;
    }, [registeredAlertList]);

    const contextValue = useMemo(() => ({ addAlert, removeAlert, updateAlert }), []);
    const _contextValue = useMemo(
      () => ({ registerAlert, unregisterAlert, container, alertMap }),
      [alertMap, container],
    );

    // 1st AlertBus on page will handle special alerts
    useEvent("Uu5.applicationNeedsReload", (eventData) => {
      if (eventData && !eventData.handled) {
        eventData.handled = true;
        addAlert(Alerts.applicationNeedsReload);
      }
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <AlertBusContext.Provider value={contextValue}>
        <_AlertBusContext.Provider value={_contextValue}>
          {children}
          {localAlertList.map(({ id, ...alert }) => (
            <Alert key={id} {...alert} onClose={() => removeAlert(id)} />
          ))}
          {
            // NOTE Must be rendered even if having empty list because it might be still transitioning (exiting) previous alerts.
            Utils.Dom.createPortal(
              <AlertBusView
                portalRef={setContainer}
                alertList={registeredAlertList}
                onCloseAll={handleCloseAll}
                onVisibilityChange={handleVisibilityChange}
              />,
              element || portalElement,
            )
          }
        </_AlertBusContext.Provider>
      </AlertBusContext.Provider>
    );
    //@@viewOff:render
  },
});

export { AlertBus };
export default AlertBus;
