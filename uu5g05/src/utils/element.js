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
import Tools from "../_internal/tools.js";

let warnedBg;
function warnIfUsingBackgroundProp(type, props) {
  if (type?.displayName?.match(/Uu5Elements|Uu5Forms|Plus4U5App|Plus4U5Elements/) && !type.propTypes?.background) {
    warnedBg ??= {};
    if (
      !warnedBg[type.displayName] &&
      props?.background != null &&
      /^[a-zA-Z0-9-]+$/.test(props.background) &&
      type.logger
    ) {
      warnedBg[type.displayName] = true;
      type.logger.warn(
        `Deprecated usage of prop 'background=${props.background}' detected. See stack trace for finding out parent component which did this (closest 'render' method call). You should never pass value in this prop directly anymore. Nest the component into standard uu5g05-elements components or into uu5g05's BackgroundProvider for custom background.`,
        { props },
      );
    }
  }
}

function checkJsxBeforeCreate(type, props) {
  // NOTE If a check for props.key is needed in the future, then update call sites as they currently do not send the key in all cases.
  if (process.env.NODE_ENV === "test" && type == null) {
    throw new Error(
      "Element type is: " +
        type +
        ". You likely forgot to import necessary library, or forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.",
    );
  }
  if (process.env.NODE_ENV !== "production") warnIfUsingBackgroundProp(type, props);

  // disable passing of "javascript:" hrefs onto links
  props = disableUnsafeHrefs(type, props);

  return props;
}

const createElementWithEmotionFix =
  process.env.NODE_ENV === "test"
    ? (fn) => {
        // workaround for @emotion/jest serializer bug which tries to delete some props from existing JSX nodes which are frozen,
        // i.e. it throws => make JSX nodes (and node.props) not frozen for tests
        let origFreeze = Object.freeze;
        try {
          Object.freeze = () => {};
          return fn();
        } finally {
          Object.freeze = origFreeze;
        }
      }
    : (fn) => fn();

const Element = {
  create(type, props, ...otherArgs) {
    props = checkJsxBeforeCreate(type, props);

    let result;
    if (process.env.NODE_ENV === "test") {
      result = createElementWithEmotionFix(() => React.createElement(type, props, ...otherArgs));
    } else {
      result = React.createElement(type, props, ...otherArgs);
    }
    return result;
  },

  clone(...args) {
    // disable passing of "javascript:" hrefs onto links
    let type = args[0]?.type;
    args[1] = disableUnsafeHrefs(type, args[1]);

    let result = React.cloneElement(...args);

    if (process.env.NODE_ENV !== "production") warnIfUsingBackgroundProp(args[0]?.type, args[1]);
    return result;
  },

  isValid(...args) {
    return React.isValidElement(...args);
  },
};

function disableUnsafeHrefs(type, props) {
  let safeProps;
  if ((type === "a" || type === "link") && props && typeof props === "object") {
    for (let k in props) {
      // must also sanitize props.HREF, props.hRef, etc.
      if (k.toLowerCase() === "href") {
        let href = props[k];
        let sanitizedHref = Tools.sanitizeHref(href);
        if (href !== sanitizedHref) {
          safeProps ??= { ...props };
          safeProps[k] = sanitizedHref;
        }
      }
    }
  }
  return safeProps ?? props;
}

export { Element, checkJsxBeforeCreate, createElementWithEmotionFix };
export default Element;
