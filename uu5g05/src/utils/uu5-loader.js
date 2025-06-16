import convertResolvedDependencyMap from "./systemjs-back-compat/convert-resolved-dependency-map.js";

const envGlobal = typeof self !== "undefined" ? self : global;
let Uu5Loader =
  envGlobal.Uu5Loader || (envGlobal.SystemJS ? initLoaderLegacySystemJSAdapter(envGlobal.SystemJS) : null);

if (process.env.NODE_ENV === "test" && !Uu5Loader) {
  Uu5Loader = (() => {
    if (typeof __non_webpack_require__ === "function") {
      // for webpack & if running Jest in another library (and we're transitive dependency of that library)
      return new Proxy(
        {},
        {
          get: (target, key) => {
            try {
              // NOTE uu5loaderg01 will currently be available because uu_appg01_devkit depends on it. The code
              // below handles also case if uu_appg01_devkit stops being dependent.
              // eslint-disable-next-line no-undef
              return __non_webpack_require__("uu5loaderg01")[key];
            } catch (e) {
              if (e.code !== "MODULE_NOT_FOUND") throw e;
              throw new Error(
                'Uu5Loader not present. Add "uu5loaderg01": "*" to devDependencies in your package.json, install and try again.',
              );
            }
          },
        },
      );
    } else {
      // for Jest if running tests directly in this project (unusual syntax overcomes webpack warnings)
      return eval("require")("uu5loaderg01");
    }
  })();
}

// TODO Remove when systemjs@0.19.47 is no longer in use anywhere.
function initLoaderLegacySystemJSAdapter(LegacySystemJS) {
  let Adapter = {
    import: LegacySystemJS.import.bind(LegacySystemJS),
    config: (opts) => {
      if (opts && typeof opts === "object") {
        if (opts.resolvedDependencyMap) {
          opts = convertResolvedDependencyMap(
            opts.resolvedDependencyMap,
            Adapter.config(),
            Adapter,
            (typeof self !== "undefined" ? self : global).uu5Environment || {},
            { preferNonminifiedUrls: false },
          );
        }
        let packages = {};
        if (opts.scopes) {
          packages = {};
          for (let key in opts.scopes) {
            packages[key] = { map: opts.scopes[key] };
          }
        }
        let newConfig = {
          paths: opts.imports || {},
          meta: opts.meta || {},
          depCache: opts.dependencyMap || {},
          packages,
        };
        LegacySystemJS.config(newConfig);
      }
      let fullConfig = LegacySystemJS.getConfig();
      let scopes = {};
      if (fullConfig.packages) {
        for (let key in fullConfig.packages) {
          scopes[key.replace(/\/*$/, "/")] = fullConfig.packages[key].map;
        }
      }
      let result = { imports: fullConfig.paths, meta: fullConfig.meta, dependencyMap: fullConfig.depCache, scopes };
      return result;
    },
    resolve: (name) => {
      let result = LegacySystemJS.normalizeSync(name);
      return result.slice(-name.length - 1) === "/" + name ? null : result;
    },
    get: (name) => LegacySystemJS.get(Adapter.resolve(name) || name),
    refreshCache: () => {
      let reloadPromises = [];
      let config = Adapter.config();
      let urlSet = new Set(Object.values(config.imports));
      for (let url of urlSet) {
        if (/^(https?:|\.\/|\/)/.test(url)) {
          reloadPromises.push(fetch(url, { cache: "reload" }).catch((e) => null));
        }
      }
      return Promise.all(reloadPromises);
    },
  };
  return Adapter;
}

export { Uu5Loader };
export default Uu5Loader;
