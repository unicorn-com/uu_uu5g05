import { Lsi, Utils } from "uu5g05";
import { Text } from "uu5g05-forms";
import Tools from "../tools.js";
import { TEMPLATE_MAP } from "./edit-modal-config.js";
import importLsi from "../../lsi/import-lsi.js";

const ITEM_ACTION_LIST = ["insertBefore", "insertAfter", "moveToPosition", "duplicate", "delete"];

let tabKeyCounter = 0;

const TabHelpers = {
  inputNamePrefix: "itemList_il",
  generateItemListTabKey: () => "il" + tabKeyCounter++,
  getInputNamePrefix: (key) => `itemList_${key}_`,
  transformCategoryTabList: (tabList, aggregatedPropMap) => {
    tabList = typeof tabList === "function" ? tabList() : tabList;
    return tabList.map((tab, i) => {
      if (typeof tab === "string" || tab.template) tab = applyTemplateToTab(tab);
      const mergedPropMap = TabHelpers.mergePropMaps(aggregatedPropMap, tab.propInputMap);
      const normalizedPropMap = normalizePropMap(mergedPropMap);
      const normalizedLayout = normalizeLayout(tab.layout);
      const itemPropList = getUniqueProps(normalizedLayout, tab.hiddenInputList);
      const filteredPropMap =
        normalizedPropMap && normalizedLayout && filterPropMapByKeys(normalizedPropMap, itemPropList);
      return {
        ...tab,
        layout: normalizedLayout,
        key: i,
        propInputMap: filteredPropMap,
        inputNamePrefix: "",
      };
    });
  },
  transformToInitialItemTabList: (items, propsItemTab, aggregatedPropMap) => {
    // NOTE The tab key always changes so this method can be used only for creating tab structure, not for re-creating it.
    return items.map((item, i) => {
      let inputNamePrefix = TabHelpers.getInputNamePrefix(item.key);
      let itemTab = propsItemTab;
      if (typeof propsItemTab === "function") {
        itemTab = propsItemTab({ inputNamePrefix, itemIndex: i, itemProps: item.props });
      }

      const mergedPropMap = TabHelpers.mergePropMaps(aggregatedPropMap, itemTab.propInputMap);
      const normalizedPropMap = normalizePropMap(mergedPropMap);
      const normalizedLayout = normalizeLayout(itemTab.layout);
      const itemPropList = getUniqueProps(normalizedLayout, itemTab.hiddenInputList);
      const filteredPropMap = filterPropMapByKeys(normalizedPropMap, itemPropList);
      return {
        ...itemTab,
        layout: normalizedLayout,
        key: item.key,
        propInputMap: filteredPropMap,
        inputNamePrefix,
        item,
      };
    });
  },
  mergePropMaps: (propMap1 = {}, propMap2 = {}) => {
    const mergedPropMap = { ...propMap1 };
    Object.entries(propMap2).forEach(([k, v]) => {
      if (mergedPropMap[k]) {
        mergedPropMap[k] = mergePropMapItems(mergedPropMap[k], v);
      } else {
        if (typeof v.component === "string") {
          mergedPropMap[k] = { ...v, component: mergedPropMap[v.component]?.component || Text };
        } else {
          mergedPropMap[k] = v;
        }
      }
    });
    return mergedPropMap;
  },
  getMenuList: (
    isCategory,
    list,
    activeTabKey,
    setActiveTabKey,
    closeLeft,
    currentProps,
    itemMap,
    setItemState,
    setItemValue,
    formItemMap,
    itemManageParams,
    _menuType,
  ) => {
    const menuList = list.map((tab, i) => {
      const isError = tab.propInputMap
        ? Object.values(tab.propInputMap).some(({ name }) => itemMap[tab.inputNamePrefix + name]?.valid === false)
        : false;

      let itemLabel;
      if (typeof tab.label === "function") {
        let opt = { componentProps: currentProps };
        if (!isCategory) {
          opt.itemIndex = i;
          opt.itemProps = TabHelpers.getTabProps(tab, itemMap);
        }
        itemLabel = tab.label(opt);
      }
      itemLabel = Tools.getLabel(itemLabel || tab.label);
      itemLabel = itemLabel ?? `Item ${i + 1}`;

      if (_menuType !== "tabs" && tab.template === "system") tab.icon = undefined;

      return {
        ...tab,
        children: itemLabel,
        focused: activeTabKey === tab.key,
        onClick: () => {
          setActiveTabKey(tab.key);
          if (typeof closeLeft === "function") closeLeft();
        },
        colorScheme: isError ? "problem" : undefined,
        significance: isError || activeTabKey === tab.key ? "distinct" : undefined,
        iconRight: isError ? "uugds-alert" : undefined,
        actionList: itemManageParams?.manageItem
          ? getItemActionList(
              tab.key,
              setActiveTabKey,
              itemMap,
              setItemState,
              setItemValue,
              formItemMap,
              itemManageParams,
            )
          : undefined,
      };
    });

    return menuList;
  },

  getTabProps: (tab, itemMap) => {
    if (!tab.propInputMap) return;
    const props = {};
    Object.values(tab.propInputMap).forEach(({ name }) => {
      props[name] = itemMap[tab.inputNamePrefix + name]?.value;
    });
    return props;
  },

  splitFormValue: (formValue, itemTabList, addOtherItemInfo) => {
    let valueMapWithoutItemList = { ...formValue };
    let itemListValueMapList = itemTabList.map((itemTab) => {
      let { inputNamePrefix, item } = itemTab;
      let itemValueMap = {};
      Object.keys(valueMapWithoutItemList)
        .filter((k) => k.startsWith(inputNamePrefix))
        .forEach((k) => {
          if (valueMapWithoutItemList[k] !== undefined) {
            itemValueMap[k.slice(inputNamePrefix.length)] = valueMapWithoutItemList[k];
          }
          delete valueMapWithoutItemList[k];
        });
      if (addOtherItemInfo) {
        itemValueMap = { ...item, props: { ...item.props, ...itemValueMap }, inputNamePrefix };
      }
      return itemValueMap;
    });
    return { valueMapWithoutItemList, itemListValueMapList };
  },

  generateInitialItemList(itemPropName, componentProps, itemUu5Tag, itemDefaultProps = {}, dccId) {
    let result = [];

    if (itemPropName && componentProps[itemPropName]) {
      let items;
      const { getEditablePropValue } = componentProps;
      if (typeof getEditablePropValue === "function") {
        // e.g. if itemPropName is children, we have to convert it back to uu5string (because at this point
        // it contains JSX elements which we do not know how to convert on our own)
        const editableValue = getEditablePropValue(
          { props: { ...componentProps, id: componentProps.id ?? dccId } },
          itemPropName,
        );
        items = typeof editableValue === "string" ? `<uu5string/>${editableValue}` : componentProps[itemPropName];
      } else {
        items = componentProps[itemPropName];
      }

      let modifiedItems = [];
      if (typeof items === "string") {
        let itemList = uu5stringToItems(items);
        if (itemUu5Tag && Array.isArray(itemList) && itemList.length > 0) {
          modifiedItems = itemList.filter((it) => it.uu5Tag === itemUu5Tag);
        }
      } else if (Array.isArray(items) && items.length > 0) {
        modifiedItems = items.map((item) => ({ props: item.props || item }));
      }

      result = modifiedItems.map((item) => ({
        props: { ...itemDefaultProps, ...item.props },
        key: TabHelpers.generateItemListTabKey(),
        itemId: "a" + Utils.String.generateId(7),
      }));
    }

    return result;
  },

  getNewPropsByPropMap(aggregatedPropMap, componentProps, removeNonExistProp, itemListValueMapList, itemList, tabList) {
    let newCompProps = { ...componentProps };
    let newItemPropsMap = itemListValueMapList;

    const filteredPropMap = TabHelpers.filterPropMap(aggregatedPropMap, tabList);
    // iterate only between the keys that are listed in the edit for each component
    for (let inputName in filteredPropMap) {
      // find multiple inputs according to propMap and split them into props
      if (filteredPropMap[inputName]) {
        let propMapInProps = filteredPropMap[inputName].propMap;
        let propMapInStatics = filteredPropMap[inputName].component?.editModal?.propMap;

        if (propMapInProps) {
          newCompProps = parseMultipleInputsToProps(newCompProps, propMapInProps, inputName, removeNonExistProp);
        } else if (!propMapInProps && propMapInStatics) {
          newCompProps = parseMultipleInputsToProps(newCompProps, propMapInStatics, inputName, removeNonExistProp);
        }
      }
    }

    if (Array.isArray(itemList) && itemList.length > 0) {
      itemList.forEach((tab, i) => {
        for (let { name } of Object.values(tab.propInputMap)) {
          // find multiple inputs according to propMap and split them into props
          if (tab.propInputMap[name]) {
            let propMapInProps = tab.propInputMap[name].propMap;
            let propMapInStatics = tab.propInputMap[name].component?.editModal?.propMap;

            if (name !== "-" && propMapInProps) {
              // removeNonExistProp is true, if this function is in thw onSubmit function
              // itemListValueMapList is different in currentProps and onSubmit function
              if (removeNonExistProp) {
                newItemPropsMap[i] = parseMultipleInputsToProps(
                  newItemPropsMap[i],
                  propMapInProps,
                  name,
                  removeNonExistProp,
                );
              } else {
                newItemPropsMap[i].props = parseMultipleInputsToProps(
                  newItemPropsMap[i].props,
                  propMapInProps,
                  name,
                  removeNonExistProp,
                );
              }
            } else if (name !== "-" && !propMapInProps && propMapInStatics) {
              // removeNonExistProp is true, if this function is in thw onSubmit function
              // itemListValueMapList is different in currentProps and onSubmit function
              if (removeNonExistProp) {
                newItemPropsMap[i] = parseMultipleInputsToProps(
                  newItemPropsMap[i],
                  propMapInStatics,
                  name,
                  removeNonExistProp,
                );
              } else {
                newItemPropsMap[i].props = parseMultipleInputsToProps(
                  newItemPropsMap[i].props,
                  propMapInStatics,
                  name,
                  removeNonExistProp,
                );
              }
            }
          }
        }
      });
    }
    return { newCompProps, newItemPropsMap };
  },

  filterPropMap(aggregatedPropMap, tabList) {
    // aggregatedPropMap contains keys that the component does not need to edit, it is necessary to filter these keys
    // key filtering avoids confusion of some props (e.g. label prop and label key in link.propMap)
    const normalizedPropMap = normalizePropMap(aggregatedPropMap);
    let aggregatedPropList = [];

    if (typeof tabList === "function") tabList = tabList();
    for (let tab of tabList) {
      let normalizedLayout = normalizeLayout(tab.layout);
      let propList = getUniqueProps(normalizedLayout, tab.hiddenInputList);
      aggregatedPropList = mergePropList(aggregatedPropList, propList);
    }
    return filterPropMapByKeys(normalizedPropMap, aggregatedPropList);
  },
};

