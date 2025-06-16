import { Utils } from "uu5g05";
import Config from "../config/config.js";

const globalAlertMap = {};
const ALERT_CONTAINER_ID = "alert-container-default";
let container;

const [_AlertBusContext, _useAlertBusContext] = Utils.Context.create({
  registerAlert() {
    container ??= document.getElementById(ALERT_CONTAINER_ID);
    if (!container) {
      container = document.createElement("div");
      container.id = ALERT_CONTAINER_ID;
      container.className = Config.Css.css({ position: "relative", zIndex: Config.zIndex.alert });
      document.body.appendChild(container);
    }

    const alertId = "a" + Utils.String.generateId();
    globalAlertMap[alertId] = {};

    return { id: alertId };
  },
  unregisterAlert(id) {
    delete globalAlertMap[id];

    if (container && Object.keys(globalAlertMap).length === 0) {
      container.parentNode.removeChild(container);
      container = undefined;
    }
  },
  get container() {
    return container;
  },
  missingAlertBus: true,
});

export { _AlertBusContext, _useAlertBusContext };
export default _AlertBusContext;
