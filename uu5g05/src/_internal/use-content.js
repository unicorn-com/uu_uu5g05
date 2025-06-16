//@@viewOn:imports
import { Fragment } from "react";
import Content from "../utils/content.js";
import { useMemo } from "../hooks/react-hooks.js";
import NestingLevel from "../utils/nesting-level.js";
import UtilsElement from "../utils/element.js";
//@@viewOff:imports

// builds children without necessarily re-rendering the whole children subtree in case that
// the component (where useContent is used) simply changed its state without modifying its
// nestingLevel/children
function useContent(children, props) {
  //@@viewOn:private
  let { nestingLevel, childrenNestingLevel, parent, fallback } = props;
  let result = useMemo(() => {
    // we're assuming that nestingLevel is already computed and by passing NestingLevel.valueList
    // it'll be used directly (if it wasn't computed, we would have to get supported nesting levels of our parent
    // component)
    return Content._build(
      children,
      { nestingLevel, childrenNestingLevel, parent, fallback },
      { nestingLevel: NestingLevel.valueList },
    );
  }, [children, nestingLevel, childrenNestingLevel, parent, fallback]);
  //@@viewOff:private

  //@@viewOn:render
  // NOTE Normally, we would just return result even if it was array. However, React would warn that array items need "key" prop
  // because it wouldn't consider it as "static" children (as opposed to using <Parent><Child1 /><Child2 /></Parent> where it doesn't
  // require keys on Child1/Child2). For this component there's no real point in adding keys to top-level items, so for simplicity
  // we'll skip the development warning by using Fragment and constructing it as if it had "static" children (each child sent as separate argument).
  // NOTE Example of where warning was occurring:
  //   const Bold = () => null;
  //   Uu5.Utils.Dom.render(
  //     <Content>
  //       Hello,
  //       <span>
  //         <Bold>world!</Bold>
  //       </span>
  //     </Content>,
  //     document.createElement("div")
  //   );
  return process.env.NODE_ENV !== "production" && Array.isArray(result)
    ? UtilsElement.create(Fragment, undefined, ...result)
    : result;
  //@@viewOff:render
}

export { useContent };
export default useContent;
