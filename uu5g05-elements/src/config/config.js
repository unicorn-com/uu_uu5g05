// This file was auto-generated according to the "namespace" setting in package.json.
// Manual changes to this file are discouraged, if values are inconsistent with package.json setting.
import mod from "module";
import { Utils } from "uu5g05";
import UuGds from "../_internal/gds.js";

const TAG = "Uu5Elements.";

let baseUri;
if (mod) {
  baseUri = (mod.uri || "").toString();
} else {
  let scriptEl = document.currentScript || Array.prototype.slice.call(document.getElementsByTagName("script"), -1)[0];
  baseUri = (scriptEl?.src || "").toString();
}
baseUri = baseUri ? baseUri.replace(/^(.*\/).*/, "$1") : "./";

export default {
  BASE_URI: baseUri,
  TAG,
  Css: Utils.Css.createCssModule(
    TAG.replace(/\.$/, "")
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z-]/g, ""),
    // TODO Uncomment after uu_appg01_devkit >= 5.3.0 is used.
    // process.env.NAME + "/" + process.env.OUTPUT_NAME + "@" + process.env.VERSION // this helps preserve proper order of styles among loaded libraries
    "uu5g05-elements" + "/" + process.env.OUTPUT_NAME + "@" + process.env.VERSION, // this helps preserve proper order of styles among loaded libraries
  ),
  MODAL_TRANSITION_DURATION: 300,
  COLLAPSIBLE_BOX_TRANSITION_DURATION: 300,
  ALERT_TRANSITION_DURATION: 300,
  MODAL_BUS_EXTRA_ITEM_OVERLAP: 32,
  INFO_ICON: "uugds-help",

  TOP_BAR_HEIGHT: 56,

  POPOVER_MENU_STYLES: {
    minWidth: 160,
    padding: UuGds.SpacingPalette.getValue(["fixed", "c"]),
  },

  zIndex: {
    modal: 1000,
    alert: 2000,
    popover: 990,
  },
};
