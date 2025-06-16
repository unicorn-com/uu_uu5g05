/**
 * Copyright (C) 2021 Unicorn a.s.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License at
 * <https://gnu.org/licenses/> for more details.
 *
 * You may obtain additional information at <https://unicorn.com> or contact Unicorn a.s. at address: V Kapslovne 2767/2,
 * Praha 3, Czech Republic or at the email: info@unicorn.com.
 */

import Tools from "../_internal/tools.js";
import LibraryLoader, {
  CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP,
  isCdnRangeVersion,
  getLogicalVersionFromUrl,
} from "../_internal/library-loader.js";
import Uu5Loader from "../utils/uu5-loader.js";
import { libraryLoadUri, libraryLoadDisabled, uu5StringUsesLatestMajorVersions } from "../uu5-environment.js";
import Dom from "./dom.js";
import LoggerFactory from "./logger-factory.js";
import Config from "../config/config.js";

const ERROR_LIBRARY_JSON_LOAD_FAILURE = "LIBRARY_JSON_LOAD_FAILURE";
const ERROR_LIBRARY_MISSING_SOURCE = "LIBRARY_MISSING_SOURCE";
const ERROR_LIBRARY_REGISTRY_DISABLED = "LIBRARY_REGISTRY_DISABLED";

const NAMESPACE_LATEST_SUBKEY = "latest";

const componentMap = {}; // extra registered components (via registerComponent() API calls)
const namespaceMap = {};

let logger;
function getLogger() {
  if (!logger) logger = LoggerFactory.get(Config.TAG + "Utils.LibraryRegistry");
  return logger;
}

