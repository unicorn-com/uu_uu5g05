//@@viewOn:imports
import { Utils, useState, useRef, useLayoutEffect, useEffect, useUpdateEffect } from "uu5g05";
//@@viewOff:imports

//@@viewOn:constants
const EMPTY_LIST = [];

const STATES = {
  ENTERING_START: "enteringStart", // transitioning - entering viewport; this is 1st render for such transition
  ENTERING: "entering", // transitioning - entering viewport; this is 2nd or subsequent render for such transition
  READY: "ready", // item has finished entering, i.e. is fully shown to user
  EXITING_START: "exitingStart", // transitioning - exiting viewport; this is 1st render for such transition
  EXITING: "exiting", // transitioning - exiting viewport; this is 2nd or subsequent render for such transition
};
//@@viewOff:constants

//@@viewOn:helpers
function mergeWithCurrentItemList(idList, existingItemList = EMPTY_LIST) {
  let newMap = {};
  let existingItemMap = existingItemList.reduce((map, it) => ((map[it.id] = it), map), {});
  let changed = Object.keys(existingItemMap).length !== idList.length;
  // NOTE When user closes the alert, idList will stop containing that alert and this is when we actually
  // start doing exiting transition. I.e. order is: removed from idList -> start doing exit transition.
  for (let id of idList) {
    if (id in existingItemMap) {
      if (existingItemMap[id].state === STATES.EXITING_START) {
        // alert was going to start exiting but it re-appeared in idList => keep as ready
        newMap[id] = { ...existingItemMap[id], state: STATES.READY };
        changed = true;
      } else if (existingItemMap[id].state === STATES.EXITING) {
        // alert is in exiting state but it re-appeared in idList => reset to entering state and reset timeout
        newMap[id] = { ...existingItemMap[id], state: STATES.ENTERING };
        clearTimeout(newMap[id].transitionTimeout);
        delete newMap[id].transitionTimeout;
        changed = true;
      } else {
        // alert is entering or ready => keep as-is
        newMap[id] = existingItemMap[id];
      }
    } else {
      // it's a new alert
      newMap[id] = { id, state: STATES.ENTERING_START };
      changed = true;
    }
  }

  // if an item is no longer present in the new itemList but it is present in existingAlertMap then
  // switch it to exiting animation
  for (let item of existingItemList) {
    let { id, state } = item;
    if (!newMap[id] && state !== STATES.ENTERING_START) {
      changed = true;
      newMap[id] = {
        ...item,
        state: state === STATES.READY || state === STATES.EXITING_START ? STATES.EXITING_START : STATES.EXITING,
      };
      if (state !== STATES.EXITING && newMap[id].state === STATES.EXITING) {
        clearTimeout(newMap[id].transitionTimeout);
        delete newMap[id].transitionTimeout;
      }
    }
  }

  let newList;
  if (changed) {
    // NOTE We're starting from existingItemList to preserve order of displayed alerts (especially if
    // some of them are exiting, i.e. not present in new idList any more).
    // preserve items that are still being animated but got removed from new list (until animation ends)
    newList = existingItemList.map((it) => newMap[it.id]);
    let j = 0;
    for (let i = 0; i < idList.length; i++) {
      let id = idList[i];
      if (!(id in existingItemMap)) {
        newList.splice(j, 0, newMap[id]);
        j++;
      } else {
        j = newList.indexOf(newMap[id]) + 1;
      }
    }
  }

  return changed ? newList : existingItemList;
}

// wraps setState so that setting new state will add "_counter" field which is always increasing, so that we can recognize
// which value is newer as a workaround for React bug (can be simulated by commenting out useValueCounterForSetState and in
// alert-bugs/e00.html using <DeviceProvider isMobileOrTablet>, changing transition duration to 1500ms, then adding ~7 alerts,
// waiting until everything ends transiting, then rather quickly (not insanely quickly) adding a bunch of alerts => re-rendering loop;
// the combination of `setItemList() called directly from render() method` + `setItemList with updaterFn in useLayoutEffect()` causes
// React to loop *sometimes*, and at such time the updaterFn in useLayoutEffect receives older value than what was committed in last render()...)
function useValueCounterForSetState(setState0) {
  // NOTE This assumes that we're always setting non-null/non-undefined objects when calling setState().
  let counterRef = useRef(1);
  let setState = useRef((newValue) => {
    let instance = counterRef.current++;
    if (typeof newValue === "function") {
      return setState0((curValue) => {
        let usedValue = newValue(curValue);
        if (!usedValue._counter) {
          Object.defineProperty(usedValue, "_counter", { enumerable: false, value: instance });
        }
        return usedValue;
      });
    } else {
      if (!newValue._counter) {
        Object.defineProperty(newValue, "_counter", { enumerable: false, value: instance });
      }
      return setState0(newValue);
    }
  }).current;
  return setState;
}
//@@viewOff:helpers

