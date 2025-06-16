import UtilsLoggerFactory from "../utils/logger-factory.js";
import UtilsObject from "../utils/object.js";
import Config from "../config/config.js";

const logger = UtilsLoggerFactory.get(Config.TAG + "Url");

class UrlParams {
  static #unflattenParams(obj) {
    if (obj) {
      let result = {};

      // Loop through the keys of the flattened object
      for (let key in obj) {
        let parts = key.split(/\.|(?=\[)/);

        // Loop through the parts of the key, except the last one
        let level = result;
        for (let i = 0; i < parts.length - 1; i++) {
          let part = parts[i];
          let isPartArray = part.startsWith("[");
          if (isPartArray) part = part.slice(1, -1);

          // If the next level is not defined, create an object or an array based on the next part
          if (level[part] === undefined) {
            let isNextPartArray = parts[i + 1].startsWith("[");
            level[part] = isNextPartArray ? [] : {};
          }

          level = level[part];
        }

        // Assign the value to the final key
        let last = parts[parts.length - 1];
        let isPartArray = last.startsWith("[");
        if (isPartArray) last = last.slice(1, -1);
        level[last] = obj[key];
      }

      return result;
    }
  }

  static #flattenParams(obj, prefix) {
    return UtilsObject.toFlatParams(obj, prefix);
  }

  static #deserializeDataTypes(params, types = {}) {
    let result = {};

    for (const key in types) {
      try {
        const value = types[key](params, key);

        if (value !== undefined) {
          result[key] = value;
        }
      } catch (error) {
        logger.error(`The URL parameter ${key} is not used because of ${error}`);
      }
    }

    return result;
  }

  static #removePrefix(params, prefix) {
    let result = {};

    for (const key in params) {
      let newKey;

      if (key.startsWith(prefix)) {
        if (key[prefix.length] === ".") newKey = key.slice(prefix.length + 1);
        else if (key[prefix.length] === "[") newKey = key.slice(prefix.length);
      } else {
        newKey = key;
      }

      result[newKey] = params[key];
    }

    return result;
  }

  static #filterParams(params, filter) {
    let result = {};

    for (const key in params) {
      if (filter(key)) {
        result[key] = params[key];
      }
    }

    return result;
  }

  static #hasPrefix(key, prefix) {
    return key.startsWith(prefix) && /[.[]/.test(key[prefix.length]);
  }

  static removeParamsWithPrefix(params, prefix = "") {
    let result;

    if (params) {
      result = {};
      if (prefix) {
        result = this.#filterParams(params, (key) => !this.#hasPrefix(key, prefix));
      }
    }

    return result;
  }

  static deserializeParams(params, types = {}, prefix = "") {
    // e.g. { "sorterList[0].key": "name" }   ->   { sorterList: [{ key: "name" }] }
    let result = params;
    if (params) {
      if (prefix) {
        result = this.#filterParams(result, (key) => this.#hasPrefix(key, prefix));
        result = this.#removePrefix(result, prefix);
      }
      result = this.#unflattenParams(result);
      result = this.#deserializeDataTypes(result, types);
    }
    return result;
  }

  static serializeParams(params, prefix = "", previousParams = {}) {
    let newParams = this.#flattenParams(params, prefix);
    let otherParams = this.removeParamsWithPrefix(previousParams, prefix);
    return { ...otherParams, ...newParams };
  }

  static areEqual(paramsA, paramsB) {
    return UtilsObject.deepEqual(paramsA, paramsB);
  }
}

export default UrlParams;