const LibraryRegistry = {
  _libraryMap: {}, // name (e.g. "uu5g04-bricks") => { name, version, namespace }
  _namespaceMap: namespaceMap, // namespace (e.g. "UU5.Bricks") => { name, version, namespace, exports, ready, promise, library } (see use-dynamic-library-component.js)
  _backCompatGetLibrary: null, // (libraryCode) => ({ version: "" }) // backward-compatibility field for usage in uu5g04 (UU5.Environment getLibrary)
  _loadLibraryCache: {},
  _componentMap: componentMap, // uu5Tag => Component class

  registerLibrary({ name, version, namespace }) {
    // NOTE Kept here for old libraries (built by devkit < 4.3.0) which do not export
    // info about their version/name/namespace.
    LibraryRegistry._libraryMap[name] = { name, version, namespace };
    LibraryRegistry._libraryMap[name + "@" + version] = { name, version, namespace };
  },

  listLibraries() {
    let config = Uu5Loader.config();
    let urlToInfoMap = {};
    let nameToUrlSetMap = {};
    let latestMajors = [];
    _iterateAllImports(config, (name, url, scope) => {
      let exports = Uu5Loader.get(url);
      if (name.endsWith("@latestMajor")) {
        latestMajors.push(url);
      } else if (exports) {
        // uu5-libs have always name and version, 3rd-party can have version (rarely name) but e.g. react-dom
        // has version "18.2.0-next-..." which we don't want to use, i.e. these will fall back to CDN version
        let usedVersion = (exports.name && exports.version) || _getVersionFromUrl(url);
        let usedName = (typeof exports !== "function" ? exports.name : null) || name.split("@")[0] || name; // create-react-class has exports.name === "h" (because it's a minified function)
        nameToUrlSetMap[usedName] ??= new Set();
        nameToUrlSetMap[usedName].add(url);
        urlToInfoMap[url] = {
          name: usedName,
          version: usedVersion,
          namespace:
            exports.namespace ||
            LibraryRegistry._libraryMap[usedName + "@" + usedVersion]?.namespace ||
            LibraryRegistry._libraryMap[usedName]?.namespace,
          url,
        };
      }
    });
    for (let url of latestMajors) {
      if (urlToInfoMap[url]) urlToInfoMap[url].latestMajor = true;
    }
    let libraryList = [];
    for (let urlList of Object.values(nameToUrlSetMap)) {
      for (let url of urlList) {
        libraryList.push(urlToInfoMap[url]);
      }
    }
    libraryList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return libraryList;
  },

  async getLibrary(namespace, { generation, version } = {}) {
    // TODO Use Utils.Request API when ready.
    let dtoIn = {
      code: namespace,
    };
    if (generation != null) {
      dtoIn.generation = generation;
    }
    if (version != null) {
      dtoIn.version = typeof version === "number" ? version + ".x" : version;
    } else {
      let library = LibraryRegistry._backCompatGetLibrary?.(namespace);
      library && library.version && (dtoIn.version = library.version);
    }

    let cacheKey = JSON.stringify(dtoIn); // intentionally without versionConstraintMap
    let cache = LibraryRegistry._loadLibraryCache;
    if (!cache[cacheKey]) {
      // add versionConstraintMap to dtoIn
      let versionConstraintMap = {};
      let config = Uu5Loader.config();
      _iterateAllImports(config, (importName, url, scope) => {
        let exports = Uu5Loader.get(url);
        if (exports) return; // is already loaded => will be added below when we iterate over listLibraries() and will use real versions from exports, not just estimations based on versions in URLs
        let [name, version] = importName.split("@");
        if (!name || !version) {
          let versionInUrl = url.match(/(\d+\.\d+\.\d+(?:-[^/]*)?)/)?.[1];
          if (isCdnRangeVersion(versionInUrl, url)) return;
          name = importName;
          version = versionInUrl;
        }
        if (!name || !version || !version.match(/^\d+\.\d+\.\d+/)) return;
        versionConstraintMap[name] ??= new Set();
        versionConstraintMap[name].add(version);
      });

      // also add versions of libraries that got registered using Utils.LibraryRegistry.registerLibrary during their startup
      // (so that our constraints are filled also in case that uuApp uses old config for Uu5Loader, i.e. the one without versions)
      LibraryRegistry.listLibraries().forEach(({ name, version }) => {
        if (!version) return;
        let cdnMatch = version.match(CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP);
        if (cdnMatch) return; // we have downloaded .../1.0.0/xyz.js from CDN (<=> 1.x) but it didn't register via registerLibrary(), i.e. we don't know its exact version (it's recognized as 1.999.0) => skip (it should be "latest" in that major so uuAppLibraryRegistry will likely send the same version)
        versionConstraintMap[name] ??= new Set();
        versionConstraintMap[name].add(version);
      });

      // simplify the map (to make URL shorter, so we can do GET instead of POST)
      let simpleVersionConstraintMap = { ...versionConstraintMap };
      for (let k in simpleVersionConstraintMap) {
        let set = simpleVersionConstraintMap[k];
        if (set.size === 1) simpleVersionConstraintMap[k] = set.values().next().value;
        else simpleVersionConstraintMap[k] = [...simpleVersionConstraintMap[k]];
      }
      dtoIn.versionConstraintMap = simpleVersionConstraintMap;

      // add "code" to URL so that it's visible even if using POST
      // NOTE If we add "code" to URL, it must still remain in dtoIn when doing POST because backend ignores URL params for POST.
      let url = new URL(libraryLoadUri, document.baseURI);
      url.searchParams.set("code", dtoIn.code);
      cache[cacheKey] = {
        result: null,
        error: null,
        promise: (async () => {
          try {
            let json;
            let canUseGet = encodeURIComponent(JSON.stringify(dtoIn)).length < 1950;
            if (canUseGet) {
              json = await _fetchJson(url + "", "get", dtoIn);
            } else {
              try {
                json = await _fetchJson(url + "", "post", dtoIn);
              } catch (e) {
                // NOTE Added status 403 for case when a special gateway is used which enables CORS only for GET methods.
                // TODO This is not entirely correct because uuAppLibraryRegistry >= 3.0.0 won't receive versionConstraintMap and
                // could send newer versions of libraries than what are in the page (e.g. uu5g05-editing 1.13.0 while page has uu5g05 1.12.2).
                if (e.status === 405 || e.status === 403) {
                  // "post" is not allowed, i.e. uuAppLibraryRegistry backend is < 3.0.0 => fall back to "get" without versionConstraintMap
                  delete dtoIn.versionConstraintMap;
                  json = await _fetchJson(url + "", "get", dtoIn);
                } else {
                  throw e;
                }
              }
            }
            if (json) {
              let { uuAppErrorMap } = json;
              if (Object.keys(uuAppErrorMap || {}).length > 0) {
                for (let [key, value] of Object.entries(uuAppErrorMap)) {
                  if (!/dependency/i.test(key) || !value) continue;
                  // NOTE Not using logger so that these warnings are visible on production for now.
                  console[value.type === "error" ? "error" : "warn"](
                    `There was an issue while loading ${dtoIn.code}: ` + value.message,
                    "\nParams:",
                    value.paramMap,
                    "\nRelated resolution result:",
                    json.resolvedDependencyMap,
                  );
                }
              }
            }
            return json;
          } catch (fetchError) {
            let error = new Error(
              "Loading library ended with status " +
                fetchError.status +
                " on url: " +
                url +
                " with dtoIn: " +
                JSON.stringify(dtoIn),
            );
            error.dtoOut = fetchError.dtoOut;
            let { uuAppErrorMap } = error.dtoOut || {};
            if (typeof uuAppErrorMap === "object" && uuAppErrorMap) {
              for (let k in uuAppErrorMap) {
                if (uuAppErrorMap[k]?.type === "error") {
                  error.code = k;
                  break;
                }
              }
            }
            error.cause = fetchError;
            throw error;
          }
        })().then(
          (json) => {
            cache[cacheKey].result = json;
            return json;
          },
          (err) => {
            cache[cacheKey].error = err;
            return Promise.reject(err);
          },
        ),
      };
    }
    return cache[cacheKey].promise;
  },

  importLibrary(namespaceWithMaybeVersion) {
    let [namespace, generation, majorVersion] = splitNamespaceWithMaybeVersionTagToParts(namespaceWithMaybeVersion);
    return new Promise((resolve, reject) => {
      try {
        let onReady = (item) => (item.error ? reject(item.error) : resolve(item.exports));
        importByNamespace(namespace, onReady, true, generation, majorVersion);
      } catch (e) {
        reject(e);
      }
    });
  },

  registerComponent(Component) {
    let { uu5Tag, displayName } = Component;
    if (!uu5Tag) uu5Tag = displayName;
    let uu5stringTag = uu5Tag.split("(").pop().replace(/\)/g, ""); // withXyz(UU5.Bricks.Abc) -> UU5.Bricks.Abc
    componentMap[uu5stringTag] = Component;
  },

  // NOTE Currently overwritten in startup.js due to cyclic dependencies.
  getComponentByUu5Tag: (uu5Tag) => {},
};

