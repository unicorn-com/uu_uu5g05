import UtilsUu5Loader from "./utils/uu5-loader.js";

const LIB_NAME = process.env.NAME;

const G04_RENAME_MAP = {
  COMPONENT_REGISTRY_URL: LIB_NAME + "_libraryLoadUri",
  useLibraryRegistry: LIB_NAME + "_libraryLoadDisabled",
  statisticsLogLibrariesUri: LIB_NAME + "_libraryStatsUri",
  allowStatistics: LIB_NAME + "_libraryStatsDisabled",
  COMPONENT_RENDER_UVE: LIB_NAME + "_componentUveUri",
  fontCssUrl: LIB_NAME + "_fontUri",
  trustedDomainRegexp: LIB_NAME + "_trustedUriRegExp",
  iconLibraries: LIB_NAME + "_iconLibraryMap",
  textEntityReplace: "uu5stringg01_textEntityDisabled",
  uu5DataMap: "uu5stringg01_uu5DataMap",
  defaultLanguage: LIB_NAME + "_defaultLanguage",
};

function normalizeEnv(env, inPlace = false) {
  // if 'env' contains g04 keys then rename them to g05 ones (app might be fully uu5g04-only but
  // g04 loads g05 automatically and delegates stuff to g05 and g05 components recognize only g05 env keys)
  // NOTE We do this in g05 because some keys are used ASAP (fontCssUri, ...).
  let result = inPlace ? env : {};
  if (env) {
    let modEnv = { ...env };
    if (modEnv.useLibraryRegistry != null) modEnv.useLibraryRegistry = !modEnv.useLibraryRegistry;
    if (modEnv.allowStatistics != null) modEnv.allowStatistics = !modEnv.allowStatistics;
    if (modEnv.textEntityReplace != null) modEnv.textEntityReplace = !modEnv.textEntityReplace;

    for (let key in modEnv) {
      let keyg05 = G04_RENAME_MAP[key];
      let g05Key = keyg05 || key;
      result[g05Key] = modEnv[key];
    }
  }
  return result;
}

// NOTE Originally we wanted to do normalization (g04 keys to g05 keys) only for legacy UU5.Environment
// variable, but we must do it always because uuAppServer when preparing environment for uuApp from deploy
// configuration doesn't know which key is for which generation so it would have to keep using UU5.Environment only
// (which we don't want).
const uuAppEnvironment = normalizeEnv(window.uu5Environment || window.UU5?.Environment, !!window.uu5Environment);
const uuAppEnvironmentGet = (key, defaultValue) => {
  return uuAppEnvironment[key] == null ? defaultValue : uuAppEnvironment[key];
};

function get(name, defaultValue) {
  const key = `${LIB_NAME}_${name}`;
  return uuAppEnvironmentGet(key, defaultValue);
}

let appBaseUri;
let appBasePath;
let loc = (location.href.slice(0, 6) === "about:" && window.frameElement ? parent : window).location;
let baseEl = document.querySelector("base");
if (baseEl) {
  appBasePath = baseEl.getAttribute("data-uu-app-base");
} else {
  appBasePath = (loc.pathname || "").replace(/^(.*)\/.*/, "$1") + "/";
}
appBaseUri = loc.protocol + "//" + loc.host + appBasePath;

let cdnBaseUri = uuAppEnvironment.cdnBaseUri;
if (cdnBaseUri && cdnBaseUri.charAt(cdnBaseUri.length - 1) !== "/") cdnBaseUri += "/";
let cdnVersionXAllowed = uuAppEnvironment.cdnVersionXAllowed ?? false;

const isForcedCdn = !!cdnBaseUri;
const cdng01BaseUri = "https://cdn.plus4u.net/";
const cdng02BaseUri = "https://cdng02.plus4u.net/b686718ad49d3ec4d88936576cd830c2/";
// for integration with uu5g04 we export CDN g01 as the default (even if in uu5g05 we internally use CDN g02)
const exportedCdnBaseUri = isForcedCdn ? cdnBaseUri : cdng01BaseUri;
const exportedCdnVersionXAllowed = isForcedCdn ? cdnVersionXAllowed : false;

