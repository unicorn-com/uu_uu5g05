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

import createEmotion from "@emotion/css/create-instance";
import LoggerFactory from "./logger-factory.js";
import getDeviceConstantValues from "../_internal/get-device-constant-values.js";

// NOTE Cannot use DeviceProvider.device.browserName due to cyclic imports.
const isFF = getDeviceConstantValues().browserName === "firefox";

const STYLES_WITH_REMAPPABLE_LEFT_RIGHT_VALUES = new Set([
  "alignContent",
  "alignItems",
  "alignSelf",
  "justifyContent",
  "justifyItems",
  "justifySelf",
  "placeContent",
  "placeItems",
  "placeSelf",
  "textAlign",
  "textAlignLast",
]);

// 1. Follow uu_appg01_devkit's rules for style elements insertion to ensure proper
//    style order (.less styles are less specific than emotion CSS - this is handled
//    by devkit for .less styles; both must be before [data-uu-app-styles-insert-before]
//    element or at the end of the <head>).
// 2. Ensure that the target insertion element is computed at the time of createCssModule()
//    call - this is ensured by createEmotion() itself. (If it was computed later, e.g. during
//    first CSS class computation, then some other library B which depends on this one could
//    have already inserted its own <style> tag and it would be before ours - we want initial
//    style order among libraries to be based on topological sort of the dependency tree.)
// 3. Emotion styles created later can be inserted into new <style> elements (this is behaviour
//    of emotion itself). Ensure that these new <style> elements stick together with the initial
//    <style> element. This fixes wrong order e.g. in case of lazy component and an emotion
//    class from a library that depends on the one with the lazy component.
function getStylePseudoContainer(key, owner) {
  function insertStyleElement(styleEl) {
    let insertionEl = document.head || document.body;

    if (owner) styleEl.setAttribute("data-owner", owner);
    styleEl.setAttribute("data-emotion", key);
    styleEl.setAttribute("data-tech", "emotion");

    // insert the style element
    // 1. after last matching data-emotion element
    let els = insertionEl.querySelectorAll(`style[data-emotion="${key}"]`);
    if (els.length > 0) {
      let el = els[els.length - 1];
      el.parentNode.insertBefore(styleEl, el.nextSibling);
      return;
    }

    if (owner) {
      // 2. after last matching data-owner (this keeps multiple emotion CSS modules
      //    within 1 built file together)
      els = insertionEl.querySelectorAll(`style[data-owner="${owner}"]`);
      if (els.length > 0) {
        let el = els[els.length - 1];
        el.parentNode.insertBefore(styleEl, el.nextSibling);
        return;
      }
    }

    // 3. before element with data-uu-app-styles-insert-before attribute
    let el = document.querySelector("[data-uu-app-styles-insert-before]");
    if (el) {
      el.parentNode.insertBefore(styleEl, el);
      return;
    }

    // 4. at the end of <head> or <body>
    insertionEl.appendChild(styleEl);
  }

  // emotion 11.x no longer inserts the element ASAP (which we need :-()
  //   => insert temporary marker and then replace it with real element
  // TODO Do somehow differently so that we don't need to create <style> elements ASAP.
  let tempStyleEl = document.createElement("style");
  insertStyleElement(tempStyleEl);
  let replaceTempStyleEl = (styleEl) => {
    if (!tempStyleEl) return insertStyleElement(styleEl); // if called multiple times then don't do replacement multiple times
    tempStyleEl.parentNode.insertBefore(styleEl, tempStyleEl);
    for (let k of tempStyleEl.getAttributeNames()) styleEl.setAttribute(k, tempStyleEl.getAttribute(k));
    tempStyleEl.parentNode.removeChild(tempStyleEl);
    tempStyleEl = undefined;
  };

  return {
    appendChild: replaceTempStyleEl,
    insertBefore: replaceTempStyleEl,
    insertAfter: replaceTempStyleEl,
  };
}

