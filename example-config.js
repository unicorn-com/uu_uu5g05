// this file is added to the bundle as assets/example-config.js and can be used in demos for loader configuration

/* global window, location, parent */
(function () {
  let extraDemoDependencies = {
    ...window.uu5DemoDependencies, // can be defined in demo HTML page
  };

  let uuAppJsonEnvConfig = {}; // this line will be auto-replaced by devkit, do not change

  let currentUrl = new URL((location.href.startsWith("about:") && window.frameElement ? parent : window).location.href);
  let domain = currentUrl.hostname;
  let isLocalhostOrIp = domain === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(domain);
  let isDev = isLocalhostOrIp || domain === "uuapp-dev.plus4u.net";

  if (!window.uu5Environment) window.uu5Environment = {};
  window.uu5Environment.uu5loaderg01_initUuAppDisabled ??= false; // prefer using uuAppLibraryRegistry for loading dependecies
  if (isDev) {
    // prettier-ignore
    window.uu5Environment = {
      // "uu_app_oidc_providers_oidcg02_uri": "https://uuapp-dev.plus4u.net/uu-oidc-maing02/eca71064ecce44b0a25ce940eb8f053d/oidc",
      "uu5g05_libraryRegistryBaseUri": uuAppJsonEnvConfig.uuAppLibraryRegistryBaseUri || "https://uuapp-dev.plus4u.net/uu-applibraryregistry-maing01/000008ad5570455e83857a394f9a21c9",
      // "uu5g05_plus4UGoBaseUri": "https://uuapp-dev.plus4u.net/uu-plus4ugo-maing01/00000c3f57074bfcb759aba2d562e013",
      // "uu_plus4u5g02_identityManagementBaseUri": "https://uuapp-dev.plus4u.net/uu-identitymanagement-maing01/58ceb15c275c4b31bfe0fc9768aa6a9c",
      // "uu_plus4u5g02_commonServicesBaseUri": "https://uuapp-dev.plus4u.net/uu-commonservices-maing01/00000b33c474420aa887c972097b8024",
      // "uu_plus4u5g02_peopleBaseUri": "https://uuapp-dev.plus4u.net/uu-plus4upeople-maing01/0000004723544d1ab0b74000d9f7671c",
      // "uu_plus4u5g02_organizationBaseUri": "https://uuapp-dev.plus4u.net/uu-plus4uorganization-maing01/00000e17cfda49f49db73ed53ac8e4cf",
      ...window.uu5Environment,
    };
  }

  // TODO Remove when all libraries && demos && docs that use deep imports (such as `import ... from "uu5g05-elements/assets/demo/helpers.jsx"`)
  // are converted to use example-config.js with uuCloudg02 CDN support (uu5devkitg01 >= 1.2.0).
  window.addEventListener("DOMContentLoaded", () => {
    // add imports such as "uu5tilesg02/": "..." so that demos can import mock files such as `import MockAnimals from "uu5tilesg02/assets/mock/animals.jsx"`,
    let { imports: appliedImports } = window.Uu5Loader.config();
    for (let k in appliedImports) {
      if (!/@/.test(k) && !appliedImports[k + "/"] && /\//.test(appliedImports[k])) {
        appliedImports[k + "/"] = appliedImports[k].split("/").slice(0, -1).join("/") + "/";
      }
    }
    window.Uu5Loader.config({ imports: appliedImports });
  });

  // eslint-disable-next-line
  uu5DevkitFinishUu5LoaderConfig({ extraDemoDependencies, libraryCanBeMissingInUuAlr: isLocalhostOrIp }); // this line will be auto-replaced by devkit, do not change
})();
