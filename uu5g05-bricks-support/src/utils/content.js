//@@viewOn:imports
import { Content as Uu5Content, Utils } from "uu5g05";
import Config from "../config/config.js";
import { preferContentProp } from "../with-dcc.js";
//@@viewOff:imports

//@@viewOn:helpers
function isValidElement(value) {
  return value?.type?.uu5Tag || value?.type?.displayName || Utils.Element.isValid(value);
}

function existValidChild(children) {
  return (
    Array.isArray(children) &&
    children.some((it) => !(isValidElement(it) || typeof it === "string" || typeof it === "number"))
  );
}
//@@viewOff:helpers

const Content = {
  build({
    index,
    children,
    nestingLevel,
    childrenNestingLevel,
    content,
    isEditableWrapperWithItem,
    renderEditableWrapper,
  }) {
    let result = null;
    let contentProps = {};
    if (nestingLevel) contentProps.nestingLevel = nestingLevel;
    if (childrenNestingLevel) contentProps.childrenNestingLevel = childrenNestingLevel;
    if (preferContentProp(content, children)) children = content;

    if (children) {
      if (isEditableWrapperWithItem) {
        result = renderEditableWrapper((itemContent) =>
          itemContent != null &&
          [itemContent].flat().some((it) => it != null && (typeof it !== "string" || it.trim() !== "")) ? (
            <Uu5Content key={index !== undefined ? `child_with_wrapper_${index + 1}` : undefined} {...contentProps}>
              {itemContent}
            </Uu5Content>
          ) : (
            itemContent
          ),
        );
      } else {
        result = Content.getCorrectNodeType(children, {
          ...contentProps,
          key: index !== undefined ? `child_${index + 1}` : undefined,
        });
      }
    }
    return result;
  },
  addPadding(className, padding, spacing) {
    let validPadding = Utils.Style.replaceAdaptiveSpacing(padding, spacing);
    let formattedPadding = Utils.ScreenSize.convertStringToObject(validPadding);
    let paddingStyle = Utils.Style.parseSpace(formattedPadding, "padding");

    let result = className;

    if (paddingStyle) {
      result = Utils.Css.joinClassName(result, Config.Css.css(paddingStyle));
    }

    return result;
  },
  getCorrectNodeType(children, props) {
    if (
      (typeof children === "string" && !Utils.Uu5String.REGEXP.uu5string.test(children)) ||
      typeof children === "number" ||
      existValidChild(children)
    ) {
      // if it is possible, the result will be not jsx due to bad value display in the inputs in EditModal or Plus4UGo
      return children;
    } else if (
      (typeof children === "string" && Utils.Uu5String.REGEXP.uu5string.test(children)) ||
      isValidElement(children) ||
      Array.isArray(children)
    ) {
      // children as arrays must also be wrapped in Uu5Content for proper display of nestingLevel nested component
      let key;
      if (props && "key" in props) ({ key, ...props } = props);
      return (
        <Uu5Content key={key} {...props}>
          {children}
        </Uu5Content>
      );
    }
  },
};

//@@viewOn:exports
export { Content };
export default Content;
//@@viewOff:exports
