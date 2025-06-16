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
import { Children } from "react";
import NestingLevel from "./nesting-level.js";
import Element from "./element.js";
import Uu5String from "./uu5-string.js";
import Uu5Data from "./uu5-data.js";
import Uu5Json from "./uu5-json.js";
import ErrorComponent from "../_internal/error.js";
import checkTag from "../_internal/check-tag.js";
import findComponent from "../_internal/find-component.js";
import DynamicLibraryComponent from "../components/dynamic-library-component.js";

const Content = {
  ...Children,

  build(children, { parent, nestingLevel, childrenNestingLevel }, statics) {
    // use only specified props, omit fallback prop
    return Content._build(children, { parent, nestingLevel, childrenNestingLevel }, statics);
  },

  _build(children, { parent, nestingLevel, childrenNestingLevel, fallback }, statics) {
    let nl = childrenNestingLevel || NestingLevel.getChildNestingLevel({ nestingLevel }, statics);
    let childProps = {};
    if (parent != null) childProps.parent = parent;
    if (nl != null) childProps.nestingLevel = nl;

    let result;
    if (Array.isArray(children)) {
      result = children.map((child) => getChild(child, childProps, fallback));
    } else {
      result = getChild(children, childProps, fallback);
    }
    return result ?? null;
  },
};

function getChild(child, childProps, fallback = undefined) {
  let result;
  if (Element.isValid(child)) {
    result = addChildPropsToElement(child, childProps);
  } else {
    // uu5json / uu5data (with continued evaluation after JSON parsing)
    if (typeof child === "string") {
      if (child.match(Uu5String.REGEXP.uu5json)) {
        try {
          child = Uu5Json.parse(child);
        } catch (e) {
          if (e && e.code === "uu5JsonInvalid") {
            return getError(e, child, fallback);
          } else {
            throw e;
          }
        }
      } else if (child.match(Uu5String.REGEXP.uu5data)) {
        child = Uu5Data.parse(child);
      }
    }

    if (child && typeof child === "object") {
      // tag + props | tag + propsArray
      const uu5Tag = child.uu5Tag || child.tag; // tag is for backward compatibility
      if (uu5Tag) {
        let Component = checkTag(uu5Tag, true);
        if (Array.isArray(child.propsArray)) {
          result = child.propsArray.map((props, i) => getTagItem(uu5Tag, { ...childProps, ...props }, i, Component));
        } else {
          result = getTagItem(uu5Tag, { ...childProps, ...child.props }, undefined, Component);
        }
      } else {
        // if (process.env.NODE_ENV === "development") Tools.showError("Unsupported object used as a child:", { child });
        result = child;
      }
    } else if (typeof child === "function") {
      result = child(childProps);
    } else if (typeof child === "string" && child.match(Uu5String.REGEXP.uu5string)) {
      try {
        result = Uu5String.toChildren(child);
        if (Object.keys(childProps).length > 0 && result != null) {
          if (Array.isArray(result)) {
            result = result.map((it) => (Element.isValid(it) ? addChildPropsToElement(it, childProps) : it));
          } else if (Element.isValid(result)) {
            result = addChildPropsToElement(result, childProps);
          }
        }
      } catch (e) {
        if (e.code === "uu5StringInvalid" || e.code === "uu5JsonInvalid") {
          result = getError(e, child, fallback);
        } else {
          throw e;
        }
      }
    } else {
      result = child; // no passing of props
    }
  }
  return result;
}

function getTagItem(uu5Tag, props, key, Component = undefined) {
  if (Component === undefined) Component = checkTag(uu5Tag, true);
  let result;
  if (Component) {
    let { key: propsKey, ...otherProps } = props || {};
    result = <Component key={propsKey !== undefined ? propsKey : key} {...otherProps} />;
  } else {
    result = findComponent(uu5Tag, props.key !== undefined || key === undefined ? props : { ...props, key });
  }
  return result;
}

function getError(e, child, fallback) {
  let result;
  if (fallback !== undefined) {
    if (typeof fallback === "function") result = Element.create(fallback, { error: e });
    else result = fallback;
  } else {
    result = (
      <ErrorComponent>
        {e.message}
        <br />
        {child}
      </ErrorComponent>
    );
  }
  return result;
}

function addChildPropsToElement(jsxEl, childProps) {
  let result;
  let childPropsToCopy;
  let isDynamicLibraryComponent = jsxEl.type === DynamicLibraryComponent;
  for (let propName in childProps) {
    if (jsxEl.props[propName] != null || (isDynamicLibraryComponent && jsxEl.props.props?.[propName] != null)) {
      if (!childPropsToCopy) childPropsToCopy = { ...childProps };
      delete childPropsToCopy[propName];
    }
  }
  if (!childPropsToCopy) childPropsToCopy = childProps;
  if (Object.keys(childPropsToCopy).length > 0) {
    if (typeof jsxEl.type !== "string") {
      result = Element.clone(jsxEl, childPropsToCopy);
    } else if (jsxEl.props?.children) {
      // jsxEl is an HTML element - propage nestingLevel to components nested within this HTML element
      // (as it doesn't propagate it on its own)
      let newChildren = Content.build(
        jsxEl.props.children,
        { childrenNestingLevel: childPropsToCopy.nestingLevel, parent: childPropsToCopy.parent },
        {},
      );
      if (!Array.isArray(newChildren)) newChildren = newChildren === undefined ? [] : [newChildren];
      result = Element.clone(jsxEl, undefined, ...newChildren);
    } else {
      result = jsxEl;
    }
  } else {
    result = jsxEl;
  }
  return result;
}

export { Content };
export default Content;
