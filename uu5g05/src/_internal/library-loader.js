import Uu5Loader from "../utils/uu5-loader.js";
import Version from "./version.js";
import { getCdnUri } from "../uu5-environment.js";

const ERROR_LIBRARY_INCOMPATIBLE = "LIBRARY_INCOMPATIBLE";
const ERROR_LIBRARY_LOAD_FAILED = "LIBRARY_LOAD_FAILED";
const CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP = /^(\d+)\.999\.0$/; // CDN 1.0.0 -> registered 1.999.0
const CDN_LATEST_VERSION_TO_EXACT_VERSION_SUFFIX = ".999.0";

let importLibraryCache = {};

const LibraryLoader = {
  async importLibrary(libraryJson, { getRuntimeLibraries, registerLibrary, backCompatGetLibrary }) {
    // TODO Simplify.
    let { exports, problems } = await new Promise((resolve, reject) => {
      _importLibrary(libraryJson, (exports, error, problems) => {
        if (error) {
          reject({ error, problems });
        } else {
          resolve({ exports, problems });
        }
      });
    });
    return { exports, problems };

    function _getSourceUrl(library) {
      let result;
      if (library && library.name && library.version) {
        let sourceName = library.name.replace(/^uu_uu5/, "uu5"); // some libraries include duplicit uu (vendor) in their registration (uu_uu5g04), most don't
        let baseName = sourceName.replace(/-.*/, ""); // remove -bricks, ... suffix
        if (baseName.indexOf("_") === -1 && baseName.startsWith("uu")) baseName = "uu_" + baseName; // baseName needs duplicit uu (vendor)
        baseName = baseName.replace(/_/g, "-");
        result = getCdnUri(
          baseName +
            "/" +
            library.version +
            "/" +
            sourceName +
            (process.env.NODE_ENV === "production" ? ".min.js" : ".js", { isMissingOnCdnG02: true }),
        );
      }
      return result;
    }

    function _getModuleConfig(name, code, runtimeLibraries) {
      let configuredUrl;
      let configuredVersion;
      let libConf = backCompatGetLibrary?.(code);
      if (runtimeLibraries[name]) {
        configuredVersion = runtimeLibraries[name].version;
      } else if (libConf && libConf.version) configuredVersion = libConf.version;
      let systemUrl = Uu5Loader.resolve(name);
      configuredUrl = systemUrl;
      if (configuredVersion && (!libConf || !libConf.version)) {
        // check for major version of loaded runtime library because on CDN it's handled as "last version of this major version"
        // (but that meaning is not applied to 3rd-party libs and libraries with concrete version set on Environment)
        configuredVersion = getLogicalVersionFromUrl(configuredVersion, systemUrl);
      }
      // use version from Uu5Loader config if the library is not registered
      // via LibraryRegistry.registerLibrary
      if (!configuredVersion) {
        let cdnVersion = configuredUrl ? (systemUrl.match(Version.REGEX) || {})[0] : null;
        if (cdnVersion) {
          // check for major version because on CDN it's handled as "last version of this major version"
          // (but that meaning is not applied to 3rd-party libs)
          configuredVersion = getLogicalVersionFromUrl(cdnVersion, systemUrl);
        }
      }
      return { configuredUrl, configuredVersion };
    }

    function _validateAndRegisterLibrary(
      name,
      version,
      url,
      code,
      dependencyOf,
      runtimeLibraries = getRuntimeLibraries(),
    ) {
      let problems = [];
      let { configuredUrl, configuredVersion } = _getModuleConfig(name, code, runtimeLibraries);

      // special case - for submodules within single product (e.g. uu5g04-forms within uu5g04) force the version
      // according to the main module, i.e. if requesting uu5g04-forms@1.15.3 and the page has uu5g04@1.15.2 we'll
      // force 1.15.2 for uu5g04-forms.
      let usedUrl = configuredUrl || url;
      let isSubmodule = name.match(
        /^(uu5g04-(bricks|forms|bricks-editable|block-layout|hooks)|uu_plus4u5g01-(app|bricks|uubmldraw|hooks))$/,
      ); // limiting only for our known submodules because there're libraries with names that look like submodules but are not (e.g. uu_plus4u5g01-uuforum)
      let isForcedSubmoduleVersion = false;
      if (isSubmodule) {
        let mainModule = name.replace(/-.*/, "");
        let mainModuleCode;
        if (code) mainModuleCode = code.split(".", 2).join(".");
        let { configuredVersion: mainVersion } = _getModuleConfig(mainModule, mainModuleCode, runtimeLibraries);
        if (mainVersion) {
          isForcedSubmoduleVersion = true;
          configuredVersion = mainVersion;
          if (!dependencyOf) version = configuredVersion; // force compatibility if loading directly a submodule (if validating as a dependency of a normal module then configure too but still check for compatibility - which should pass as the deps should be using major version only)
          if (!configuredUrl) {
            // if the lib URL has been already configured, we'll assume it's already correct (if we changed it and the lib was already loaded then it would get re-imported from this new URL & re-executed)
            if (usedUrl) {
              configuredUrl = usedUrl.replace(
                /\/\d+\.\d+\.\d+[^/]*/,
                (m) => "/" + getUrlVersionFromLogical(configuredVersion, usedUrl),
              );
            } else {
              configuredUrl = _getSourceUrl({
                name,
                version: getUrlVersionFromLogical(configuredVersion),
              });
            }
            Uu5Loader.config({ imports: { [name]: configuredUrl } });
          }
        }
      }

      if (configuredVersion && !configuredUrl) {
        if (version === configuredVersion || version === getUrlVersionFromLogical(configuredVersion)) {
          configuredUrl = url;
          Uu5Loader.config({ imports: { [name]: configuredUrl } });
        } else {
          // situation: we're loading library B which depends on library A; library A is pre-configured
          // to be in specific version via LibraryRegistry.registerLibrary(A) but info from libRegistry
          // about B specifies that it depends on different version of A
          //   => use the pre-configured version of A but since we don't have the URL for it (and it wasn't configured
          //      in Uu5Loader either), we'll guess it
          configuredUrl = _getSourceUrl({ name, version: configuredVersion });
          Uu5Loader.config({ imports: { [name]: configuredUrl } });
        }
      }

      let compatible =
        !configuredVersion || isForcedSubmoduleVersion || Version.compare(version, configuredVersion) <= 0;
      if (
        compatible &&
        configuredVersion &&
        !isForcedSubmoduleVersion &&
        new Version(version).major < new Version(configuredVersion).major
      ) {
        problems.push({
          message:
            `Page contains ${name} in version ${configuredVersion.replace(
              CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP,
              "latest $1.x",
            )}, dynamically-loaded component requested to use ${
              dependencyOf ? "library " + dependencyOf + " requiring dependency " + name + " in " : ""
            }OLDER version ${version}. ` +
            "The already-present (newer) version of the library / dependency will be used, i.e. request for older version is skipped. " +
            "The library should update its dependencies to newer versions to prevent this error.",

          libraryName: dependencyOf || name,
          dependencyName: dependencyOf ? name : null,
          requestedVersion: version,
          inPageVersion: configuredVersion.replace(CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP, "latest $1.x"),
        });
        version = configuredVersion;
      }
      if (compatible && configuredVersion && !isForcedSubmoduleVersion) {
        version = configuredVersion;
      }
      if (!compatible && configuredVersion && new Version(version).major > new Version(configuredVersion).major) {
        if (
          name === "uu5g04" ||
          name === "uu_plus4u5g01" ||
          name === "uu_appg01_core" ||
          name === "uu_appg01" ||
          name === "uu_appg01_oidc" ||
          name === "uu_oidcg01"
        ) {
          // don't allow overwriting of uu5g04 / uu_plus4u5g01
          problems.push({
            message:
              `Page contains ${name} in version ${configuredVersion.replace(
                CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP,
                "latest $1.x",
              )}, dynamically-loaded component requested to use ${
                dependencyOf ? "library " + dependencyOf + " requiring dependency " + name + " in " : ""
              }NEWER version ${version}. ` +
              "The already-present (older) version of the library / dependency will be used, i.e. request for newer version is skipped. Application should " +
              "update its dependencies configuration to use newest versions or it should restrict versions of dynamically loaded libraries " +
              "using Uu5.Utils.LibraryRegistry.registerLibrary API.",

            libraryName: dependencyOf || name,
            dependencyName: dependencyOf ? name : null,
            requestedVersion: version,
            inPageVersion: configuredVersion.replace(CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP, "latest $1.x"),
          });
          compatible = true;
          version = configuredVersion;
        } else {
          // NOTE We're handling bigger major version as being compatible (with error) to handle situation:
          // 1. Library A is released in new major version (2.0.0).
          // 2. Library B wants to use A@2.0.0 - it gets registered to library registry and has dependency there with A@2.0.0.
          // 3. All existing apps which use A@1.x and do dynamic loading will start failing because library registry will now
          //    be returning newest B with dependency A@2.0.0 (i.e. major versions don't match).
          problems.push({
            message:
              `Page contains ${name} in version ${configuredVersion.replace(
                CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP,
                "latest $1.x",
              )}, dynamically-loaded component requested to use ${
                dependencyOf ? "library " + dependencyOf + " requiring dependency " + name + " in " : ""
              }NEWER version ${version}. ` +
              "Library / dependency in NEWER version will be loaded and will overwrite already present one. Application should " +
              "update its dependencies configuration to use newest versions or it should restrict versions of dynamically loaded libraries " +
              "using Uu5.Utils.LibraryRegistry.registerLibrary API.",

            libraryName: dependencyOf || name,
            dependencyName: dependencyOf ? name : null,
            requestedVersion: version,
            inPageVersion: configuredVersion.replace(CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP, "latest $1.x"),
          });
          compatible = true;
          configuredVersion = configuredUrl = null;
        }
      }

      // NOTE We'll allow the flow to continue even if requesting incompatible version - log it
      // and use already-present one.
      if (!compatible) {
        problems.push({
          message:
            `Page contains ${name} in version ${configuredVersion.replace(
              CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP,
              "latest $1.x",
            )}, dynamically-loaded component requested to use ${
              dependencyOf ? "library " + dependencyOf + " requiring dependency " + name + " in " : ""
            }NEWER version ${version}. ` +
            "The already-present (older) version of the library / dependency will be used, i.e. request for newer version is skipped. Application should " +
            "update its dependencies configuration to use newest versions or it should restrict versions of dynamically loaded libraries " +
            "using Uu5.Utils.LibraryRegistry.registerLibrary API.",

          libraryName: dependencyOf || name,
          dependencyName: dependencyOf ? name : null,
          requestedVersion: version,
          inPageVersion: configuredVersion,
        });
        compatible = true;
        version = configuredVersion;
      }

      if (compatible) {
        if (!runtimeLibraries[name] || !configuredVersion) {
          registerLibrary({ name, version, namespace: code });
        }
        if (!url) {
          problems.push({
            message: "Library / dependency does not have any source URL specified.",
            libraryName: dependencyOf || name,
            dependencyName: dependencyOf ? name : null,
          });
        }
      }
      return { configuredUrl, configuredVersion, compatible, isSubmodule, isForcedSubmoduleVersion, problems };
    }

    function _getLoaderConfig(library) {
      let result;
      if (library.resolvedDependencyMap) {
        result = _getLoaderConfigFromResolvedDependencyMap(library);
      } else {
        result = _getLoaderConfigFromDependencyMapLegacy(library);
      }
      return result;
    }

    function _getLoaderConfigFromResolvedDependencyMap(library, existingConfig = Uu5Loader.config()) {
      let compatible = true;
      let depsCompatible = true;
      let configuredUrl;
      let url = library.sourceUri;
      let importName = library.name + "@" + library.version;
      let config = { resolvedDependencyMap: library.resolvedDependencyMap }; // uu5loaderg01 >= 1.7.0
      return { config, importName, compatible, depsCompatible, configuredUrl, url, problems: [] };
    }

    function _getLoaderConfigFromDependencyMapLegacy(library) {
      let paths = {};
      let runtimeLibraries = getRuntimeLibraries();

      // some libraries include duplicit uu (vendor) in their registration (uu_uu5g04), most don't => remove
      // it because "import" statements are without it
      let name = library.name.replace(/^uu_uu5/, "uu5");
      let version = library.version;
      let url = library.sourceUri || library.source || _getSourceUrl(library);
      let code = library.code;

      let { compatible, configuredUrl, configuredVersion, isSubmodule, isForcedSubmoduleVersion, problems } =
        _validateAndRegisterLibrary(name, version, url, code, null, runtimeLibraries);
      let depsCompatible = true;
      if (compatible) {
        if (!configuredUrl) paths[name] = url;
        let dependencies = library.dependencyMap;

        // special case - this whole library is a submodule of a product (e.g. uu5g04-forms) and
        // thus we want this library to be the same version as main module (e.g. uu5g04) => update
        // version of all dependencies that are submodules of our product (e.g. uu5g04-bricks)
        if (isSubmodule && isForcedSubmoduleVersion && (configuredUrl || url)) {
          dependencies = { ...dependencies };
          let productUrlBase = (configuredUrl || url).replace(/(\/\d+\.\d+\.\d+[^/]*\/).*/, "$1"); // strip what's after version
          let productUrlBaseNoVersion = productUrlBase.replace(/\/\d+\.\d+\.\d+[^/]*\/$/, "/");
          Object.keys(dependencies).forEach((key) => {
            let value = dependencies[key];
            if (value && value.startsWith(productUrlBaseNoVersion)) {
              dependencies[key] =
                productUrlBaseNoVersion + configuredVersion + "/" + value.substr(productUrlBase.length);
            }
          });
        }

        // validate dependencies
        Object.keys(dependencies).forEach((key) => {
          let value = dependencies[key];
          let depName = key.replace(/^uu_uu5/, "uu5");
          let isVersionOnly = /^\d/g.test(value);
          let depUrl = isVersionOnly ? _getSourceUrl({ name: depName, version: value }) : value;
          let depVersion = isVersionOnly ? value : (value.match(Version.REGEX) || {})[0];
          let depCode = null;

          let {
            compatible,
            configuredUrl,
            problems: subProblems,
          } = _validateAndRegisterLibrary(depName, depVersion, depUrl, depCode, name, runtimeLibraries);
          if (!compatible) {
            depsCompatible = false;
          } else if (!configuredUrl) paths[depName] = depUrl;
          if (subProblems) problems = problems.concat(subProblems);
        });
      }
      return {
        compatible,
        configuredUrl,
        depsCompatible,
        config: { imports: paths },
        url,
        importName: name,
        problems,
      };
    }

    function _importLibrary(library, callback) {
      let query = library.id + "_" + library.version;
      let cache = importLibraryCache;
      if (!cache[query]) {
        cache[query] = {
          result: null,
          error: null,
          pendingCallback: [callback],
        };
        let { config, importName, compatible, depsCompatible, configuredUrl, url, problems } =
          _getLoaderConfig(library);
        cache[query].problems = problems;
        if (compatible && depsCompatible && (configuredUrl || url)) {
          Uu5Loader.config(config);

          Uu5Loader.import(importName).then(
            (libraryComponents) => {
              cache[query].result = libraryComponents;
              cache[query].pendingCallback.forEach((fn) => fn(cache[query].result, null, cache[query].problems));
            },
            (e) => {
              let error = new Error(
                `Cannot import library ${library.name} (namespace ${library.code}) - loading failed with cause: ` +
                  (e.stack || e),
              );
              error.cause = e;
              error.code = ERROR_LIBRARY_LOAD_FAILED;
              cache[query].error = error;
              cache[query].pendingCallback.forEach((fn) => fn(null, cache[query].error, cache[query].problems));
            },
          );
        } else {
          let error = new Error(
            `Cannot import library ${library.name} (namespace ${library.code}) - it is not compatible or has no URL specified.`,
          );
          error.code = ERROR_LIBRARY_INCOMPATIBLE;
          cache[query].error = error;
          cache[query].pendingCallback.forEach((fn) => fn(null, cache[query].error, cache[query].problems));
        }
      } else if (cache[query].result || cache[query].error) {
        callback(cache[query].result, cache[query].error, cache[query].problems);
      } else {
        cache[query].pendingCallback.push(callback);
      }
    }
  },
};

function isCdnRangeVersion(version, systemUrl) {
  return version && version.match(/^\d+\.0\.0$/) && (!systemUrl || systemUrl.indexOf("/libs/") === -1);
}

function getLogicalVersionFromUrl(version, systemUrl) {
  let result = version;
  if (isCdnRangeVersion(version, systemUrl)) {
    result = version.replace(/\..*/, "") + CDN_LATEST_VERSION_TO_EXACT_VERSION_SUFFIX;
  }
  return result;
}

function getUrlVersionFromLogical(logicalVersion, systemUrl) {
  let result = logicalVersion;
  if (logicalVersion && (!systemUrl || systemUrl.indexOf("/libs/") === -1)) {
    result = logicalVersion.replace(CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP, "$1.0.0");
  }
  return result;
}

export {
  ERROR_LIBRARY_INCOMPATIBLE,
  ERROR_LIBRARY_LOAD_FAILED,
  CDN_LATEST_VERSION_TO_EXACT_VERSION_REGEXP,
  isCdnRangeVersion,
  getLogicalVersionFromUrl,
};
export default LibraryLoader;
