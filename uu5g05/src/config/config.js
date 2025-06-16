// This file was auto-generated according to the "namespace" setting in package.json.
// Manual changes to this file are discouraged, if values are inconsistent with package.json setting.
import Css from "../utils/css.js";

const TAG = "Uu5.";

export default {
  TAG,
  Css: Css.createCssModule(
    TAG.replace(/\.$/, "")
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z-]/g, ""),
    // TODO Uncomment after uu_appg01_devkit >= 5.3.0 is used.
    // process.env.NAME + "/" + process.env.OUTPUT_NAME + "@" + process.env.VERSION // this helps preserve proper order of styles among loaded libraries
    "uu5g05" + "/" + process.env.OUTPUT_NAME + "@" + process.env.VERSION, // this helps preserve proper order of styles among loaded libraries
  ),

  LAYOUT_STICKY_HEIGHT: 80, // estimated height of stickied elements, e.g. when scrolling to fragment
  USER_PREFERENCES_LOCAL_STORAGE_PREFIX: "uu5.up.",
};
