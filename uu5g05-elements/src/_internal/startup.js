import { Utils } from "uu5g05";
import Config from "../config/config.js"; // must be done in startup because it creates <style /> element and we need this to be done during startup, not later
import CyclicComponents from "./cyclic-components.js";
import * as CyclicComponentsWithDeps from "./cyclic-components-with-deps.js";
import UuGds from "./gds.js";
import { fallbackMethods } from "./alert-bus-context.js";
import Alerts from "./alerts.js";

Object.defineProperties(CyclicComponents, Object.getOwnPropertyDescriptors(CyclicComponentsWithDeps));

Config.Css.injectGlobal({
  "::selection": { backgroundColor: UuGds.ColorPalette.getValue(["meaning", "primary", "main"]), color: "#fff" },
  "::-webkit-datetime-edit-month-field:focus": {
    background: UuGds.ColorPalette.getValue(["meaning", "primary", "main"]),
    color: "#fff",
  },
  "::-webkit-datetime-edit-year-field:focus": {
    background: UuGds.ColorPalette.getValue(["meaning", "primary", "main"]),
    color: "#fff",
  },
  "::-webkit-datetime-edit-day-field:focus": {
    background: UuGds.ColorPalette.getValue(["meaning", "primary", "main"]),
    color: "#fff",
  },
});

Utils.EventManager.register("Uu5.applicationNeedsReload", (eventData) => {
  Promise.resolve().then(() => {
    if (!eventData?.handled) {
      fallbackMethods.addAlert(Alerts.applicationNeedsReload);
    }
  });
});