//@@viewOn:helpers
function getNamespaceMapItem(uu5TagOrNamespace, create = false, isNamespaceExact = false, generation, majorVersion) {
  let estimatedLibNamespace;
  if (isNamespaceExact) {
    // it's namespace
    estimatedLibNamespace = uu5TagOrNamespace;
  } else {
    // it's uu5Tag
    let nameParts = uu5TagOrNamespace.split(".");
    if (nameParts.length >= 3) {
      estimatedLibNamespace = nameParts[0] + "." + nameParts[1];
      // before using the 2-segment namespace, try checking 1-segment namespace with deeper nested component
      let singleSegmentNamespaceItem = getNamespaceMapItem(nameParts[0], false, true, generation, majorVersion);
      if (singleSegmentNamespaceItem) {
        let Component = getValueByNamespace(
          singleSegmentNamespaceItem.exports,
          uu5TagOrNamespace.slice(singleSegmentNamespaceItem.namespace.length + 1),
        );
        if (Component !== undefined) return singleSegmentNamespaceItem;
      }
    } else {
      estimatedLibNamespace = nameParts[0];
    }
  }
  let item = _getFromNamespaceMap(estimatedLibNamespace, generation, majorVersion);
  if (Uu5Loader) {
    // normalize item if library was registered via LibraryRegistry.registerLibrary() (i.e. load exports from Uu5Loader,
    // set it as ready, etc.).
    if (item && !item.ready && !item.promise && item.exports === undefined && item.name) {
      // prefer getting by url as we may have multiple versions of the same library (name) loaded
      item.exports = Uu5Loader.get(item.url) || Uu5Loader.get(item.name);
      if (item.exports === undefined) {
        // this can happen if we're running within Uu5Loader.import, because Uu5Loader.get(...) works only after Uu5Loader.import() fully finishes
        // (this happens typically only in HTML demo pages as they call ReactDOM.render immediately; apps are not affected
        // as they use pattern Uu5Loader.import("./index.js").then(Index => Index.render("targetElement"))) => wait for Uu5Loader
        item.ready = false;
        item.callbacks = [];
        item.promise = Promise.resolve().then(() => {
          item.exports = Uu5Loader.get(item.url) || Uu5Loader.get(item.name);
          _processItemReady(item, uu5TagOrNamespace, generation, majorVersion);
          return item.exports;
        });
      } else {
        item.ready = true;
      }
    }
    if (item && !item.ready && !item.promise && item.exports === undefined && item.name) {
      item.ready = true;
      item.exports = Uu5Loader.get(item.url) || Uu5Loader.get(item.name);
    }
  }
  if (!item && create) {
    namespaceMap[estimatedLibNamespace] ??= {};
    let subKey = _toNamespaceItemSubKey(generation, majorVersion);
    namespaceMap[estimatedLibNamespace][subKey] = item = { namespace: estimatedLibNamespace }; // NOTE Can change after library registry JSON is obtained.
  }
  // consider all items as errored out if library registry is disabled and they are not ready yet
  if (libraryLoadDisabled && !item?.ready) {
    let error = new Error(
      `${
        isNamespaceExact ? "Library with namespace" : "Component"
      } ${uu5TagOrNamespace} could not have been loaded because usage of library registry is disabled in UU5.Environment.`,
    );
    error.code = ERROR_LIBRARY_REGISTRY_DISABLED;
    item = { ready: true, error };
  }
  return item;
}

