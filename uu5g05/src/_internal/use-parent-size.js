import React from "react";
import { useRef } from "../hooks/react-hooks.js";
import { useElementSize } from "../hooks/use-element-size.js";

function useParentSize(params) {
  const { ref, width, height, contentWidth, contentHeight } = useElementSize(params);

  const componentRef = useRef();
  if (componentRef.current == null) {
    const spanRefFn = (spanRef) => {
      let parentNode = spanRef ? spanRef.parentNode : spanRef;
      while (parentNode && parentNode.tagName && getComputedStyle(parentNode).display == "inline") {
        parentNode = parentNode.parentNode;
      }
      ref(parentNode);
    };
    componentRef.current = function Observer(props) {
      return <span ref={spanRefFn} hidden />;
    };
  }

  return { Resizer: componentRef.current, width, height, contentWidth, contentHeight };
}

export { useParentSize };
export default useParentSize;
