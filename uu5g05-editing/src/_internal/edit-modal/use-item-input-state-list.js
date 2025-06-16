import { useState, useMemo, Utils } from "uu5g05";
import TabHelpers from "./tab-helpers";

const useItemInputStateList = ({
  componentProps,
  itemPropName,
  itemDefaultProps,
  itemTab,
  itemUu5Tag,
  aggregatedPropMap,
  dccId,
}) => {
  const [itemList, setItemList] = useState(() =>
    TabHelpers.generateInitialItemList(itemPropName, componentProps, itemUu5Tag, itemDefaultProps, dccId),
  );

  const usedItemList = useMemo(() => {
    return TabHelpers.transformToInitialItemTabList(itemList, itemTab, aggregatedPropMap);
  }, [aggregatedPropMap, itemList, itemTab]);

  const addItem = ({ atTabKey, activateTab, setItemValue, before, itemParams = {} }) => {
    setItemList((prev) => {
      let newItem = {
        key: TabHelpers.generateItemListTabKey(),
        itemId: "a" + Utils.String.generateId(7),
        ...itemParams,
        props: { ...itemDefaultProps, ...itemParams?.props },
      };
      let index = prev.findIndex((it) => it.key === atTabKey);
      if (index === -1) index = prev.length;
      else if (!before) index++;
      let newList = [...prev];
      newList.splice(index, 0, newItem);
      if (typeof activateTab === "function") activateTab(newItem.key);

      // Set form item values
      for (const prop of Object.keys(newItem.props)) {
        let inputNamePrefix = TabHelpers.getInputNamePrefix(newItem.key);
        setItemValue(inputNamePrefix + prop, newItem.props[prop]);
      }
      return newList;
    });
  };

  const removeItem = (key, activateTab, categoryList, setItemState, formItemMap) => {
    setItemList((prev) => {
      let index = prev.findIndex((it) => it.key === key);
      if (index === -1) return prev;

      let newList = [...prev];
      let [removedItem] = newList.splice(index, 1);
      for (let name in formItemMap) {
        if (name.includes(TabHelpers.getInputNamePrefix(removedItem.key))) {
          setItemState(name, null);
        }
      }
      if (newList.length) activateTab(newList[index === 0 ? 0 : index - 1].key, false);
      else activateTab(categoryList[0]?.key, false);
      return newList;
    });
  };

  const duplicateItem = (key, activateTab, stateMap, setItemState, formItemMap) => {
    setItemList((prev) => {
      let index = prev.findIndex((it) => it.key === key);
      if (index === -1) return prev;

      let sourceTab = prev[index];
      let newKey = TabHelpers.generateItemListTabKey();
      let newTab = { ...sourceTab, key: newKey, itemId: "a" + Utils.String.generateId(7) };
      let newList = [...prev];
      newList.splice(index + 1, 0, newTab);
      for (let name in formItemMap) {
        if (name.includes(TabHelpers.getInputNamePrefix(sourceTab.key))) {
          let propName = getPropName(name, TabHelpers.getInputNamePrefix(sourceTab.key));
          setItemState(
            TabHelpers.getInputNamePrefix(newKey) + propName,
            stateMap[TabHelpers.getInputNamePrefix(sourceTab.key) + propName],
          );
        }
      }
      for (let name in sourceTab.propInputMap) {
        setItemState(newTab.inputNamePrefix + name, stateMap[sourceTab.inputNamePrefix + name]);
      }
      activateTab(newKey);
      return newList;
    });
  };

  const moveItem = (key, newIndex) => {
    setItemList((prev) => {
      let newList = [...prev];
      let oldIndex = newList.findIndex((it) => it.key === key);
      if (oldIndex === -1) return prev;

      const [movedItem] = newList.splice(oldIndex, 1);
      newList.splice(newIndex, 0, movedItem);
      return newList;
    });
  };

  const manageItem = {
    add: addItem,
    remove: removeItem,
    duplicate: duplicateItem,
    move: moveItem,
  };

  return { itemList: usedItemList, manageItem };
};

export default useItemInputStateList;

function getPropName(name, inputNamePrefix) {
  return name.substring(inputNamePrefix.length);
}
