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
import LoggerFactory from "../utils/logger-factory.js";
import Config from "../config/config.js";

const JSCODE_REGEXP = /^javascript:/i; // NOTE Do string.trim().replace(/\s+/g, "") before using this regexp because e.g. Chrome also executes `jav\nasc\nript\n:alert(1)`.
const logger = LoggerFactory.get(Config.TAG + "Tools");

const Tools = {};

Tools.error = logger.error.bind(logger);
Tools.warning = logger.warn.bind(logger);

const REGEXP = {
  digitInBracket: /{(\d+)}/g,
  stringParamsArray: /%((%)|s|d)/g,
  stringParamsObject: /(\$\{[^}]+})/g,
};
Tools._replaceParamsInString = function (string, stringParams) {
  var i = 0;
  let result;

  if (Array.isArray(stringParams)) {
    result = string.replace(REGEXP.stringParamsArray, function (match, group1, group2) {
      // match is the matched format, e.g. %s, %d
      var val = null;
      if (group2) {
        val = "%";
      } else {
        val = stringParams[i];
        // A switch statement so that the formatter can be extended. Default is %s
        switch (match) {
          case "%d":
            var parsedVal = parseFloat(val);
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
        i++;
      }
      return val && typeof val.toString === "function" ? val.toString() : val;
    });
  } else if (typeof stringParams === "object") {
    result = string.replace(REGEXP.stringParamsObject, function (match) {
      // match is the matched format, e.g. ${name}
      var val = null;
      if (match) {
        let keyName = match.match(/[^${}]+/)[0];
        if (keyName) {
          val = stringParams[keyName];
        }
      } else {
        val = match;
      }
      return val;
    });
  }

  return result;
};

Tools._setParamsToString = function (string, stringParams) {
  return string.replace(REGEXP.digitInBracket, function (match, number) {
    return stringParams && typeof stringParams[number] != "undefined" ? stringParams[number] : match;
  });
};

Tools.formatString = function (string, stringParams) {
  let result;

  if (string.indexOf("%s") > -1 || string.indexOf("%d") > -1 || string.match(/\$\{\w+\}/)) {
    if (stringParams != null && typeof stringParams !== "object") {
      // it is not array or object but next method accepts only array or object -> wrap single string into array
      stringParams = [stringParams];
    }
    result = Tools._replaceParamsInString(string, stringParams);
  } else {
    stringParams = stringParams && !Array.isArray(stringParams) ? [stringParams] : stringParams;
    result = Tools._setParamsToString(string, stringParams);
  }
  return result;
};

Tools.getCamelCase = function (string, firstCharLowerCase = false) {
  var camelCase = string || "";
  if (camelCase) {
    if (!firstCharLowerCase) camelCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
    camelCase = camelCase.replace(/-(.)/g, function (m, g1) {
      return g1.toUpperCase();
    });
  }
  return camelCase;
};

Tools.sanitizeHref = function (href) {
  if (!href || typeof href !== "string") return href;
  let replaced;
  while (JSCODE_REGEXP.test(href.trim().replace(/\s+/g, ""))) {
    replaced = true;
    href = href.slice(href.indexOf(":") + 1);
  }
  return replaced ? "javascript-uri-disabled-by-uu5g05:" + href : href;
};

Tools.regexpEscape = function (aValue) {
  if (!aValue) return "";
  return aValue.replace(/([[\]\\+*?{}()^$.|])/g, "\\$1");
};

export { Tools };
export default Tools;
