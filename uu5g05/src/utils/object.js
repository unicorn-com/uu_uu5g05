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
import Element from "./element.js";
import Tools from "../_internal/tools.js";

function equal(objA, objB, deep) {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }

  let keysA = Object.keys(objA);
  let keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i])) {
      return false;
    }

    if (
      deep &&
      objA[keysA[i]] &&
      objB[keysA[i]] &&
      typeof objA[keysA[i]] === "object" &&
      typeof objB[keysA[i]] === "object"
    ) {
      // must be condition because in React 16 _owner is FiberNode which is recursive
      if ((!objA.$$typeof || keysA[i] !== "_owner") && !equal(objA[keysA[i]], objB[keysA[i]], deep)) {
        return false;
      }
    } else if (keysA[i] !== "ref_" && !Object.is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}

function isPlainObject(obj) {
  let result = false;
  if (typeof obj == "object" && obj !== null) {
    if (typeof Object.getPrototypeOf == "function") {
      let proto = Object.getPrototypeOf(obj);
      result = proto === Object.prototype || proto === null;
    } else {
      result = Object.prototype.toString.call(obj) === "[object Object]";
    }
  }
  return result;
}

function extend(preserveRefs, ...args) {
  let src,
    copyIsArray,
    copy,
    name,
    options,
    clone,
    target = args[0] || {},
    i = 1,
    length = args.length,
    deep = false;

  // Handle a deep copy situation
  if (typeof target === "boolean") {
    deep = target;

    // skip the boolean and the target
    target = args[i] || {};
    i++;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if (typeof target !== "object" && typeof target !== "function") {
    target = {};
  }

  // extend jQuery itself if only one argument is passed
  if (i === length) {
    target = this;
    i--;
  }

  let targetIsArray = Array.isArray(target);
  for (; i < length; i++) {
    // Only deal with non-null/undefined values
    if ((options = args[i]) != null) {
      // Extend the base object

      // merge React elements via Element.clone (clone props separately, then do cloneElement)
      // because React Context elements are cyclic...
      if (deep && options && typeof options === "object" && Element.isValid(options)) {
        let newProps = {};
        if (options.props) {
          for (let k in options.props) {
            let v = options.props[k];
            if (preserveRefs && k === "ref_" && v && typeof v === "object") {
              newProps[k] = v;
            } else if (v && Array.isArray(v)) {
              newProps[k] = extend(preserveRefs, deep, [], v);
            } else if (v && isPlainObject(v)) {
              newProps[k] = extend(preserveRefs, deep, {}, v);
            } else {
              newProps[k] = v;
            }
          }
        }
        let newChildren = newProps.children;
        delete newProps.children;
        let clonedReactEl = Element.clone(options, newProps, newChildren);
        if (clonedReactEl._store && options._store) {
          clonedReactEl._store.validated = options._store.validated; // to prevent extra warnings about missing "key"
        }
        // if the target is a React element, then "merge" by actually replacing the element,
        // otherwise just copy all keys
        if (target && typeof target === "object" && Element.isValid(target)) {
          for (let k in target) {
            delete target[k];
          }
        }
        for (let k in clonedReactEl) {
          target[k] = clonedReactEl[k];
        }
      } else {
        for (name in options) {
          src = target[name];
          copy = options[name];

          // Prevent never-ending loop
          // TODO This is insufficient (works only when cycle is at parent-child level).
          if (target === copy) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && Array.isArray(src) ? src : [];
            } else {
              clone = src && isPlainObject(src) ? src : {};
            }

            // Never move original objects, clone them
            target[name] = extend(preserveRefs, deep, clone, copy);

            // Don't bring in undefined values (do for arrays as it might change their length otherwise)
          } else if (copy !== undefined || targetIsArray) {
            target[name] = copy;
          }
        }
      }
    }
  }

  // Return the modified object
  return target;
}

// TODO These are copied from uu_appg01_core-appclient (dot-notate.js). Use their API once they export it.
function dotNotate(object, parent = "") {
  let result = {};
  recurse(parent, object, result, parent ? 1 : 0);
  return result;
}
function recurse(key, value, result, level) {
  if (level > 5) throw new Error("Failed to flatten object - nesting level too deep. Possible circular reference.");
  if (Array.isArray(value)) {
    value.forEach((item, i) => recurse(`${key}[${i}]`, item, result, level + 1));
  } else if (value instanceof Date) {
    result[key] = value.toISOString();
  } else if (value && typeof value === "object") {
    for (const k in value) {
      recurse(`${key}${level ? "." : ""}${k}`, value[k], result, level + 1);
    }
  } else {
    result[key] = value;
  }
}

const Obj = {
  shallowEqual: (objA, objB) => equal(objA, objB, false),
  deepEqual: (objA, objB) => equal(objA, objB, true),
  mergeDeep: (...args) => extend(true, true, {}, ...args),
  toFlatParams: (params, prefix = "") => (params != null ? dotNotate(params, prefix) : params),

  /**
   * Find value by matching `key` (e.g. "uu-jokes-main/notFound") against glob-like keys in `object` (e.g.
   * { "uu-jokes-main/*": ..., "uu-jokes-main/invalidDtoIn": ... }).
   * @param {object} object
   * @param {string} key
   * @returns Found value.
   */
  matchByKey(object, key) {
    if (!object || !key) return;
    if (key in object) return object[key];

    for (let itemKey in object) {
      if (!itemKey.includes("*")) continue;
      let regexp = new RegExp("^(" + Tools.regexpEscape(itemKey).replace(/\\*/g, "(?:.*?)") + ")$");
      if (regexp.test(key)) {
        return object[itemKey];
      }
    }
  },
};

export { Obj as Object };
export default Obj;