export default TabHelpers;

function parseMultipleInputsToProps(savedProps, propMap, inputName, remove) {
  let result = { ...savedProps };
  let changedProps = Object.keys(propMap); // new props in multiple input
  let compProps = Object.values(propMap); // orig props for EditModal

  compProps.forEach((origProp, i) => {
    result[origProp] = savedProps[inputName] ? savedProps[inputName][changedProps[i]] : undefined;
  });

  if (remove) {
    // remove multiple input name from prop list before saving props
    delete result[inputName];
  }
  return result;
}

function mergePropList(aggregatedPropList, newPropList) {
  let result = aggregatedPropList;
  if (newPropList.length === 0) return result;

  for (let newProp of newPropList) {
    if (!result.includes(newProp)) {
      result.push(newProp);
    }
  }
  return result;
}

const uu5stringToItems = (uu5string) => {
  let items;

  let content = Utils.Uu5String.parse(uu5string);
  content.forEach((item) => {
    if (!item || typeof item !== "object") return;
    let props = { ...item.props.toObject() };
    if (item.children.length) {
      props._uu5StringParsedChildren = item.children;
    }

    items ??= [];
    items.push({
      props,
      uu5Tag: item.tag,
    });
  });

  return items;
};

const applyTemplateToTab = (tab) => {
  if (typeof tab === "string") return TEMPLATE_MAP[tab];
  const template = tab.template ? TEMPLATE_MAP[tab.template] : {};
  if (tab.propInputMap) {
    return { ...template, ...tab, propInputMap: TabHelpers.mergePropMaps(template.propInputMap, tab.propInputMap) };
  }
  return { ...template, ...tab };
};

