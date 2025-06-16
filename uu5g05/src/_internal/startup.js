import LoggerFactory from "../utils/logger-factory.js";
import Config from "../config/config.js"; // must be done in startup because it creates <style /> element and we need this to be done during startup, not later
import "./normalize-css.js";
import Tools from "./tools.js";
import { getComponentByName } from "../hooks/use-dynamic-library-component.js";
import { LibraryRegistry } from "../utils/library-registry.js";

// add global error handler which will forward errors to our logger
let logger;
let lastError;
window.addEventListener("error", function (e) {
  // if the error is cross-origin, it won't be available in e.error and the only message we'd get
  // is ~"Script error." with absolutely no additional information (no stack trace, no file name, ...)
  // => ignore these for now and let them be shown in the console (the console will show full error details)
  if (!e.error) return;

  // React sometimes re-throws the same error, making it be shown twice in the console => log it only once
  if (e.error !== lastError) {
    if (!logger) logger = LoggerFactory.get(Config.TAG + "globalErrorHandler");
    logger.error("Unexpected error.", e.error);
  }
  e.preventDefault();
  lastError = e.error;
});

// globally disable window.open("javascript:...")
let origWindowOpen = window.open;
window.open = function (...args) {
  let url = args[0];
  if (url) url = args[0] = Tools.sanitizeHref(url);
  return origWindowOpen.apply(this, args);
};

// finalize Utils.LibraryRegistry API
// TODO This is here because of cyclic dependencies (getComponentByName needs access to
// useDynamicLibraryComponent._backCompatGetComponent for proper integration with uu5g04 and useDynamicLibraryComponent
// needs access to Utils.LibraryRegistry - maybe move that field to Utils.LibraryRegistry which will allow us
// to move the whole getComponentByName to Utils.LibraryRegistry).
LibraryRegistry.getComponentByUu5Tag = getComponentByName;
