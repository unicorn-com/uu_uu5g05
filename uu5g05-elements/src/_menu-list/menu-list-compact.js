//@@viewOn:imports
import {
  createVisualComponent,
  Utils,
  useState,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  usePreviousValue,
  useValueChange,
  PropTypes,
} from "uu5g05";
import Config from "../config/config.js";
import Tools from "../_internal/tools.js";
import MenuListBody from "./menu-list-body.js";
import MenuListContext from "./menu-list-context.js";
//@@viewOff:imports

const ANIMATION_LENGTH = 500;

const ANIMATION_LEFT_TO_CENTER = Config.Css.keyframes({
  "0%": { transform: "translateX(-100%)" },
  "100%": { transform: "translateX(0%)" },
});

const ANIMATION_RIGHT_TO_CENTER = Config.Css.keyframes({
  "0%": { transform: "translateX(100%)" },
  "100%": { transform: "translateX(0%)" },
});

const ANIMATION_CENTER_TO_LEFT = Config.Css.keyframes({
  "0%": { transform: "translateX(0%)" },
  "100%": { transform: "translateX(-100%)" },
});

const ANIMATION_CENTER_TO_RIGHT = Config.Css.keyframes({
  "0%": { transform: "translateX(0%)" },
  "100%": { transform: "translateX(+100%)" },
});

const CSS = {
  main: (isAnimating, height, maxHeight) =>
    Config.Css.css({
      position: "relative",
      height,
      transition: `height ${ANIMATION_LENGTH}ms`,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      maxHeight,
      ...(isAnimating ? { overflow: "hidden" } : undefined),
    }),
  primaryMenuData: (animationType) =>
    Config.Css.css({
      animation: animationType ? `${animationType} ${ANIMATION_LENGTH}ms` : undefined,
    }),
  secondaryMenuData: (animationType) =>
    Config.Css.css({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      pointerEvents: "none",
      animation: animationType ? `${animationType} ${ANIMATION_LENGTH}ms` : undefined,
      // Prevent return of the element to its original position after the animation ends,
      // because its unmount is in timeout and it can happen with a slight delay, causing it
      // to be visible in the original position for a split second.
      animationFillMode: "forwards",
    }),
};

