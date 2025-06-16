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

import ReactDOM from "react-dom";
import Config from "../config/config.js";
import { inStyleRootElement, styleRootElementClassName } from "../uu5-environment.js";
import LoggerFactory from "./logger-factory.js";

let asyncBatchedUpdatesList = [];
let asyncBatchedUpdatesTimeout;

let warnedFindDOMNode = {};

let logger;
function getLogger() {
  if (!logger) logger = LoggerFactory.get(Config.TAG + "Utils.Dom");
  return logger;
}

function _isCssAdded(uri) {
  let absoluteUri = _toAbsoluteUri(uri);
  let links = document.querySelectorAll("link");
  for (let i = 0; i < links.length; i++) {
    if (links[i].href === absoluteUri) return true;
  }
  return false;
}

function _toAbsoluteUri(uri) {
  let a = document.createElement("a");
  a.href = uri; // browser will do normalization (resolve relative paths, add missing protocol/domain, ...)
  return a.href;
}

let elToRootMap = typeof WeakMap !== "undefined" ? new WeakMap() : new Map();
let reactVersion = parseFloat(ReactDOM.version);
const render =
  reactVersion >= 18
    ? (jsx, el, ...rest) => {
        // eslint-disable-next-line react/no-render-return-value
        if (rest[0] !== undefined) return ReactDOM.render(jsx, el, ...rest);
        let root = elToRootMap.get(el);
        if (!root) {
          // "createRoot" function is supposed to be from "react-dom/client", otherwise it gives warning in Jest tests
          let createRoot;
          if (process.env.NODE_ENV === "test") createRoot = eval("require")("react-dom/client").createRoot;
          else createRoot = ReactDOM.createRoot;
          root = createRoot(el);
          elToRootMap.set(el, root);
        }
        // let result = root.render(<React.StrictMode>{jsx}</React.StrictMode>);
        let result = root.render(jsx);
        return result; // TODO Maybe return Proxy and if developer tries to access anything, then show warning and re-mount using ReactDOM.render() (for backward compatibility).
      }
    : (jsx, el, ...rest) => {
        // eslint-disable-next-line react/no-render-return-value
        let result = ReactDOM.render(jsx, el, ...rest);
        return result;
      };
const unmount =
  reactVersion >= 18
    ? (el) => {
        let root = elToRootMap.get(el);
        if (root) {
          root.unmount();
          elToRootMap.delete(el);
        }
      }
    : ReactDOM.unmountComponentAtNode;

const Dom = {
  render: !inStyleRootElement
    ? render
    : (jsx, el, ...rest) => {
        if (el && el.classList && !el.matches(`.${styleRootElementClassName} *`)) {
          el.classList.add(styleRootElementClassName);
        }
        return render(jsx, el, ...rest);
      },
  findNode:
    ReactDOM.findDOMNode ||
    ((...args) => {
      let findNode = ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?.findDOMNode; // eslint-disable-line react/no-find-dom-node
      if (process.env.NODE_ENV !== "production") {
        let caller = new Error("!!!!!").stack.split("\n")[1];
        if (caller && !warnedFindDOMNode[caller]) {
          warnedFindDOMNode[caller] = true;
          getLogger().error(
            "You are using ReactDOM.findDOMNode() or Utils.Dom.findNode() or UU5.Common.DOM.findNode(). This method is removed in React 19 and your code will stop working. Use element ref instead.",
          );
        }
      }
      return findNode?.(...args);
    }),
  hydrate: ReactDOM.hydrate || ((jsx, el, callback) => ReactDOM.hydrateRoot(el, jsx)),
  unmount,
  createPortal: !inStyleRootElement
    ? ReactDOM.createPortal
    : (jsx, el, ...rest) => {
        if (el && el.classList && !el.matches(`.${styleRootElementClassName} *`)) {
          el.classList.add(styleRootElementClassName);
        }
        return ReactDOM.createPortal(jsx, el, ...rest);
      },
  flushSync: ReactDOM.flushSync,

  addCss(styleSheetUri, asFirst = false) {
    let result;
    if (!_isCssAdded(styleSheetUri)) {
      let link = document.createElement("link");
      link.type = "text/css";
      link.rel = "stylesheet";
      link.crossOrigin = "anonymous";
      link.href = styleSheetUri;
      let beforeElement = null;
      if (asFirst) beforeElement = document.querySelector("link, style") || null;
      document.head.insertBefore(link, beforeElement);
      result = true;
    } else {
      result = false;
    }
    return result;
  },

  // NOTE Considered as internal API, used by uu5g04 too - don't rename.
  _batchedUpdates: ReactDOM.unstable_batchedUpdates,

  /**
   * Adds fnToExec to queue, waits minimal time to collect other fns to exec and then
   * runs them all within single React batch. Intended for changing state after async operation
   * or from within native event (such as mutation/resize, i.e. when it's not necessary to do it
   * in a synchronous way and it's possible that there are multiple listeners).
   **/
  _asyncBatchedUpdates(fnToExec) {
    asyncBatchedUpdatesList.push(fnToExec);
    if (!asyncBatchedUpdatesTimeout) {
      asyncBatchedUpdatesTimeout = setTimeout(() => {
        Dom._batchedUpdates(() => {
          while (asyncBatchedUpdatesList.length) {
            try {
              asyncBatchedUpdatesList.shift()();
            } catch (e) {
              console.error(e);
            }
          }
        });
        asyncBatchedUpdatesTimeout = null;
      }, 5);
    }
  },
};

export { Dom };
export default Dom;
