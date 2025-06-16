import { Environment } from "uu5g05";
import { plus4UGoBaseUri } from "./uu5-environment.js";

// TODO Use some sort of a basic AppClient.
const Uri = {
  join(baseUri, path, params) {
    const url = new URL(path, Uri.normalizeBaseUri(baseUri));
    if (params) {
      for (let k in params) {
        if (params[k] != null) {
          url.searchParams.set(k, typeof params[k] === "object" ? JSON.stringify(params[k]) : params[k]);
        }
      }
    }
    return url.toString();
  },

  normalizeBaseUri(baseUri) {
    return baseUri.replace(/\/+$/, "") + "/";
  },
};

function _makeFetchError(uri, response, dtoOut, cause) {
  let error = new Error("Fetch failed for URI: " + uri);
  if (cause != null) error.cause = cause;
  if (response != null) error.status = response.status;
  if (dtoOut != null) {
    error.dtoOut = dtoOut;
    if (error.uuAppErrorMap) {
      let code = Object.keys(error.uuAppErrorMap).find((k) => error.uuAppErrorMap[k]?.type === "error");
      if (code) error.code = code;
    }
  }
  return error;
}

const Calls = {
  async call(method, uri, dtoIn) {
    let response, json, finalUri;
    try {
      finalUri = method === "get" ? Uri.join(Environment.appBaseUri, uri, dtoIn) : uri;
      let body = method === "get" || dtoIn == null ? undefined : JSON.stringify(dtoIn);
      response = await fetch(finalUri, {
        method,
        body,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });
      json = await response.json();
    } catch (e) {
      return Promise.reject(_makeFetchError(finalUri, response, json, e));
    }
    if (!response.ok) return Promise.reject(_makeFetchError(finalUri, response, json));

    return json;
  },

  async plus4UGoWebsiteMetadataLoad(dtoIn, baseUri = plus4UGoBaseUri) {
    return Calls.call("get", Uri.join(baseUri, "website/metadata/load"), dtoIn);
  },
};

export { Calls };
export default Calls;
