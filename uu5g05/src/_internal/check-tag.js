import React from "react";
import Tools from "../_internal/tools.js";
import { getComponentByName } from "../hooks/use-dynamic-library-component.js";

const REACT_LAZY_TYPEOF = React.lazy && React.lazy(() => ({ default: () => null })).$$typeof;
const REACT_MEMO_TYPEOF = React.memo && React.memo(() => null).$$typeof;

function checkTag(tag, hideError) {
  let result = null;
  switch (typeof tag) {
    case "string": {
      let { Component, error } = getComponentByName(tag);
      result = Component ?? null;
      if (error && !hideError) {
        Tools.error("Unknown tag " + tag + " - element was not found.", {
          notFoundObject: result,
          notFoundObjectType: typeof result,
        });
      }
      break;
    }
    case "function":
      result = tag;
      break;
    case "object":
      if (tag && (tag.isUu5PureComponent || tag.$$typeof === REACT_MEMO_TYPEOF || tag.$$typeof === REACT_LAZY_TYPEOF)) {
        result = tag;
      }
      break;
    case "symbol":
      if (tag === React.Fragment) {
        result = tag;
      }
      break;
  }

  return result;
}

export { checkTag };
export default checkTag;