function getCdnUri(urlPathUsing1xSyntax = "", { isMissingOnCdnG02 = false, libs = false } = {}) {
  let usedCdnBaseUri = isForcedCdn ? cdnBaseUri : isMissingOnCdnG02 ? cdng01BaseUri : cdng02BaseUri;
  let isLegacyCdnSyntax = isForcedCdn ? !cdnVersionXAllowed : isMissingOnCdnG02;
  let urlPathCorrected = isLegacyCdnSyntax
    ? urlPathUsing1xSyntax.replace(/\/(\d+)(\.\d+)?\.x\//, (m, maj, min) => "/" + maj + (min || ".0") + ".0/")
    : urlPathUsing1xSyntax;
  return usedCdnBaseUri + (libs && isLegacyCdnSyntax ? "libs/" : "") + urlPathCorrected;
}

const defaultLanguage = get("defaultLanguage", "en-gb");
const defaultLogLevel = process.env.NODE_ENV === "production" ? "error" : "warn";
const logLevel = get("logLevel", defaultLogLevel);

// !!! Keep uu_gdsg01 version in sync with uu5g05-elements/tools/build-add-banner.js
// !!! Keep logic of obtaining gdsUri fallback same as in uu5g05-elements/tools/build/banner.ejs
let gdsUri = get("gdsUri");
if (!gdsUri) gdsUri = UtilsUu5Loader?.resolve("uu_gdsg01-unicorn");
const fontUriDefaultBase = gdsUri ? gdsUri.replace(/^(.*\/).*/, "$1") : getCdnUri("uu-gdsg01/1.x/");
const fontUri = get(
  "fontUri",
  fontUriDefaultBase + `assets/font${process.env.NODE_ENV !== "production" ? "" : ".min"}.css`,
);

const libraryRegistryBaseUri = get(
  "libraryRegistryBaseUri",
  "https://uuapp.plus4u.net/uu-applibraryregistry-maing01/fe96c133c895434bbd4d5b24831483f3",
);

const libraryLoadUri = get("libraryLoadUri", libraryRegistryBaseUri.replace(/\/$/, "") + "/library/load");
const libraryLoadDisabled = get("libraryLoadDisabled", false);

const libraryStatsUri = get(
  "libraryStatsUri",
  "https://uuapp.plus4u.net/uu-applibraryregistry-statsg01/8fc27ec054b340cb98c9f10789bd4f63/product/logLibraries",
);

const libraryStatsDisabled = get("libraryStatsDisabled", false);

const plus4UGoBaseUri = get(
  "plus4UGoBaseUri",
  "https://uuapp.plus4u.net/uu-plus4ugo-maing01/f34b62a867db4bd89490534bb26451ad/",
);

const componentUveUri = get("componentUveUri", plus4UGoBaseUri.replace(/\/$/, "") + "/component/render");

const trustedUriRegExp = get(
  "trustedUriRegExp",
  "^https://([a-z][a-z0-9\\-]{0,61}[a-z0-9][.]|[a-z][.])?plus4u[.]net(:[0-9]+)?(?=[/#?]|$)",
);

let iconLibraryMap = get("iconLibraryMap", null);
iconLibraryMap = {
  // !!! Keep in sync with @mdi/font version in package.json
  mdi: getCdnUri("materialdesignicons/7.0.96/css/materialdesignicons.min.css", { isMissingOnCdnG02: true, libs: true }),
  fa: getCdnUri("font-awsome/6.2.1/css/all.min.css", { isMissingOnCdnG02: true, libs: true }),
  uu5: getCdnUri("uu-uu5g04-icons/1.x/uu5g04_icons.min.css", { isMissingOnCdnG02: true }),
  plus4u: getCdnUri("plus4u-iconsg01/1.x/plus4u_iconsg01.min.css", { isMissingOnCdnG02: true }),
  plus4u5: getCdnUri("uu-plus4u5g01-icons/1.x/uu_plus4u5g01_icons.min.css", { isMissingOnCdnG02: true }),
  uubml: getCdnUri("uu-uubmldraw-iconsg03/2.x/uu_uubmldraw_iconsg03.min.css", { isMissingOnCdnG02: true }),
  uubmlicon:
    "https://uuapp.plus4u.net/uu-uubmldraw-stencilcatalogueg01/c168bd044ce044d48ba284c89eeb573b/stencil/getCss?code=%s",
  uugds: getCdnUri("uu-gds-svgg01/1.x/uu_gds_svgg01-icons.min.css"),
  uugdssvg: getCdnUri("uu-gds-svgg01/1.x/assets/illustrations/"),
  uugdsstencil: getCdnUri("uu-gds-svgg01/1.x/uu_gds_svgg01-%s.min.css"),

  uubmlstencil: getCdnUri("uu-uubmldraw-iconsg04/1.x/uu_uubmldraw_iconsg04-%s.min.css"),
  uubmllarge: getCdnUri("uu-uubmldraw-iconsg04/1.x/uu_uubmldraw_iconsg04-%s-large.min.css"),

  ...iconLibraryMap,
};

const textEntityDisabled = uuAppEnvironment.uu5stringg01_textEntityDisabled;

// TODO Uncomment after devkit fix - there is a devkit bug related to generating Intellisense which fails on this line.
// const uu5DataMap = uuAppEnvironment.uu5stringg01_uu5DataMap || {};
let uu5DataMap = uuAppEnvironment.uu5stringg01_uu5DataMap;
if (!uu5DataMap) uu5DataMap = {};

const styleRootElementClassName = "uu5-style";
const inStyleRootElement = !!document.querySelector("." + styleRootElementClassName);

const isSimpleRender = get("isSimpleRender", !!navigator.webdriver); // default: isHeadless

const uu5StringUsesLatestMajorVersions = UtilsUu5Loader?.initUuAppResultState === "success";

const telemetryId = get("telemetryId");
const telemetryTypeCode = get("telemetryTypeCode");
const telemetryLevel = get("telemetryLevel", "ERROR");

export {
  G04_RENAME_MAP,
  appBaseUri,
  // NOTE These 2 are for uu5g04. In uu5g05-* libs we should use getCdnUri() fn.
  exportedCdnBaseUri as cdnBaseUri,
  exportedCdnVersionXAllowed as cdnVersionXAllowed,
  getCdnUri,
  libraryLoadUri,
  libraryLoadDisabled,
  libraryStatsUri,
  libraryStatsDisabled,
  plus4UGoBaseUri,
  componentUveUri,
  logLevel,
  uu5DataMap,
  textEntityDisabled,
  defaultLanguage,
  fontUri,
  inStyleRootElement,
  styleRootElementClassName,
  uu5StringUsesLatestMajorVersions,
  uuAppEnvironmentGet,
  // for uu5g05-elements
  iconLibraryMap,
  trustedUriRegExp,
  // for uuAppLibraryRegistry
  libraryRegistryBaseUri,
  // for logger-factory.js
  get,
  defaultLogLevel,
  isSimpleRender,
  telemetryId,
  telemetryTypeCode,
  telemetryLevel,
};

export default uuAppEnvironment;