const normalizePropMap = (propInputMap) => {
  if (!propInputMap) return;

  const normalizedPropMap = { ...propInputMap };
  Object.keys(propInputMap).forEach((key) => {
    if (!normalizedPropMap[key].name) normalizedPropMap[key].name = key;
  });
  return normalizedPropMap;
};

const normalizeLayout = (layout) => {
  let separatorIndex = 0;
  let result = {};

  if (!layout) return;

  for (let [key, value] of Object.entries(layout)) {
    let layoutWithMultipleSeparators = [];
    const valueWithoutLinebreaks = value.replace(/[\r\n]/gm, "");
    const valuesByLines = valueWithoutLinebreaks.split(",");

    layoutWithMultipleSeparators = valuesByLines.map((value) => {
      let componentList = value.split(/\s+/).filter((item) => !!item);
      let isPreviousSeparator = false;

      componentList = componentList.map((item) => {
        let isSeparator = item === "-";
        if (!isSeparator) {
          isPreviousSeparator = false;
          return item;
        }
        if (!isPreviousSeparator) {
          separatorIndex++;
        }
        isPreviousSeparator = true;
        return `_sep_${separatorIndex}`;
      });
      return componentList.join(" ");
    });
    separatorIndex = 0;
    result[key] = layoutWithMultipleSeparators.join(",");
  }
  return result;
};

