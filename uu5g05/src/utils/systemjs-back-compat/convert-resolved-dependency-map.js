// !!! Keep in sync with uu5loaderg01 (some uuApps such as uu-bookigy-workplaceg01 still use legacy SystemJS).
// (copied as-is from uu5loaderg01/src/features/convert-resolved-dependency-map.js)

//@@viewOn:imports
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

function _isCdnRangeVersion(version, systemUrl) {
  return version && version.match(/^\d+\.0\.0$/) && (!systemUrl || systemUrl.indexOf("/libs/") === -1);
}

function _getExistingVersionUrl(name, version, imports, fallbackFromVersionList, Uu5Loader) {
  let exactVersionUrl;
  let exactFallbackVersionUrl; // e.g. we have Resource Override for uu5g05 1.12.0-beta.1, lib registry returned 1.11.0 because it doesn't know such version (and marks the result item with fallbackFromVersionList=["1.12.0-beta.1"])
  let cdnRangeUrl; // URL containing .../X.0.0/...
  let sameVersionSlotUrl; // URL with different version but for the same slot, e.g. /1.2.3/ in URL but variable `version` is 1.1.0
  let localhostOrIpUrl;
  for (let importName in imports) {
    let url = imports[importName];
    let [existingName, existingVersion] = importName.split("@");
    if (!existingName) {
      existingName = importName;
      existingVersion = undefined;
    }
    if (existingName != name) continue;

    if (!existingVersion) {
      let exports = Uu5Loader.get(url);
      if (exports && exports.version) existingVersion = exports.version;
      if (!existingVersion) {
        let versionInUrl = url.match(/(\d+\.\d+\.\d+(?:-[^/]*)?)/)?.[1];
        if (_isCdnRangeVersion(versionInUrl, url)) {
          if (versionInUrl.split(".", 1)[0] === version.split(".", 1)[0]) {
            cdnRangeUrl = url;
          }
          continue;
        }
        let versionRangeInUrl = url.match(/\/(\d+)\.x\//)?.[1];
        if (versionRangeInUrl) {
          if (versionRangeInUrl === version.split(".", 1)[0]) {
            cdnRangeUrl = url;
          }
          continue;
        }
        // if the existing URL goes to localhost/IP address/relative URL, assume that we want to use it always
        // (this is case where the existing URL is configured, but the library was not yet loaded, i.e. we don't know
        // exact version from its exports and we have just the URL)
        if (/^https?:\/\/(localhost|\d+\.\d+\.\d+\.\d+)(:\d+)?\/|^\//.test(url)) {
          localhostOrIpUrl = url;
          continue;
        }
        existingVersion = versionInUrl;
      }
    }
    if (existingVersion) {
      if (existingVersion === version) {
        exactVersionUrl = url;
        break;
      }
      if (fallbackFromVersionList && fallbackFromVersionList.includes(existingVersion)) {
        exactFallbackVersionUrl = url;
      } else if (_areVersionsInSameSlot(existingVersion, version)) {
        sameVersionSlotUrl = url;
      }
    }
  }
  return exactVersionUrl || exactFallbackVersionUrl || sameVersionSlotUrl || cdnRangeUrl || localhostOrIpUrl;
}
function _areVersionsInSameSlot(v1, v2) {
  // versions are "in same slot" if we prefer to load only one of those versions in UVE
  // e.g.:
  //       1.2.3 vs. 1.4.0 - same slot; we want only single (biggest) version from 1.x range because they don't have breaking changes among themselves
  //       1.2.3 vs. 0.4.0 - different slot (different major - load both of them)
  //       0.4.0 vs. 0.4.1 - same slot;
  //   !!! 0.4.0 vs. 0.3.0 - different slot (these can have breaking changes among themselves because they're 0.x)
  //   !!! 0.0.1 vs. 0.0.2 - different slot (these can have breaking changes among themselves because they're 0.0.x)
  if (v1 === v2) return true;
  let parsedV1 = v1.split(/[-.]/, 3);
  let parsedV2 = v2.split(/[-.]/, 3);
  if (parsedV1[0] !== parsedV2[0]) return false;
  if (parsedV1[0] !== "0") return true; // 1.2.3 is in slot for 1.x (we want only single version within 1.x range)
  if (parsedV1[1] !== parsedV2[1]) return false; // 0.1.0 vs 0.2.0 - they can have breaking changes among themselves, i.e. we'll allow loading mul
  if (parsedV1[1] !== "0") return true; // 1.2.3 is in slot for 1.x (we want only single version within 1.x range)
  return false;
}

function convertResolvedDependencyMap(
  resolvedDependencyMap,
  existingConfig,
  Uu5Loader,
  uu5Environment,
  { preferNonminifiedUrls } = {},
) {
  let relevantImports = {};
  let newImports = {};
  let scopesByName = {};
  let cdnBaseUri = uu5Environment.cdnBaseUri;
  if (cdnBaseUri && !cdnBaseUri.endsWith("/")) cdnBaseUri += "/";

  let existingImports = existingConfig.imports || {};
  for (let [name, slotList] of Object.entries(resolvedDependencyMap)) {
    for (let { version, uri, for: forList, mergedInto, fallbackFromVersionList, latestMajor } of slotList) {
      if (mergedInto) continue; // singleton/globalNamespace item that was merged into another version (item)

      let nameWithVersion = name + "@" + version;
      // prefer already-configured URLs if the version seems the same as resolved
      let existingVersionUrl = _getExistingVersionUrl(
        name,
        version,
        existingImports,
        fallbackFromVersionList,
        Uu5Loader,
      );
      if (!existingVersionUrl && name === "uu_oidcg01") {
        existingVersionUrl = existingImports["uu_oidcg01"] || existingImports["uu_appg01_oidc"];
      }
      if (!existingVersionUrl && !uri) {
        continue;
      }

      if (preferNonminifiedUrls) uri = uri.replace(/\.min(\.js|\.css)$/, "$1");
      relevantImports[nameWithVersion] = existingVersionUrl || uri;
      if (!existingImports[nameWithVersion] && !newImports[nameWithVersion]) {
        newImports[nameWithVersion] = relevantImports[nameWithVersion];
      }
      if (!existingImports[name] && !newImports[name]) {
        newImports[name] = relevantImports[nameWithVersion];
      }
      if (latestMajor) {
        let nameWithLatestMajor = name + "@latestMajor";
        newImports[nameWithLatestMajor] = relevantImports[nameWithVersion];
      }
      for (let forItem of forList) {
        scopesByName[forItem] ??= {};
        scopesByName[forItem][name] = relevantImports[nameWithVersion];
      }
    }
  }
  let scopes = {};
  for (let nameWithVersion in scopesByName) {
    if (!(nameWithVersion in newImports)) continue;
    let baseUri = newImports[nameWithVersion].replace(/[^/]*$/, "");
    let simpleScope = {};
    for (let [k, uri] of Object.entries(scopesByName[nameWithVersion])) {
      if (existingImports[k] === uri || newImports[k] === uri) continue;
      simpleScope[k] = uri;
    }
    if (Object.keys(simpleScope).length > 0) {
      scopes[baseUri] = { ...scopes[baseUri], ...simpleScope };
    }
  }

  return { imports: newImports, scopes };
}

export default convertResolvedDependencyMap;
