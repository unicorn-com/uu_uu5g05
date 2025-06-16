import { Utils, useLayoutEffect } from "uu5g05";
import AlertBus from "./alert-bus.js";
import { fallbackMethods, useAlertBusContext } from "./_internal/alert-bus-context";

const useAlertBus = useAlertBusContext;
const FALLBACK_ELEMENT_ID = "uu5-alert-bus-fallback";

let fallbackElement;
let fallbackElementUnmountTimeout;
let fallbackKeyCounter = 0;
fallbackMethods.addAlert = (props) => {
  clearTimeout(fallbackElementUnmountTimeout);
  if (!fallbackElement) {
    fallbackElement = document.createElement("div");
    fallbackElement.id = FALLBACK_ELEMENT_ID;
    document.body.appendChild(fallbackElement);
  }

  let result;
  Utils.Dom.flushSync(() => {
    Utils.Dom.render(
      <AlertBus _onLocalClean={unmountFallbackElement}>
        <AlertHelper key={fallbackKeyCounter++} onMount={(api) => (result = api.addAlert(props))} />
      </AlertBus>,
      fallbackElement,
    );
  });
  return result;
};

fallbackMethods.removeAlert = (id) => {
  let result;
  if (fallbackElement) {
    Utils.Dom.flushSync(() => {
      Utils.Dom.render(
        <AlertBus _onLocalClean={unmountFallbackElement}>
          <AlertHelper key={fallbackKeyCounter++} onMount={(api) => (result = api.removeAlert(id))} />
        </AlertBus>,
        fallbackElement,
      );
    });
  }
  return result;
};

fallbackMethods.updateAlert = (...args) => {
  let result;
  if (fallbackElement) {
    Utils.Dom.flushSync(() => {
      Utils.Dom.render(
        <AlertBus _onLocalClean={unmountFallbackElement}>
          <AlertHelper key={fallbackKeyCounter++} onMount={(api) => (result = api.updateAlert(...args))} />
        </AlertBus>,
        fallbackElement,
      );
    });
  }
  return result;
};

function AlertHelper({ onMount }) {
  let api = useAlertBusContext();
  useLayoutEffect(() => {
    onMount(api);
    //eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, []);
  return null;
}

function unmountFallbackElement() {
  // we have to do this in timeout, because this method is fired from effect (i.e. during react lifecycle processing
  // and it would show error if we tried to do unmount right now)
  fallbackElementUnmountTimeout ??= setTimeout(() => {
    fallbackElementUnmountTimeout = undefined;
    if (fallbackElement) {
      Utils.Dom.unmount(fallbackElement);
      fallbackElement.remove();
      fallbackElement = undefined;
    }
  }, 0);
}

export { useAlertBus, FALLBACK_ELEMENT_ID };
export default useAlertBus;