const mergePropMapItems = (propMapItem1 = {}, propMapItem2 = {}) => {
  let props;
  if (typeof propMapItem1.props === "object" && typeof propMapItem2.props === "object") {
    props = { ...propMapItem1.props, ...propMapItem2.props };
  } else {
    props = (...args) => ({
      ...(typeof propMapItem1.props === "function" ? propMapItem1.props(...args) : propMapItem1.props),
      ...(typeof propMapItem2.props === "function" ? propMapItem2.props(...args) : propMapItem2.props),
    });
  }
  return {
    ...propMapItem1,
    ...propMapItem2,
    props,
  };
};

const filterPropMapByKeys = (propInputMap, keys) => {
  const filteredPropMap = {};
  keys.forEach((key) => {
    if (key.startsWith("_sep")) {
      filteredPropMap[key] = propInputMap["-"];
    } else {
      filteredPropMap[key] = propInputMap[key];
    }
  });
  return filteredPropMap;
};

const getUniqueProps = (layout, hiddenInputList) => {
  const result = hiddenInputList || [];
  if (!layout) return result;

  const screenSizes = Object.keys(layout);

  for (let i = 0; i < screenSizes.length; i++) {
    let namesInOneRow = layout[screenSizes[i]].split(",");
    for (let row of namesInOneRow) {
      let regexpSpaces = /[\s\n.]+/;
      if (row.includes(" ")) {
        // one row has multiple inputs
        let names = row.split(" ").filter(Boolean);
        for (let name of names) {
          if (!regexpSpaces.test(name) && !result.includes(name)) result.push(name);
        }
      } else {
        // one row has one input
        if (!regexpSpaces.test(row) && !result.includes(row)) result.push(row);
      }
    }
  }
  return result;
};

const getItemActionList = (
  tabKey,
  setActiveTabKey,
  stateMap,
  setItemState,
  setItemValue,
  formItemMap,
  itemManageParams,
) => {
  const { manageItem, openPositionModal, openRemovalDialog } = itemManageParams;
  const actionList = [
    { onClick: () => manageItem.add({ atTabKey: tabKey, activateTab: setActiveTabKey, setItemValue, before: true }) },
    { onClick: () => manageItem.add({ atTabKey: tabKey, activateTab: setActiveTabKey, setItemValue, before: false }) },
    { onClick: (e) => openPositionModal(new Utils.Event({ tabKey }, e)) },
    { onClick: () => manageItem.duplicate(tabKey, setActiveTabKey, stateMap, setItemState, formItemMap) },
    { onClick: (e) => openRemovalDialog(new Utils.Event({ tabKey }, e)) },
  ];
  return actionList.map((action, i) => ({
    ...action,
    collapsed: true,
    colorScheme: "primary",
    children: <Lsi import={importLsi} path={["EditModal", ITEM_ACTION_LIST[i]]} />,
  }));
};
