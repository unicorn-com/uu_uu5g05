import { Utils } from "uu5g05";

// lazy-filled to prevent cyclic dependencies
const fallbackMethods = {};

const [AlertBusContext, useAlertBusContext] = Utils.Context.create({
  addAlert: (props) => fallbackMethods.addAlert?.(props),
  updateAlert: (id, props) => fallbackMethods.updateAlert?.(id, props),
  removeAlert: (id) => fallbackMethods.removeAlert?.(id),
});

export { AlertBusContext, useAlertBusContext, fallbackMethods };
export default AlertBusContext;
