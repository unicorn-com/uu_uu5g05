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
import Element from "./element.js";

const REGEXP_XY = /[xy]/g;
const REGEXP_DIGIT_IN_BRACKET = /{(\d+)}/g;
const REGEXP_STRING_PARAMS_ARRAY = /%((%)|s|d)/g;
const REGEXP_STRING_PARAMS_OBJECT = /(\$\{[^}]+})/g;

function _replaceParamsInString(string, stringParams) {
  let result;
  let components = [];

  if (Array.isArray(stringParams)) {
    let i = 0;
    result = string.replace(REGEXP_STRING_PARAMS_ARRAY, (match, group1, group2) => {
      // match is the matched format, e.g. %s, %d
      let val = null;
      if (group2) {
        val = "%";
      } else {
        val = stringParams[i];
        if (Element.isValid(val)) {
          components.push(val);
          val = "$comp$";
        } else {
          // A switch statement so that the formatter can be extended. Default is %s
          let parsedVal;
          switch (match) {
            case "%d":
              parsedVal = parseFloat(val);
              if (isNaN(parsedVal)) {
                // cannot use showWarning because of this method is used in showWarning !!!
                Tools.warning("Value " + val + " is not number!", {
                  string: string,
                  stringParams: stringParams,
                });
                val = "%d";
              }
              break;
          }
        }
        i++;
      }
      return val && typeof val.toString === "function" ? val.toString() : val;
    });
  } else if (typeof stringParams === "object") {
    result = string.replace(REGEXP_STRING_PARAMS_OBJECT, (match) => {
      // match is the matched format, e.g. ${name}
      let val = null;
      if (match) {
        let keyName = match.match(/[^${}]+/)[0];
        if (keyName) {
          val = stringParams[keyName];
        }
        if (Element.isValid(val)) {
          components.push(val);
          val = "$comp$";
        }
      } else {
        val = match;
      }
      return val && typeof val.toString === "function" ? val.toString() : val;
    });
  }

  if (components.length) return _parseComponent(result, components);

  return result;
}

function _parseComponent(string, components) {
  let stringArray = string.split("$comp$");
  let result = [];

  stringArray.forEach((str, i) => {
    result.push(str);
    if (components[i]) {
      result.push(Element.clone(components[i], { key: i }));
    }
  });

  return result;
}

function _setParamsToString(string, stringParams) {
  let result;
  let components = [];

  result = string.replace(REGEXP_DIGIT_IN_BRACKET, (match, number) => {
    let value = stringParams && typeof stringParams[number] != "undefined" ? stringParams[number] : match;

    if (Element.isValid(value)) {
      components.push(value);
      value = "$comp$";
    }

    return value && typeof value.toString === "function" ? value.toString() : value;
  });

  if (components.length) return _parseComponent(result, components);

  return result;
}

const String = {
  generateId(length = 32) {
    length = Math.max(length, 8);
    let uuidCore = "x4xxxyxx";
    const additionalCharLength = length - uuidCore.length;
    for (let i = 0; i < additionalCharLength; ++i) {
      if (i % 2 === 0) {
        uuidCore = uuidCore + "x";
      } else {
        uuidCore = "x" + uuidCore;
      }
    }

    return uuidCore.replace(REGEXP_XY, (char) => {
      let r = (Math.random() * 16) % 16 | 0;
      return (char === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  },

  format(string, ...params) {
    let result;

    let hasPercents = string.indexOf("%s") > -1 || string.indexOf("%d") > -1;
    if (
      hasPercents ||
      (string.match(/\$\{\w+\}/) &&
        params.length === 1 &&
        params[0] &&
        (typeof params[0] === "object" || typeof params[0] === "function"))
    ) {
      result = _replaceParamsInString(string, hasPercents ? params : params[0]);
    } else {
      result = _setParamsToString(string, params);
    }
    return result;
  },

  stripAccents(string) {
    return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  },

  capitalize(string) {
    return string[0].toUpperCase() + string.slice(1);
  },
};

export { String };
export default String;