// Keeps transition state for each item. Expects itemIdList (a list of IDs / items with "id" fields) - whenever
// new item emerges in the itemIdList, the item is added to the transition list and it goes to ENTERING_START state.
// Whenever an item gets deleted from itemIdList, the item in transition list enters EXITING_START/EXITING state.
// Items deleted from itemIdList can be unmounted (in which case they'll be temporarily "resurrected" for exiting transition).
//
// Expected usage:
//   const { itemList, endTransition, containerForUnmountedElementsRef } = useEnterExitTransitionList({ itemIdList, getElement, forcedTransitionEndTimeout });
//   ...
//   return (
//     <div onTransitionEnd={(e) => endTransition(getItemIdFromElement(e.target))}>
//       <div style={{ display: "contents" }} ref={containerForUnmountedElementsRef} />
//     </div>
//   );
//
// itemList contains:
//   - id - CSS grid-area compatible ID (i.e. starting with character, ...).
//   - state - transitioning state, see STATES.
//   - canMoveToNextState - flag that item can go from ENTERING -> READY state, or from EXITING -> removed (see comment where it's getting set to `true`)
//   - element - item element obtained via getElement(id)
//   - height - item element's height (measured during ENTERING_START / EXITING_START)
//   - transitionTimeout (managed by direct mutations) - for forced cleanup (i.e. going to READY state / removed from list)
function useEnterExitTransitionList({
  itemIdList,
  getElement,
  onResurrectUnmountedElement,
  forcedTransitionEndTimeout,
}) {
  let currentValuesRef = useRef({});
  useLayoutEffect(() => {
    currentValuesRef.current = { getElement, onResurrectUnmountedElement };
  });

  let idList = itemIdList.map((it) => (it.id || it) + "");
  let [itemList, setItemList] = useState(() => mergeWithCurrentItemList(idList)); // itemList with extra state data
  setItemList = useValueCounterForSetState(setItemList);

  // NOTE We cannot update our itemList in useEffect() because that would mean that the <Alert> got already rendered
  // and is visible in our portal element (so user would see Alert at final position and only then ENTERING transition would start).
  // NOTE Originally, we used memoization for idList and did mergeWithCurrentItemList only if idList changed. However, React has
  // a bug (see useValueCounterForSetState) which in rare cases returned older itemList from useState() which then didn't get
  // processed as idList was same as in previous render so now we compute new itemList every time as a workaround.
  let newItemList = mergeWithCurrentItemList(idList, itemList);
  if (!Utils.Object.deepEqual(newItemList, itemList)) {
    itemList = newItemList;
    setItemList(itemList);
  }

  let hasStartingTransitions = itemList.some(
    (it) => it.state === STATES.EXITING_START || it.state === STATES.ENTERING_START,
  );
  let hasOngoingTransitions = itemList.some(
    (it) => (it.state === STATES.EXITING || it.state === STATES.ENTERING) && !it.canMoveToNextState,
  );

  let hasAnyTransition = hasStartingTransitions || hasOngoingTransitions;
  useLayoutEffect(() => {
    if (!hasAnyTransition) {
      // touch offsetWidth to force browser re-calculate layout (otherwise `transition: undefined` might be skipped, i.e.
      // if next render uses `transition: something` then the value in previous render could start animating instead of already
      // being final due to browser optimizations)
      for (let { element } of itemList) element?.offsetWidth;
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [hasAnyTransition]);

  // switch items from starting to ongoing state
  useLayoutEffect(() => {
    if (hasStartingTransitions) {
      const { getElement } = currentValuesRef.current;
      setItemList((curList) => {
        if (curList._counter && curList._counter < itemList._counter) curList = itemList; // workaround for React bug, see useValueCounterForSetState

        let newItemList = [];
        let changed;
        for (let item of curList) {
          let { id, state } = item;
          let newItem;
          if (state === STATES.ENTERING_START) {
            newItem = { ...item, state: STATES.ENTERING };
          } else if (state === STATES.EXITING_START) {
            newItem = { ...item, state: STATES.EXITING };
          }
          if (newItem) {
            changed = true;
            let element = getElement(id);
            if (element) {
              element.offsetWidth; // touch this to force browser re-calculate layout (otherwise transition might not start properly due to browser optimizations)
              newItem.element = element;
              newItem.height = element.offsetHeight || newItem.height; // fall back to previous height in case that we're exiting and Alert got actually unmounted (i.e. we would receive 0; now we'll use previous known height instead)
            }
          }
          newItemList.push(newItem || item);
        }
        return changed ? newItemList : curList;
      });
    }
  }, [itemList, hasStartingTransitions, setItemList]);

  // for safety, plan also timeout for forcing the item (state) out of transition
  let lastItemListRef = useRef();
  useLayoutEffect(() => {
    lastItemListRef.current = itemList;
    for (let item of itemList) {
      let { id, state, canMoveToNextState } = item;
      if (!canMoveToNextState && (state === STATES.EXITING || state === STATES.ENTERING)) {
        // NOTE We have to reset the timeout on all items whenever itemList changes because adding/removing an item
        // can restart the transition on other items (due to changing their x/y/z translations).
        clearTimeout(item.transitionTimeout);
        item.transitionTimeout = setTimeout(() => endTransition(id), forcedTransitionEndTimeout);
      }
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [itemList]);

  // cleanup timeouts in unmount
  useEffect(
    () => () => {
      let itemList = lastItemListRef.current;
      for (let alert of itemList) clearTimeout(alert.transitionTimeout);
    },
    [],
  );

  function endTransition(id) {
    let item = itemList.find((it) => it.id === id);
    if (item) {
      clearTimeout(item.transitionTimeout);
      delete item.transitionTimeout;
    }

    setItemList((curList) => {
      if (curList._counter && curList._counter < itemList._counter) curList = itemList; // workaround for React bug, see useValueCounterForSetState

      let newList = curList;
      let index = curList.findIndex((it) => it.id === id);
      if (index !== -1) {
        let item = curList[index];
        // NOTE When ending transition, we must wait for all other transitions in grid to end because:
        //    Exiting for alert#id1, i.e. alert#id2 goes temporarily translateY 0px => -56px, and at the end
        //    it wants to update grid back to auto height and set translateY=0 but this last step must not be transitioned
        //    (it must jump to 0 in single step). Removing `transition` style immediately at the end is not possible because
        //    we could click close button during the Y transition of alert#id2, i.e. start exiting it, i.e. after Y transition
        //    we still need to finish X transition (0% -> 100%) but not Y.
        // => while there's anything EXITING || ENTERING, the CSS grid will have row heights frozen to auto || 0, and only after *all* transitions
        //    end, the grid will change row heights to all `auto`
        if (item.state === STATES.EXITING) {
          newList = [...curList];
          newList[index] = { ...item, canMoveToNextState: true }; // mark as finished but potentially waiting for other transitions
        } else if (item.state === STATES.ENTERING) {
          newList = [...curList];
          newList[index] = { ...item, canMoveToNextState: true }; // mark as finished but potentially waiting for other transitions
        }
      }
      return newList;
    });
  }

  // if there are no ongoing transitions, remove alerts that exited / ready alerts that entered
  useUpdateEffect(() => {
    if (!hasOngoingTransitions) {
      setItemList((curList) => {
        if (curList._counter && curList._counter < itemList._counter) curList = itemList; // workaround for React bug, see useValueCounterForSetState

        let resultList = [];
        let changed;
        for (let item of curList) {
          let { state, canMoveToNextState, ...restItem } = item;
          if (state === STATES.EXITING) {
            changed = true;
            continue; // leave out from final list
          } else if (state === STATES.ENTERING) {
            changed = true;
            resultList.push({ ...restItem, state: STATES.READY });
          } else {
            resultList.push(item);
          }
        }
        return changed ? resultList : curList;
      });
    }
  }, [hasOngoingTransitions]);

  // NOTE Alert component can get unmounted at anytime (developer controls that), and we will get info about that
  // only after that happens. But we want to animate the unmount, i.e. we keep reference to the Alert's element
  // (we obtain it during "entering" transition start) and here we detect if the element is unmounted and in such case
  // temporarily clone the element's content and show it onscreen.
  const containerForUnmountedElementsRef = useRef();
  useLayoutEffect(() => {
    let containerForUnmountedElements = containerForUnmountedElementsRef.current;
    let exitingUnmountedItemList = itemList.filter(
      (it) =>
        (it.state === STATES.EXITING_START || (it.state === STATES.EXITING && !it.canMoveToNextState)) &&
        it.element &&
        it.element.offsetHeight === 0 && // looks unmounted (or at least empty)
        !document.body.contains(it.element) && // is unmounted
        !containerForUnmountedElements.querySelector(`[data-uu5-eetl-id="${it.id}"]`), // is not resurrected in our containerForUnmountedElements either
    );
    if (exitingUnmountedItemList.length > 0) {
      let { onResurrectUnmountedElement } = currentValuesRef.current;
      for (let item of exitingUnmountedItemList) {
        let temporaryClone = item.element.cloneNode(true);
        temporaryClone.setAttribute("data-uu5-eetl-id", item.id);
        temporaryClone.style.pointerEvents = "none";
        containerForUnmountedElements.appendChild(temporaryClone);
        onResurrectUnmountedElement?.(temporaryClone, item);
        temporaryClone.offsetWidth; // touch this to force browser re-calculate layout (so that transition doesn't get skipped due to browser optimizations)
      }
    } else if (!hasOngoingTransitions) {
      containerForUnmountedElements.innerHTML = "";
    }
  }, [itemList, hasOngoingTransitions]);

  return { itemList, endTransition, containerForUnmountedElementsRef, hasStartingTransitions, hasOngoingTransitions };
}

export { useEnterExitTransitionList, STATES };
export default useEnterExitTransitionList;
