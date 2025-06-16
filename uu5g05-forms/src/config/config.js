// This file was auto-generated according to the "namespace" setting in package.json.
// Manual changes to this file are discouraged, if values are inconsistent with package.json setting.
import mod from "module";
import { Utils } from "uu5g05";

const TAG = "Uu5Forms.";

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
    "uu5g05-forms" + "/" + process.env.OUTPUT_NAME + "@" + process.env.VERSION, // this helps preserve proper order of styles among loaded libraries
  ),

  COLOR_SCHEME_MAP: {
    success: "positive",
    warning: "warning",
    error: "negative",
  },

  SIZE_TYPO: {
    xxs: "xsmall",
    xs: "small",
    s: "medium",
    m: "medium",
    l: "large",
    xl: "large",
  },

  FORM_ITEM_VISUAL_PROPS: ["readOnly", "disabled", "size", "borderRadius", "layout", "messagePosition", "autoComplete"],
};
