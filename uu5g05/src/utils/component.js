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
import Uu5String from "./uu5-string.js";

const refsMap = typeof WeakMap !== "undefined" ? new WeakMap() : new Map();

// prettier-ignore
const blacklistedUu5StringProps = new Set(["getEditablePropValue", "generatedId", "parent", "_registerOnDccModalClose", "ref_"]);
const standardUu5StringProps = new Set(["colorSchema", "elevation", "bgStyle", "borderRadius", "padding", "cardView"]);

function setRef(ref, value) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) ref.current = value;
}

function combine2Refs(ref1, ref2) {
  return (value) => {
    setRef(ref1, value);
    setRef(ref2, value);
  };
}

const Component = {
  lazy: React.lazy,

  memo(...args) {
    let result = React.memo(...args);
    if (result) {
      if (!result.displayName && args[0]?.displayName) result.displayName = `Memo(${args[0].displayName})`;
      Component.mergeStatics(result, args[0]);
    }
    return result;
  },

  createRef: React.createRef,
  forwardRef: React.forwardRef,
  combineRefs: (...refs) => {
    let result;
    for (let ref of refs) {
      if (ref != null) {
        if (result == null) {
          result = ref;
        } else {
          let refMap = refsMap.get(result);
          if (!refMap) refsMap.set(result, (refMap = typeof WeakMap !== "undefined" ? new WeakMap() : new Map()));
          let combinedResult = refMap.get(ref);
          if (!combinedResult) refMap.set(ref, (combinedResult = combine2Refs(result, ref)));
          result = combinedResult;
        }
      }
    }
    return result;
  },

  mergeStatics(CompNew, CompWrapped) {
    Object.entries(CompWrapped).forEach(([k, v]) => {
      if (!(k in CompNew)) CompNew[k] = v;
    });
    CompNew.uu5ComponentType = CompWrapped.uu5ComponentType;
    // copy also properties such as logger, ...
    let propertyDescriptors = Object.getOwnPropertyDescriptors(CompWrapped);
    for (let key in propertyDescriptors) {
      if (!Object.hasOwn(CompNew, key)) {
        Object.defineProperty(CompNew, key, propertyDescriptors[key]);
      }
    }
  },

  toUu5String(Component, props) {
    const uu5Tag = Component.uu5Tag || Component.tagName || Component.displayName;
    const tagProps = {};
    let children;

    if (props) {
      const defaultProps = Component.defaultProps || (<Component />).props;
      Object.keys(props).forEach((propKey) => {
        if (
          props[propKey] !== undefined &&
          defaultProps[propKey] !== props[propKey] &&
          typeof props[propKey] !== "function"
        ) {
          if (propKey === "children") {
            children =
              props[propKey] != null ? (Array.isArray(props[propKey]) ? props[propKey] : [props[propKey]]) : undefined;
          } else {
            tagProps[propKey] = props[propKey];
          }
        }
      });
    }

    let uu5String = Uu5String.toString([{ uu5Tag, props: tagProps, children }]);
    return uu5String;
  },

  getUu5StringProps(props, allowedProps = []) {
    let filteredProps = {};
    if (props) {
      let allAllowedProps = new Set([...standardUu5StringProps, ...allowedProps]);
      for (let propKey in props) {
        if (allAllowedProps.has(propKey) && !blacklistedUu5StringProps.has(propKey)) {
          filteredProps[propKey] = props[propKey];
        }
      }
    }
    return filteredProps;
  },
};

export { Component };
export default Component;