function importByNamespace(uu5Tag, onReady, isNamespaceExact, generation = undefined, majorVersion = undefined) {
  let item = getNamespaceMapItem(uu5Tag, true, isNamespaceExact, generation, majorVersion);
  if (item.ready) {
    if (!item.promise) item.promise = Promise.resolve();
    onReady(item);
  } else if (!item.promise) {
    item.callbacks = [onReady];
    item.promise = (async () => {
      let libraryJson;
      try {
        libraryJson = await LibraryRegistry.getLibrary(item.namespace, { generation, version: majorVersion });
      } catch (e) {
        // try namespace with both parts (e.g. was trying to load component "Plus4U5.UuConsole", i.e. item.namespace
        // was "Plus4U5" and there's no such library in registry => fall back to full "Plus4U5.UuConsole")
        if (
          !isNamespaceExact &&
          (e.code === "uu-applibraryregistry-main/library/load/libraryDoesNotExist" ||
            e.code === "uu-applibraryregistry-main/library/get/libraryNotFound" ||
            e.code === "uu-applibraryregistry-main/library/get/libraryDoesNotExist") &&
          item.namespace.indexOf(".") === -1
        ) {
          let updatedNamespace = uu5Tag.split(".", 2).join(".");
          try {
            libraryJson = await LibraryRegistry.getLibrary(updatedNamespace, { generation, version: majorVersion });
            item.namespace = updatedNamespace;
          } catch (e) {
            e.message = `Failed to load library registry JSON for library with namespace ${updatedNamespace}: ${e.message}`;
            e.code = ERROR_LIBRARY_JSON_LOAD_FAILURE;
            throw e;
          }
        } else {
          e.message = `Failed to load library registry JSON for library with namespace ${item.namespace}: ${e.message}`;
          e.code = ERROR_LIBRARY_JSON_LOAD_FAILURE;
          throw e;
        }
      }
      item.library = libraryJson;
      if (!item.name) item.name = libraryJson?.name;
      if (!item.version) item.version = libraryJson?.version;
      if (libraryJson?.code && libraryJson.code !== item.namespace) {
        // we might have been loading 'Uu5Bricks.Select' (due to name 'Uu5Bricks.Select.Item') and server returned 'Uu5Bricks'
        if (isNamespaceExact) {
          let e = new Error(
            `Failed to load library registry JSON for library with namespace ${item.namespace}. The registry only contains library with namespace ${libraryJson.code}.`,
          );
          e.code = ERROR_LIBRARY_JSON_LOAD_FAILURE;
          throw e;
        }
        item.namespace = libraryJson.code;
      }
      if (!libraryJson?.sourceUri && !libraryJson?.source) {
        let error = new Error(
          `Library ${
            libraryJson?.name
          } is missing 'sourceUri' field in the library registry. Full library JSON:\n${JSON.stringify(
            libraryJson,
            null,
            2,
          )}`,
        );
        error.code = ERROR_LIBRARY_MISSING_SOURCE;
        throw error;
      }
      let { exports, problems } = await LibraryLoader.importLibrary(libraryJson, {
        getRuntimeLibraries: () => LibraryRegistry._libraryMap,
        registerLibrary: LibraryRegistry.registerLibrary,
        backCompatGetLibrary: LibraryRegistry._backCompatGetLibrary,
      });
      item.exports = exports;
      item.problems = problems;
    })()
      .catch((e) => {
        item.problems = e.problems;
        let error = e.error || e;
        error.message = `Error loading ${uu5Tag}: ${error.stack || error}`;
        error.wasOffline = navigator.onLine === false;
        item.error = error;
        Tools.error(error);
      })
      .finally(() => _processItemReady(item, uu5Tag, generation, majorVersion));
  } else {
    item.callbacks.push(onReady);
  }
  return item.promise;
}