const I18N_STYLES = {
  left: "insetInlineStart",
  right: "insetInlineEnd",
  paddingLeft: "paddingInlineStart",
  paddingRight: "paddingInlineEnd",
  marginLeft: "marginInlineStart",
  marginRight: "marginInlineEnd",
  borderLeft: "borderInlineStart",
  borderRight: "borderInlineEnd",
  borderTopLeftRadius: "borderStartStartRadius",
  borderTopRightRadius: "borderStartEndRadius",
  borderBottomLeftRadius: "borderEndStartRadius",
  borderBottomRightRadius: "borderEndEndRadius",
};

function toCamelCase(dashCase) {
  return dashCase.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function replaceStyles(styles) {
  let newStyles = {};
  if (styles && typeof styles === "object") {
    for (let style in styles) {
      const value = styles[style];

      if (value != null) {
        // remove backdropFilter for Firefox as it causes background of touchicons in Navigator to occasionally not show,
        // as well as the Close button in Navigator widget is not visible (the problem is combination of `filter` on parent
        // such as Popover, and `backdrop-filter` on child/descendant such as Close button, which then affects also other elements)
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1797051
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1888025 (click on References)
        // https://uuapp.plus4u.net/uu-sls-maing01/558dcc308da34b82bbe044d94074802f/issueDetail?id=66d9768e94bfb0003574dbfa
        if (isFF && style === "backdropFilter") {
          continue;
        } else if ((style === "padding" || style === "margin") && typeof value === "string") {
          const [top, right, bottom, left] = value.split(" ");
          if (bottom) {
            newStyles[style + "BlockStart"] = top;
            newStyles[style + "InlineEnd"] = right || top;
            newStyles[style + "BlockEnd"] = bottom || top;
            newStyles[style + "InlineStart"] = left || right || top;
          } else {
            newStyles[style] = value;
          }
        } else if (typeof value === "object") {
          newStyles[style] = replaceStyles(value);
        } else {
          let newStyle = style;
          if (style.match(/left|right/i)) {
            newStyle = I18N_STYLES[toCamelCase(style)] || style;
          }

          let newValue = value;
          if (STYLES_WITH_REMAPPABLE_LEFT_RIGHT_VALUES.has(newStyle)) {
            if (value === "left") newValue = "start";
            if (value === "right") newValue = "end";
          } else if (newStyle === "float") {
            if (value === "left") newValue = "inline-start";
            if (value === "right") newValue = "inline-end";
          }

          newStyles[newStyle] = newValue;
        }
      }
    }
  } else {
    newStyles = styles;
  }
  return newStyles;
}

let warnedInvalidCssStringsMap;

const createCss = (key, owner) => {
  // The key option is required when there will be multiple instances in a single app
  let emotion = createEmotion({
    key,
    container: getStylePseudoContainer(key, owner),
    speedy: true,
  });

  // backward compatibility with emotion 9.x
  // scenario:
  //   row:  () => Config.Css.css`padding: 16px`,
  //   icon: () => Config.Css.css`padding: 8px; .${row()} > & { margin-left: 8px; }`
  // with emotion 9.x:
  //   icon is like `padding: 8px; .uu-zxc8ab > .uu-fa932d { margin-left: 8px; }` and works
  // with emotion 11.x:
  //   icon is like `padding: 8px; .padding: 16px > .uu-fa932d { margin-left: 8px; }` and fails
  // => when using css`...` interpolation, merge string-like values before passing it to emotion.css
  function css(strings, ...values) {
    let result;
    if (!Array.isArray(strings) || strings.length === 0) {
      // NOTE JSDOM matches all existing selectors *regardless* of :active/:hover state, so the last selector wins
      // (which is :active in case of Button-s with onClick, i.e. uuGds "marked" state). This interferes with tests
      // which typically assume that HTML element is in non-hovered / non-active / non-focused state.
      //   => add extra class name to such selectors so that such selectors effectively never match
      if (process.env.NODE_ENV === "test" && strings && typeof strings === "object") {
        strings = { ...strings };
        for (let selector in strings) {
          let fixedSelector = selector.replace(/:(hover|active|focus)/g, (m) => ".jsdom-pseudoclass-disabled" + m);
          if (selector !== fixedSelector) {
            strings[fixedSelector] = strings[selector];
            delete strings[selector];
          }
        }
      }
      result = emotion.css(replaceStyles(strings), ...values);
    } else {
      let resultStrings;
      let resultValues;
      let warnInvalid;
      let initResultStrings = () => {
        resultStrings = [...strings];
        Object.defineProperty(resultStrings, "raw", {
          enumerable: false,
          configurable: true,
          value: [...strings.raw],
        });
      };
      if (strings[0].trim().charAt(0) === "{") {
        initResultStrings();
        resultStrings[0] = "&" + resultStrings[0];
        resultStrings.raw.splice(0, 1, "&" + resultStrings.raw[0]);
        if (process.env.NODE_ENV !== "production") warnInvalid = true;
      }
      for (let i = 0, j = 0; i < values.length; i++, j++) {
        let value = values[i];
        if (typeof value !== "string") continue;
        let usedStrings = resultStrings || strings;
        let usedValues = resultValues || values;
        let isAfterDot = usedStrings[j]
          ? usedStrings[j].slice(-1).charAt(0) === "."
          : usedStrings
              .slice(0, j + 1)
              .reduce((r, v, k) => r.concat(usedValues[k - 1], v), [])
              .filter((it) => it != null)
              .join("")
              .slice(-1)
              .charAt(0) === ".";
        if (!isAfterDot) continue;
        if (!resultStrings) initResultStrings();
        if (!resultValues) {
          resultValues = [...values];
        }
        resultStrings[j] += value + resultStrings[j + 1];
        resultStrings.raw[j] += value + resultStrings.raw[j + 1];
        resultStrings.splice(j + 1, 1);
        resultValues.splice(j, 1);
        j--;
      }
      result = emotion.css(resultStrings || strings, ...(resultValues || values));

      if (process.env.NODE_ENV !== "production" && warnInvalid) {
        if (!warnedInvalidCssStringsMap) warnedInvalidCssStringsMap = {};
        if (!warnedInvalidCssStringsMap[result]) {
          warnedInvalidCssStringsMap[result] = true;
          let stackInfo;
          let stack = new Error().stack;
          if (stack) {
            let lines = stack.split(/\n/);
            let i = 0;
            while (i < lines.length && !lines[i].match(/^\s*at\s+/)) i++; // skip error message
            while (i < lines.length && !lines[i].match(/css\.js|uu5g05\./)) i++; // skip until this file (or bundled uu5g05.js) gets encountered in stack
            while (i < lines.length && lines[i].match(/css\.js|uu5g05\./)) i++; // skip while in this file (or in bundled uu5g05.js)
            if (i < lines.length) stackInfo = lines[i];
          }
          LoggerFactory.get("Uu5.Utils.Css").error(
            `Invalid emotion CSS string - it should not start with '{'.${
              stackInfo ? "\n" + stackInfo : ""
            }\n\nClassName: ${result}\nEmotion CSS string:\n${strings.raw.join("${...}")}`,
          );
        }
      }
    }
    return result;
  }

  let result = {
    css: css,
    injectGlobal: emotion.injectGlobal,
    keyframes: emotion.keyframes,
    join: emotion.cx,
  };
  if (process.env.NODE_ENV === "test") result = { ...emotion, ...result };
  return result;
};

const cssModules = {};

const Css = {
  createCssModule(key, owner = null) {
    let cacheKey = key + " " + owner;
    let result = cssModules[cacheKey];
    if (!result) {
      result = cssModules[cacheKey] = createCss(key, owner);
    }
    return result;
  },

  joinClassName(...classNames) {
    return classNames.filter((v) => v != null && v !== "").join(" ") || undefined;
  },

  // fillUnit(value, defaultUnit = "px") {
  //   if (value != null) {
  //     if (value === 0) return value;
  //     value += "";
  //     return /\d$/.test(value) ? value + defaultUnit : value;
  //   }
  // },
};

export { Css };
export default Css;
