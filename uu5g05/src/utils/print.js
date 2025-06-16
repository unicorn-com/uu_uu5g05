import String from "./string.js";
import Language from "./language.js";
import Lsi from "./lsi";
import EventManager from "./event-manager";
// eslint-disable-next-line no-unused-vars
import importLsi from "../lsi/import-lsi.js"; // DO NOT REMOVE! It is required, so that Lsi.store gets defined.

const printBlockers = new Map();

const beforePrintEventListener = () => {
  printBlockers.forEach((callback) => callback && callback());
  alert(Language.getItem(Lsi.store.uu5g05).Print.notReadyAlert);
};

const addPrintEventListener = () => {
  EventManager.register("beforeprint", beforePrintEventListener, window);
};

const removePrintEventListener = () => {
  EventManager.unregister("beforeprint", beforePrintEventListener, window);
};

const Print = {
  registerPrintBlocker: (printRequestCallback) => {
    const id = String.generateId();

    const prevSize = printBlockers.size;
    printBlockers.set(id, printRequestCallback);
    if (prevSize === 0 && printBlockers.size > 0) addPrintEventListener();

    return id;
  },
  unregisterPrintBlocker: (id) => {
    const prevSize = printBlockers.size;
    printBlockers.delete(id);
    if (prevSize > 0 && printBlockers.size === 0) removePrintEventListener();
  },
};

export { Print };
export default Print;