const MenuListCompact = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MenuListCompact",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...MenuListBody.propTypes,
    value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    onChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...MenuListBody.defaultProps,
    value: undefined,
    onChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      itemList: itemListProp,
      maxHeight,
      role,
      className,
      elementRef,
      value,
      onChange: onChangeProp,
      _onBackClick,
      ...propsToPass
    } = props;
    const { collapsibleIconVisibility } = propsToPass;

    const onChange =
      typeof onChangeProp === "function"
        ? (value) => {
            const e = new Utils.Event({ value });
            onChangeProp(e);
          }
        : null;

    const [primaryMenuPath, setPrimaryMenuPath] = useValueChange(value || [], onChange);
    const [secondaryMenuPath, setSecondaryMenuPath] = useState();

    function handleChangeMenu(newPrimaryMenuPath, newSecondaryMenuPath) {
      setPrimaryMenuPath(newPrimaryMenuPath);
      setSecondaryMenuPath(newSecondaryMenuPath);
    }

    // Add key attribute in every item and transform itemList to Map for better manipulation
    const itemListMap = useMemo(() => getItemMap(getItemList(itemListProp)), [itemListProp]);

    // Checks the path and detects unreachable path - if so, update PrimaryMenuPath
    useMemo(() => {
      let goodParentPath = [];
      let resultItemListMap = itemListMap;
      let parentItem;

      // Compare path with itemList and check if some of the data are unreachable
      for (let i = 0; i < primaryMenuPath.length; i++) {
        const resultItem = resultItemListMap.get(primaryMenuPath[i]);
        if (!resultItem?.itemList?.size) {
          goodParentPath.push(false);
          break;
        } else {
          goodParentPath.push(true);
        }
        parentItem = resultItem;
        resultItemListMap = parentItem.itemList;
      }

      if (goodParentPath.some((i) => i === false)) {
        // If Path changed, update PrimaryMenuPath and animate it with secondaryMenuPath
        setSecondaryMenuPath(primaryMenuPath);
        setPrimaryMenuPath(
          goodParentPath
            .filter((i) => i)
            .map((_, index) => {
              return primaryMenuPath[index];
            }),
        );
      }
    }, [itemListMap, primaryMenuPath]);

    const openParamsConfigRef = useRef({});

    function onBackClick(e) {
      e?.preventDefault?.(); // don't close whole menu tree
      e?.currentTarget?.blur(); // Remove focus from clicked item because it is animating out and it looks weird

      if (primaryMenuPath.length) {
        let newPrimaryMenuPath = [...primaryMenuPath];
        newPrimaryMenuPath.splice(primaryMenuPath.length - 1, 1);
        newPrimaryMenuPath = getUncollapsibleParent(itemListMap, newPrimaryMenuPath);

        openParamsConfigRef.current = {
          params: {
            autoFocus: e?.data?.autoFocus ?? (e?.key === "Enter" || e?.key === "NumpadEnter" || e?.key === " "),
          },
        };

        handleChangeMenu(newPrimaryMenuPath, primaryMenuPath);

        // Handle new set menu item index
        if (typeof _onBackClick === "function") _onBackClick(new Utils.Event({ value: newPrimaryMenuPath }, e));
      }
    }

    const { resultItemList: primaryMenuList } = getLevelList(itemListMap, primaryMenuPath);

    const primaryMenuItemList = useRef();
    primaryMenuItemList.current = primaryMenuList;

    const primaryMenuListToRender = applyOpenParams(
      getLevelList(itemListMap, primaryMenuPath, onBackClick), // Add back button
      openParamsConfigRef.current.params,
    );
    const { resultItemList: secondaryMenuListToRender } = getLevelList(itemListMap, secondaryMenuPath, (e) => {
      e?.preventDefault?.();
    });

    const openSubmenu = useCallback(
      (itemWithSubmenu, e, openParams = {}) => {
        e?.currentTarget?.blur(); // Remove focus from clicked item because it is animating out and it looks weird

        openParamsConfigRef.current = { params: openParams };

        let nextPath = getPathToItem(itemWithSubmenu, primaryMenuItemList.current);
        if (!Array.isArray(nextPath)) {
          nextPath = [nextPath];
        }
        handleChangeMenu([...primaryMenuPath, ...nextPath], primaryMenuPath);
      },
      [primaryMenuPath],
    );

    const contextValue = useMemo(() => ({ openSubmenu }), [openSubmenu]);

    // we want our root element to have height, but only during animation
    // (if it had height all the time, scenario where child uses overflow: auto wouldn't
    // enlarge the div during transition because such child has min-content size computed as 0
    // i.e. the parent's min-content size is then same as current primaryMenuPath's element's,
    // so it would remain as-is and child would get shrinked, effectively remaining at current height
    // all the time, or at least until smaller submenu is rendered, at which point it would shrink even more)
    let [animating, setAnimating] = useState(false);
    let prevSecondaryMenuPath = usePreviousValue(secondaryMenuPath, secondaryMenuPath);
    if (animating && secondaryMenuPath !== prevSecondaryMenuPath) {
      animating = false;
      setAnimating(animating);
    }
    let rootElRef = useRef();
    let metricsBeforeNewAnimationRef = useRef();
    if (secondaryMenuPath && secondaryMenuPath !== prevSecondaryMenuPath) {
      // TODO This should be in getSnapshotBeforeUpdate in React.Component.
      metricsBeforeNewAnimationRef.current = { height: rootElRef.current?.getBoundingClientRect().height };
    }
    const [targetHeight, setTargetHeight] = useState();
    useLayoutEffect(() => {
      // start animation and unrender menu after animation
      if (secondaryMenuPath) {
        setAnimating(true);
        setTargetHeight(metricsBeforeNewAnimationRef.current.height);
        let targetHeight = rootElRef.current.getBoundingClientRect().height;
        let timeout;
        let rafId = requestAnimationFrame(() => {
          setTargetHeight(targetHeight);
          timeout = setTimeout(() => {
            Utils.Dom._batchedUpdates(() => {
              setSecondaryMenuPath();
              setAnimating(false);
              setTargetHeight();
            });
          }, ANIMATION_LENGTH);
        });
        return () => {
          cancelAnimationFrame(rafId);
          clearTimeout(timeout); // Prevent overlapping multiple level changes
        };
      }
    }, [secondaryMenuPath]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let primaryMenuAnimation, secondaryMenuAnimation;
    // Determine which animation to use
    if (secondaryMenuPath) {
      primaryMenuAnimation = primaryMenuPath.length ? ANIMATION_RIGHT_TO_CENTER : undefined;
      secondaryMenuAnimation = ANIMATION_CENTER_TO_LEFT;
      if (primaryMenuPath.length < secondaryMenuPath.length) {
        primaryMenuAnimation = ANIMATION_LEFT_TO_CENTER;
        secondaryMenuAnimation = ANIMATION_CENTER_TO_RIGHT;
      }
    }

    return (
      <MenuListContext.Provider value={contextValue}>
        <div
          ref={rootElRef}
          className={Utils.Css.joinClassName(
            className,
            CSS.main(animating, animating ? targetHeight : undefined, maxHeight),
          )}
        >
          {secondaryMenuPath ? (
            <MenuListBody
              key={secondaryMenuPath}
              itemList={secondaryMenuListToRender}
              className={CSS.secondaryMenuData(animating ? secondaryMenuAnimation : undefined)}
              maxHeight={maxHeight}
              collapsibleIconVisibility={collapsibleIconVisibility}
            />
          ) : null}
          <MenuListBody
            {...propsToPass}
            key={primaryMenuPath}
            elementRef={elementRef}
            itemList={primaryMenuListToRender}
            className={CSS.primaryMenuData(animating ? primaryMenuAnimation : undefined)}
            maxHeight={maxHeight}
            role={role}
            onClose={onBackClick} // closed by LeftArrow/Escape
          />
        </div>
      </MenuListContext.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function getLevelList(itemListMap, path, onBackClick) {
  if (!path) return {};

  let resultItemListMap = itemListMap;
  let parentItem;

  // Get itemList that starts with current path
  for (let i = 0; i < path.length; i++) {
    const resultItem = resultItemListMap.get(path[i]);

    if (!resultItem?.itemList?.size) {
      // If path is not correct (is collapsible or non-existent menu item),
      // look for the last correct parent
      let parentIndex = i;
      do {
        --parentIndex;
        const resultItem = resultItemListMap.get(path[parentIndex]);
        if (resultItem && !resultItem.collapsible) {
          parentItem = resultItem;
          resultItemListMap = parentItem.itemList;
          break;
        }
      } while (parentIndex > i);
      break;
    }

    parentItem = resultItem;
    resultItemListMap = parentItem.itemList;
  }

  // Transform map type itemList back to array
  let resultItemList = transformItemListMapToArray(resultItemListMap);

  if (parentItem && resultItemList && typeof onBackClick === "function") {
    // Add button to return to the previous level
    resultItemList = [
      {
        children: parentItem.children,
        icon: "uugds-left",
        onIconClick: onBackClick,
        size: parentItem.size,
        borderRadius: parentItem.borderRadius,
        heading: "cascade",
      },
      ...resultItemList,
    ];
  }

  const itemIndexToFocus = Tools.getItemIndexToFocus(resultItemList);

  return { resultItemList, itemIndexToFocus };
}

function getUncollapsibleParent(itemListMap, path) {
  let resultItemListMap = itemListMap;
  //let resultItemList = itemList;
  let parentItem;

  // Get current parent item
  for (let i = 0; i < path.length; i++) {
    parentItem = resultItemListMap?.get(path[i]);
    resultItemListMap = parentItem.itemList;
  }

  // Recursive - find a parent (with undefined collapsible prop) until the path array is empty
  if (parentItem?.collapsible) {
    let newPath = [...path];
    newPath.splice(path.length - 1, 1);
    return getUncollapsibleParent(itemListMap, newPath);
  }

  return path;
}

function getPathToItem(item, itemList) {
  let pathToItem;

  // Recursive - Look for item in subItem's itemLists.
  itemList.forEach((subItem) => {
    if (subItem.collapsible) {
      const newItem = getPathToItem(item, subItem.itemList);
      // Make a path only if item was found in some of the branch
      if (newItem) {
        if (Array.isArray(newItem)) {
          pathToItem = [subItem.key, ...newItem];
        } else {
          pathToItem = [subItem.key, newItem];
        }
      }
    }
  });

  if (!Array.isArray(pathToItem)) pathToItem = itemList.find((it) => it.key === item.key);

  if (!pathToItem) pathToItem = itemList.find((it) => it.key === item._itemKey)?.key;

  return pathToItem;
}

function applyOpenParams(currentItemList, openParams = {}) {
  let { resultItemList: itemList, itemIndexToFocus } = currentItemList;
  let result;
  if (itemIndexToFocus === -1 || itemIndexToFocus == null) itemIndexToFocus = 0;
  if (Array.isArray(itemList) && itemList.length) {
    result = itemList.map((it, i) =>
      i === itemIndexToFocus
        ? { ...it, autoFocus: openParams.autoFocus }
        : it.autoFocus
          ? { ...it, autoFocus: false }
          : it,
    );
  }
  return result ?? itemList;
}

function getItemList(itemList, key = 0) {
  return itemList.map((item) => {
    const dupItem = { ...item };
    if (!dupItem.key) dupItem.key = `item-${key}`;
    key++;
    if (dupItem.itemList) dupItem.itemList = getItemList(dupItem.itemList, key);
    return dupItem;
  });
}

function getItemMap(itemList) {
  return itemList.reduce((map, item) => {
    const newItem = { ...item };
    if (newItem.itemList) newItem.itemList = getItemMap(newItem.itemList);
    map.set(newItem.key, newItem);
    return map;
  }, new Map());
}

function transformItemListMapToArray(itemMap) {
  const arr = [];

  itemMap.forEach((item) => {
    const newItem = { ...item };
    if (newItem.itemList) newItem.itemList = transformItemListMapToArray(newItem.itemList);
    arr.push(newItem);
  });

  return arr;
}
//@@viewOff:helpers

export { MenuListCompact };
export default MenuListCompact;