function getValueByNamespace(obj, key) {
  if (key === "") return obj && obj.default !== undefined ? obj.default : obj; // if the library has single default export acting like a component (~UuForum)
  let result = obj;
  let keyParts = key.split(".");
  while (result != null && keyParts.length > 0) result = result[keyParts.shift()];
  return result;
}

function splitNamespaceWithMaybeVersionTagToParts(namespaceMaybeWithVersion) {
  let match = namespaceMaybeWithVersion.match(/^([^_]*)_g(\d\d)v(\d+)$/);
  return match ? [match[1], Number(match[2]), Number(match[3])] : [namespaceMaybeWithVersion];
}

function _processItemReady(item, uu5Tag, generation, majorVersion) {
  item.ready = true;
  let { problems, callbacks } = item;
  if (problems) {
    problems.forEach(({ message, ...context }) => {
      Tools.error(`Problem with loading ${_toVersionedUu5Tag(uu5Tag, generation, majorVersion)}: ${message}`, context);
    });
    delete item.problems;
  }
  Dom._batchedUpdates(() => {
    callbacks.forEach((fn) => fn(item));
  });
  delete item.callbacks;
}

async function _fetchJson(uri, method, dtoIn) {
  let finalUri = uri;
  let body = dtoIn && dtoIn != null && method === "post" ? JSON.stringify(dtoIn) : undefined;
  if (method === "get") {
    let uriWithParams = new URL(finalUri, document.baseURI);
    if (dtoIn) {
      for (let k in dtoIn) {
        uriWithParams.searchParams.set(k, typeof dtoIn[k] === "object" ? JSON.stringify(dtoIn[k]) : dtoIn[k]);
      }
    }
    finalUri = uriWithParams + "";
  }

  let response, json;
  try {
    response = await fetch(finalUri, {
      method,
      body,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });
    json = await response.json();
  } catch (e) {
    return Promise.reject(_makeFetchError(finalUri, dtoIn, response, json, e));
  }
  if (!response.ok) return Promise.reject(_makeFetchError(finalUri, dtoIn, response, json));
  return json;
}
function _makeFetchError(uri, dtoIn, response, dtoOut, cause) {
  let error = new Error("Fetch failed for URI: " + uri);
  error.dtoIn = dtoIn;
  if (cause != null) error.cause = cause;
  if (response != null) error.status = response.status;
  if (dtoOut != null) error.dtoOut = dtoOut;
  return error;
}

