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
import React from "react";
import LoggerFactory from "../utils/logger-factory.js";

// NOTE: because of react 18.3.1 throws error for defaultProps
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].match(/Support for defaultProps will be removed from (function|memo) components in a future major release/)
  ) {
    return;
  }

  originalConsoleError(...args);
};

// NOTE: prepared for react 19.0.0
// function wrapByDefaultProps(render, defaultProps = {}) {
//   return (props, ...args) => {
//     const newProps = {};
//     for (let key in props) {
//       newProps[key] = props[key] === undefined ? defaultProps[key] : props[key];
//     }
//     return render(newProps, ...args);
//   }
// }

function createComponent(component, isRef = false) {
  const { render, ...statics } = component;

  if (process.env.NODE_ENV === "development" && component.uu5Tag) {
    // make React's "error component stack" show our uu5Tag-s instead of "render" string
    try {
      Object.defineProperty(render, "name", {
        configurable: true,
        enumerable: false,
        writable: false,
        value: component.uu5Tag.split("(")[0],
      });
    } catch (e) {
      // ignore
    }
  }

  // NOTE: prepared for react 19.0.0
  // const renderWithDefaultProps = Object.keys(statics.defaultProps ?? {}).length > 0 ? wrapByDefaultProps(render, statics.defaultProps) : render;
  // const Comp = isRef ? React.forwardRef(renderWithDefaultProps) : renderWithDefaultProps;

  const Comp = isRef ? React.forwardRef(render) : render;
  for (let key in statics) Comp[key] = statics[key];
  if (Comp.uu5Tag) Comp.displayName = Comp.uu5Tag;

  Comp.uu5ComponentType = "component";

  // FIXME backward compatibility - delete after death of mixins
  Comp.isUu5PureComponent = true;
  if (!isRef) Comp.isStateless = true;

  let logger;
  Object.defineProperty(Comp, "logger", {
    get: function () {
      if (!logger) logger = LoggerFactory.get(Comp.displayName || Comp.tagName || "AnonymousComponent");
      return logger;
    },
    set: function (value) {
      logger = value;
    },
  });

  return Comp;
}

export { createComponent };
export default createComponent;
