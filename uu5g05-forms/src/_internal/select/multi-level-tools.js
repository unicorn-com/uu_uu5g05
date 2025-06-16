function getFlattenList(itemList, parent, opts = { category: 0 }) {
  let rootList = [];
  let nestedList = [];

  itemList.forEach((item) => {
    const { itemList: childList, multiple, ...newItem } = item;

    if (parent) newItem.parent = parent;

    if (childList) {
      // Create unique category attribute
      newItem.category = `category-${opts.category}`;
      newItem.value = newItem.category;
      // Raise category index
      opts.category++;
    }

    rootList.push(newItem);

    if (childList) {
      const newParent = { value: newItem.category, children: newItem.children, multiple };
      if (parent) newParent.parent = parent;
      nestedList.push(...getFlattenList(childList, newParent, opts));
    }
  });

  return [...rootList, ...nestedList];
}

function getDupMultilevelList(catMap, category) {
  const catMapItem = catMap.get(category);
  if (!catMapItem) return;

  return catMapItem.map((item) => {
    const dupItem = { ...item };

    if (dupItem.category) dupItem.itemList = getDupMultilevelList(catMap, dupItem.category);

    return dupItem;
  });
}

function getMultilevelList(itemList) {
  const rootNodes = [];

  const catMap = new Map();

  // Create copy
  const dupList = [];
  itemList.map((item) => {
    dupList.push({ ...item });
    if (!item.root && item.parent) {
      const catMapItem = catMap.get(item.parent.value);
      if (!catMapItem) {
        catMap.set(item.parent.value, [item]);
      } else {
        catMapItem.push(item);
      }
    }
  });

  // Create a mapping of nodes by their value
  const nodeMap = dupList.reduce((map, node) => {
    const keyValue = node.category || node.value;
    map.set(keyValue, node);
    return map;
  }, new Map());

  // Nest nodes based on their parent
  dupList.forEach((node) => {
    if (node.category) {
      node.key = node.category;
    }

    if (!node.parent || node.root) {
      rootNodes.push(node);
      return;
    }

    const parentNode = nodeMap.get(node.parent.value);
    if (!parentNode) {
      rootNodes.push(node);
      return;
    }

    if (!parentNode.itemList) parentNode.itemList = [];

    parentNode.itemList.push(node);
  });

  // Iterate over root level and fill nested items
  rootNodes.forEach((item) => {
    if (item.category && item.root && item.parent) {
      item.itemList = getDupMultilevelList(catMap, item.category);
    }
  });

  // Remove keys
  _removeKeys(rootNodes);

  return rootNodes;
}

function isMultilevel(itemList) {
  return itemList.some((item) => item.itemList);
}

function getPath(value) {
  const path = [];

  (function addToPath(item) {
    if (item.parent) addToPath(item.parent);
    path.push(item.value);
  })(value);

  return path;
}

// Function iterate through array and recursively remove specific keys
function _removeKeys(array) {
  array.forEach((item) => {
    delete item.category;
    delete item.root;
    if (item.itemList) _removeKeys(item.itemList);
  });
}

//@@viewOn:exports
export { getFlattenList, getMultilevelList, isMultilevel, getPath };
//@@viewOff:exports
