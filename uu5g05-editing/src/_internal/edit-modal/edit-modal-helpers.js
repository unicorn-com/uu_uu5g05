//@@viewOn:imports
import TabHelpers from "./tab-helpers.js";
//@@viewOff:imports

//@@viewOn:helpers
function mergeItemProps(itemProps, initialValueMap) {
  let mergedItemProp = {};
  for (let propName in itemProps) {
    // if value of a prop (propName) is not defined and this prop doesn't have a defined default prop
    // user can set initialValue in props in propInputName of EditModal
    mergedItemProp[propName] = itemProps[propName] ?? initialValueMap[propName];
  }
  return mergedItemProp;
}

function setInitialvalue(filteredPropMap, inputName, propsParameters, result) {
  let initialValueMap = {};
  let initialValue;
  if (typeof filteredPropMap[inputName].props === "function") {
    initialValue = filteredPropMap[inputName].props(propsParameters).initialValue;
  } else {
    initialValue = filteredPropMap[inputName].props?.initialValue;
  }
  if (initialValue) {
    for (let prop in initialValue) {
      initialValueMap[prop] = initialValue[prop];
    }
  }

  return mergeItemProps(result, initialValueMap);
}

function setValueForMultipleInputs(origCompProps, propMap, inputName, itemParams) {
  let result = { ...origCompProps };
  let changedProps = Object.keys(propMap); // new props in multiple input
  let savedProps = Object.values(propMap); // orig props in EditModal
  let initialValue = {};

  changedProps.forEach((prop, i) => {
    initialValue[prop] = itemParams ? itemParams.origItemProps[savedProps[i]] : origCompProps[savedProps[i]];
  });
  if (itemParams) {
    result[itemParams.tab.inputNamePrefix + inputName] = initialValue;
  } else {
    result[inputName] = initialValue;
  }
  return result;
}
//@@viewOff:helpers

const EditModalHelpers = {
  getInitialValue: (
    componentPropsWithDefaults,
    aggregatedPropMap,
    tabList,
    componentProps,
    componentType,
    defaultProps,
    nestingLevelList,
    itemList,
    itemDefaultProps,
  ) => {
    let result = { ...componentPropsWithDefaults };
    // result contains all component props

    const filteredPropMap = TabHelpers.filterPropMap(aggregatedPropMap, tabList);
    // iterate only between the keys that are listed in the edit for each component
    for (let inputName in filteredPropMap) {
      // looking for propMap
      // value of a prop is an object with different props for the component with multiple inputs
      if (filteredPropMap[inputName]) {
        let propMapInProps = filteredPropMap[inputName].propMap;
        let propMapInStatics = filteredPropMap[inputName].component?.editModal?.propMap;

        // parameters for props as a function
        let propsParameters = { componentProps, componentType, defaultProps, nestingLevelList, inputProps: {} };

        if (propMapInProps) {
          let modifiedResult = setInitialvalue(filteredPropMap, inputName, propsParameters, result);
          result = setValueForMultipleInputs(modifiedResult, propMapInProps, inputName);
        } else if (!propMapInProps && propMapInStatics) {
          let modifiedResult = setInitialvalue(filteredPropMap, inputName, propsParameters, result);
          result = setValueForMultipleInputs(modifiedResult, propMapInStatics, inputName);
        } else {
          // set initialValue for component prop
          let initialValue;
          if (typeof filteredPropMap[inputName].props === "function") {
            initialValue = filteredPropMap[inputName].props(propsParameters).initialValue;
          } else {
            initialValue = filteredPropMap[inputName].props?.initialValue;
          }
          if (initialValue && !componentProps[inputName]) {
            result[inputName] = initialValue;
          }
        }
      }
    }

    delete result.itemList;
    itemList.forEach((tab, i) => {
      // the item list is created from a prop defined by itemPropName prop of EditModal (often children)
      // each item has own prefix
      // item props are inserted into the result

      let itemInitialValueMap = {};
      for (let { name } of Object.values(tab.propInputMap)) {
        // looking for propMap
        // value of a prop is an object with different props for the component with multiple inputs
        let propMapInProps, propMapInStatics;
        if (tab.propInputMap[name]) {
          propMapInProps = tab.propInputMap[name].propMap;
          propMapInStatics = tab.propInputMap[name].component?.editModal?.propMap;
        }

        let easierItemList = itemList.map((item) => ({
          inputNamePrefix: item.inputNamePrefix,
          itemId: item.item.itemId,
          key: item.key,
          props: item.item.props,
        }));

        // parameters for props as a function
        // componentProps doesn't contain itemList, itemList is created from a prop (often children)
        let propsParameters = {
          componentProps: { ...componentProps, itemList: easierItemList },
          componentType,
          defaultProps,
          nestingLevelList,
          itemProps: tab.item.props,
          itemIndex: i,
          itemDefaultProps,
          inputNamePrefix: tab.inputNamePrefix,
        };

        if (name !== "-" && propMapInProps) {
          // set initialValue for item prop
          let initialValue;
          if (typeof tab.propInputMap[name].props === "function") {
            initialValue = tab.propInputMap[name].props(propsParameters).initialValue;
          } else {
            initialValue = tab.propInputMap[name].props?.initialValue;
          }
          if (initialValue) {
            for (let prop in initialValue) {
              itemInitialValueMap[prop] = initialValue[prop];
            }
          }

          let itemProps = mergeItemProps(tab.item.props, itemInitialValueMap);
          // set multiple value for item prop (multiple input)
          result = setValueForMultipleInputs(result, propMapInProps, name, {
            tab,
            origItemProps: itemProps,
          });
        } else if (name !== "-" && !propMapInProps && propMapInStatics) {
          // set initialValue for item prop
          let initialValue;
          if (typeof tab.propInputMap[name].props === "function") {
            initialValue = tab.propInputMap[name].props(propsParameters).initialValue;
          } else {
            initialValue = tab.propInputMap[name].props?.initialValue;
          }
          if (initialValue) {
            for (let prop in initialValue) {
              itemInitialValueMap[prop] = initialValue[prop];
            }
          }

          let itemProps = mergeItemProps(tab.item.props, itemInitialValueMap);
          // set multiple value for item prop (multiple input)
          result = setValueForMultipleInputs(result, propMapInStatics, name, {
            tab,
            origItemProps: itemProps,
          });
        } else {
          if (name !== "-") {
            // set initialValue for item prop
            let initialValue;
            if (typeof tab.propInputMap[name].props === "function") {
              initialValue = tab.propInputMap[name].props(propsParameters).initialValue;
            } else {
              initialValue = tab.propInputMap[name].props?.initialValue;
            }
            if (initialValue) itemInitialValueMap[name] = initialValue;
          }

          let itemProps = mergeItemProps(tab.item.props, itemInitialValueMap);
          // set value for "normal" item prop
          result[tab.inputNamePrefix + name] = itemProps[name];
        }
      }
    });

    // result contains all component props and all item props
    // result e.g. { colorScheme: "abc", itemlist_id1_label: "a", itemlist_id1_width: 10, itemlist_id2_label: "b" }
    return result;
  },
};

//@@viewOn:exports
export { EditModalHelpers };
export default EditModalHelpers;
//@@viewOff:exports
