//@@viewOn:imports
import { Utils } from "uu5g05";
//@@viewOff:imports

//@@viewOn:helpers
//@@viewOff:helpers

const Item = {
  filterComponents(children, parentStatics, includeEditableWrapper = false) {
    let componentRawUu5Tag = parentStatics.uu5Tag.split("(").pop().replace(/\)/g, ""); // remove `withXyz(...)` HOCs
    let newChildList = [];
    for (let item of children) {
      // this is workaround due to uuEcc, calling editMode.onChange with children containing uu5string
      // results in uuEcc sending us the same uu5string (not converted to jsx)
      // therefore we convert it to jsx here
      if (typeof item === "string" && Utils.Uu5String.REGEXP.uu5string.test(item)) {
        try {
          const newItem = Utils.Uu5String.toChildren(item);
          newChildList.push(newItem);
        } catch {
          // invalid uu5string
        }
      } else {
        newChildList.push(item);
      }
    }

    let itemComponents = newChildList
      .map((item) => {
        let result;

        if (item?.type?.uu5Tag === componentRawUu5Tag + ".Item") {
          // in case the editing is turned off
          result = item;
        } else if (item?.props?.uu5Tag === componentRawUu5Tag + ".Item") {
          // in case we have <DynamicLibraryComponent uu5Tag="..." props={...} />
          result = {
            type: { uu5Tag: item.props.uu5Tag },
            props: { ...item.props.props, children: item.props.children },
          };
        } else if (item?.props?.componentName === componentRawUu5Tag + ".Item") {
          // in case we have uuEcc wrapper
          result = {
            type: { uu5Tag: item.props.componentName },
            props: {
              ...item.props.componentProps,
              children: includeEditableWrapper ? item : item.props.children,
            },
            isEditableWrapperWithItem: includeEditableWrapper,
            renderEditableWrapper: includeEditableWrapper
              ? (itemContentFn) => {
                  let finalChildrenJsx = itemContentFn(item.props.children);
                  // NOTE uuEcc needs "children" to be an array, otherwise it decides that the component is empty
                  // and replaces content with uuEcc Placeholder.
                  if (!Array.isArray(finalChildrenJsx)) {
                    finalChildrenJsx = finalChildrenJsx != null ? [finalChildrenJsx] : finalChildrenJsx;
                  }
                  return Utils.Element.clone(item, { children: finalChildrenJsx });
                }
              : undefined,
          };
        } else if (item?.props?.childTagName === componentRawUu5Tag + ".Item") {
          // in case we have uuDcc wrapper
          result = {
            type: { uu5Tag: componentRawUu5Tag + ".Item" },
            props: {
              ...item.props.children?.[0]?.props,
              children: includeEditableWrapper ? item : item.props.children?.[0]?.props?.children,
            },
            isEditableWrapperWithItem: includeEditableWrapper,
            renderEditableWrapper: includeEditableWrapper
              ? (itemContentFn) => {
                  let finalChildrenJsx = itemContentFn(item.props.children?.[0]?.props?.children);
                  let updatedItemJsx = Utils.Element.clone(item.props.children?.[0], {
                    children: finalChildrenJsx,
                  });
                  return Utils.Element.clone(item, { children: [updatedItemJsx] });
                }
              : undefined,
          };
        }
        return result;
      })
      .filter(Boolean);
    return itemComponents;
  },
};

//@@viewOn:exports
export { Item };
export default Item;
//@@viewOff:exports
