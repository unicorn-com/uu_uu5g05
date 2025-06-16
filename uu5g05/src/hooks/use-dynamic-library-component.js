//@@viewOn:imports
import { useRef, useState, useEffect } from "./react-hooks.js";
import {
  getNamespaceMapItem,
  importByNamespace,
  getValueByNamespace,
  componentMap,
  splitNamespaceWithMaybeVersionTagToParts,
} from "../utils/library-registry.js";
import LoggerFactory from "../utils/logger-factory.js";
import Config from "../config/config.js";
import EventManager from "../utils/event-manager.js";
//@@viewOff:imports

const ERROR_COMPONENT_MISSING = "COMPONENT_MISSING";
const ERROR_LIBRARY_NOT_ALLOWED = "LIBRARY_NOT_ALLOWED";
const EVENT_STATE_CHANGE = "Uu5.useDynamicLibraryComponent.stateChange";

let loggedLibraryNotAllowed = {};

let logger;
function getLogger() {
  if (!logger) logger = LoggerFactory.get(Config.TAG + "useDynamicLibraryComponent");
  return logger;
}

let pendingCount = 0;

function useDynamicLibraryComponent(uu5Tag) {
  let { Component, error } = getComponentByName(uu5Tag);
  let forceUpdate = useForceUpdate();
  useEffect(() => {
    let active = true;
    if (Component == null && error == null) {
      loadComponentByName(uu5Tag, () => (active ? forceUpdate() : null));
    }
    return () => (active = false);
  }, [forceUpdate, uu5Tag, Component, error]);

  let state = error != null ? "errorNoData" : Component != null ? "ready" : "pendingNoData";

  useEffect(() => {
    const isPending = state.startsWith("pending");
    if (isPending) {
      pendingCount += 1;
      EventManager.trigger(EVENT_STATE_CHANGE, { data: { pendingCount } });
      return () => {
        pendingCount -= 1;
        EventManager.trigger(EVENT_STATE_CHANGE, { data: { pendingCount } });
      };
    }
  }, [state]);

  return {
    Component: Component ?? null,
    errorData: error ? { error } : null,
    state,
  };
}

//@@viewOn:helpers
function useForceUpdate() {
  let [, setValue] = useState(0);
  return useRef(() => setValue((c) => 1 - c)).current;
}

/**
 * @return Synchronously returns { Component, error } by component name if it is available in the page.
 *         "Component" is component class, "error" is error if the library where component was supposed
 *         to be has been already attempted to load and failed.
 */
function getComponentByName(uu5TagMaybeWithVersion) {
  let result;
  if (typeof uu5TagMaybeWithVersion === "string") {
    let library;
    const [uu5Tag, generation, majorVersion] = splitNamespaceWithMaybeVersionTagToParts(uu5TagMaybeWithVersion);
    // NOTE Stuff in componentMap (i.e. components registered via Utils.LibraryRegistry.registerComponent(Componnet))
    // currently does not support multiple generations/versions => use uu5Tag only.
    if (componentMap[uu5Tag]) {
      library = getNamespaceMapItem(uu5Tag, false)?.library;
      result = { error: undefined, Component: componentMap[uu5Tag] };
    } else if (uu5Tag.indexOf(".") === -1) {
      // div, span, ...
      result = { error: undefined, Component: uu5Tag };
    } else {
      let error;
      let Component;
      let item = getNamespaceMapItem(uu5Tag, false, false, generation, majorVersion);
      if (item && item.ready) {
        error = item.error;
        if (!error) {
          Component = getValueByNamespace(item.exports, uu5Tag.slice(item.namespace.length + 1));
          if (Component == null) {
            error = new Error(
              `Component ${uu5Tag} not found in exports of library ${item.name} (namespace ${item.namespace}).`,
            );
            error.code = ERROR_COMPONENT_MISSING;
          }
        }
      }
      // allow adjusting of the result for uu5g04
      if (useDynamicLibraryComponent._backCompatGetComponent) {
        ({ Component, error } = useDynamicLibraryComponent._backCompatGetComponent(uu5Tag, item, Component, error));
      }
      result = error != null || Component != null ? { error, Component } : {};
      library = item?.library;
    }

    if (!result.error && result.Component && library?.type === "3rdparty-lib") {
      result.error = new Error(
        `Library '${library.name}' (${library.code}) cannot be used as a source of dynamic library components.`,
      );
      result.error.code = ERROR_LIBRARY_NOT_ALLOWED;
      result.Component = null;
      if (!loggedLibraryNotAllowed[library.code]) {
        loggedLibraryNotAllowed[library.code] = true;
        getLogger().error(result.error);
      }
    }
  }
  return result;
}

function loadComponentByName(uu5TagMaybeWithVersion, onReady) {
  const [uu5Tag, generation, majorVersion] = splitNamespaceWithMaybeVersionTagToParts(uu5TagMaybeWithVersion);
  return importByNamespace(uu5Tag, onReady, false, generation, majorVersion);
}
//@@viewOff:helpers

export { useDynamicLibraryComponent, getComponentByName, loadComponentByName };
export default useDynamicLibraryComponent;