function _iterateAllImports(config, callbackFn) {
  if (!config) return;
  let { imports, scopes } = config;
  let iterateImports = (importMap, scope) => {
    if (!importMap) return;
    for (let k in importMap) callbackFn(k, importMap[k], scope);
  };
  if (imports) {
    iterateImports(imports);
  }
  if (scopes) {
    for (let [scope, scopeImports] of Object.entries(scopes)) {
      iterateImports(scopeImports, scope);
    }
  }
}

function _getVersionFromUrl(url) {
  let versionInUrl = url.match(/(\d+\.\d+\.\d+(?:-[^/]*)?)/)?.[1];
  return getLogicalVersionFromUrl(versionInUrl, url);
}

let loaderListChecked = false;
function _getFromNamespaceMap(namespace, generation, majorVersion) {
  let subKey = _toNamespaceItemSubKey(generation, majorVersion);
  let value = namespaceMap[namespace]?.[subKey];
  if (!value && !loaderListChecked) {
    // TODO Optimize - add Uu5Loader.addEventListener("load", ...) to get info about newly loaded library ASAP, fill our
    // namespaceMap at that time, and then we can safely just use namespaceMap here, instead of re-iterating currently
    // loaded libraries.

    // namespaceMap might be not fully actual => update
    loaderListChecked = true;
    for (let valueMap of LibraryRegistry.listLibraries()) {
      if (!valueMap.namespace) continue;
      namespaceMap[valueMap.namespace] ??= {};
      if (!uu5StringUsesLatestMajorVersions || valueMap.latestMajor) {
        // NOTE Item with "latest" subkey can be also created in getNamespaceMapItem(?, true, ...), i.e.
        // when it's not created here and we decide to load the component.
        // Here we just populate the subkey from already-loaded libraries (based on info from Uu5Loader, which
        // possibly knows that some libraries are latestMajor if uuApp used initUuApp i.e. dependency/load).
        namespaceMap[valueMap.namespace][NAMESPACE_LATEST_SUBKEY] ??= { ...valueMap };
      }
      if (!valueMap.version) continue;
      let itemGeneration = valueMap.name?.match(/g(\d\d)(-.*)$/)?.[1];
      if (!itemGeneration) continue;
      itemGeneration = Number(itemGeneration);
      let itemMajorVersion = Number(valueMap.version.replace(/\..*/, ""));
      let itemSubKey = _toNamespaceItemSubKey(itemGeneration, itemMajorVersion);
      namespaceMap[valueMap.namespace][itemSubKey] = { ...valueMap };
    }
    Promise.resolve().then(() => (loaderListChecked = false));
    value = namespaceMap[namespace]?.[subKey];
  }
  return value;
}
function _toNamespaceItemSubKey(generation, majorVersion) {
  return generation != null && majorVersion != null
    ? "g" + (generation + "").padStart(2, "0") + "v" + majorVersion
    : NAMESPACE_LATEST_SUBKEY;
}
function _toVersionedUu5Tag(uu5Tag, generation, majorVersion) {
  return (
    uu5Tag +
    (generation != null && majorVersion != null ? "_g" + (generation + "").padStart(2, "0") + "v" + majorVersion : "")
  );
}
//@@viewOff:helpers

export {
  LibraryRegistry,
  importByNamespace,
  getNamespaceMapItem,
  getValueByNamespace,
  splitNamespaceWithMaybeVersionTagToParts,
  componentMap,
  ERROR_LIBRARY_JSON_LOAD_FAILURE,
};
export default LibraryRegistry;
