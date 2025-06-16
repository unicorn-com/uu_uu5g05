//@@viewOn:imports
import {
  Utils,
  createVisualComponent,
  useElementSize,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  usePreviousValue,
  useLanguage,
  useScreenSize,
  useEvent,
} from "uu5g05";
import Config from "./config/config.js";
import Tools from "./_internal/tools.js";
import BreadcrumbsItemList, { ITEM_TYPES, ITEM_MARGIN } from "./_internal/breadcrumbs-item-list.js";
//@@viewOff:imports

//@@viewOn:constants
const EMPTY_LIST = [];
const MIN_ITEM_WIDTH = 50;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: (minWidth) =>
    Config.Css.css({
      minHeight: 1,
      display: "flex",
      whiteSpace: "nowrap",
      flexGrow: 1,
      minWidth: minWidth || 0,
    }),
  container: (measurePhase, maxWidth, minWidth) =>
    Config.Css.css({
      display: "flex",
      alignItems: "center",
      maxWidth: `min(100%,${maxWidth}px)`,
      minWidth,
      overflow: measurePhase ? "hidden" : undefined,
      "& > *": {
        flex: "none",
        "&:last-child": {
          flex: "0 1 auto",
          flexShrink: 1,
        },
      },
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function computeWidthAndUpdateItemStates(itemStates, itemList, separatorWidth) {
  const newItemStates = [];
  let itemsWidth = 0;
  let nonHiddenItemStates = 0;

  itemStates.forEach((itemState, index) => {
    const newItemState = { ...itemState };
    if (!newItemState.type) {
      const item = itemList[index];
      newItemState.type = item?.collapsed ? ITEM_TYPES.collapsed : ITEM_TYPES.full;
    }

    newItemStates.push(newItemState);

    if (newItemState.type !== ITEM_TYPES.hidden) {
      if (newItemState.maxWidth) {
        itemsWidth += newItemState.maxWidth;
      } else {
        itemsWidth += newItemState[newItemState.type];
      }
      nonHiddenItemStates++;
    }
  });

  const separators = nonHiddenItemStates > 0 ? nonHiddenItemStates - 1 : 0;
  const separatorsWidth = separatorWidth * separators;
  const totalWidth = itemsWidth + separatorsWidth;

  return [newItemStates, totalWidth];
}

function updateItemState(itemStates, index) {
  const itemState = itemStates[index];

  if (!itemState) return;

  if (itemState.type !== ITEM_TYPES.full) {
    itemState.type = ITEM_TYPES.hidden;
    index--;
    updateItemState(itemStates, index);
  }
}
//@@viewOff:helpers

const Breadcrumbs = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Breadcrumbs",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: BreadcrumbsItemList.propTypes.itemList,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: BreadcrumbsItemList.defaultProps.itemList,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, ...otherProps } = props;

    const domNodeRef = useRef();
    const { ref: elementRef, width } = useElementSize();

    let [measurePhase, setMeasurePhase] = useState(true);
    const [itemWidths, setItemWidths] = useState([]);
    const [separatorWidth, setSeparatorWidth] = useState(0);

    const [language] = useLanguage();
    const [screenSize] = useScreenSize();
    const isXs = screenSize === "xs";
    const prevItemList = usePreviousValue(itemList, itemList);
    const prevLanguage = usePreviousValue(language, language);
    const prevIsXs = usePreviousValue(isXs, isXs);

    // switch to measurePhase if at least one of the following statement is changed
    // - language - items typically use Lsi component
    // - isXs - on small xs screen text fontSize is typically larger
    if (!measurePhase) {
      if (
        language !== prevLanguage ||
        isXs !== prevIsXs ||
        !Tools.deepEqualItemListExceptEventHandlerOrKnownProps(itemList, prevItemList)
      ) {
        measurePhase = true;
        setMeasurePhase(true);
      }
    }

    // Get itemStates and compute totalWidth
    const [itemStates, totalWidth] = useMemo(() => {
      if (measurePhase) return EMPTY_LIST;

      let [itemStatesWhenFull, totalWidth] = computeWidthAndUpdateItemStates(itemWidths, itemList, separatorWidth);

      let collapsedItemIndices = new Set();
      const lastIndex = itemStatesWhenFull.length - 1;

      itemStatesWhenFull = itemStatesWhenFull.map((item, index) => {
        if (lastIndex === index) {
          if (item.type === ITEM_TYPES.collapsed) {
            if (collapsedItemIndices.has(index - 1)) {
              itemStatesWhenFull[index - 1].type = ITEM_TYPES.hidden;
            }
          }
          return item;
        }
        if (item.type === ITEM_TYPES.collapsed) {
          if (collapsedItemIndices.has(index - 1)) {
            item.type = ITEM_TYPES.hidden;
          }
          collapsedItemIndices.add(index);
        }

        return item;
      });

      return [itemStatesWhenFull, totalWidth];
    }, [itemList, itemWidths, separatorWidth, measurePhase]);

    // Recalculate itemStates (if there is not enough space)
    const recalculatedItemStates = useMemo(() => {
      if (measurePhase) return EMPTY_LIST;

      // There is enough space to render items in full size
      if (totalWidth <= width) return itemStates;

      // Duplicate itemStates, to prevent itemStatesWhenFull mutation
      let resultItemStates = itemStates.map((item) => ({ ...item }));

      // Change item type to collapsed until is there enough space
      const lastItem = itemList.length - 1;

      let tempTotalWidth = totalWidth;
      let tempWidth = width;

      if (itemList.length === 1) return resultItemStates;

      for (let i = 0; i < itemList.length; i++) {
        const item = itemList[i];

        // Get itemState
        const resultItemState = resultItemStates[i];

        if (resultItemState.type === ITEM_TYPES.hidden && lastItem !== i) continue;

        // Get remaining space
        if (!item.collapsed) {
          const minItemWidth = Math.min(resultItemState.full, MIN_ITEM_WIDTH);
          // Count maxWidth for item
          const diff = tempTotalWidth - tempWidth;
          let itemMaxWidth = resultItemState.full - diff;

          if (itemMaxWidth < minItemWidth) itemMaxWidth = minItemWidth;

          // Recalculate totalWidth with item maxWidth and check if it is enough
          const resultItemStateFull = resultItemState.full;
          resultItemState.full = itemMaxWidth;

          let [, collapsedTotalWidth] = computeWidthAndUpdateItemStates(resultItemStates, itemList, separatorWidth);

          if (collapsedTotalWidth > width && itemMaxWidth > minItemWidth) {
            // If collapsedTotalWidth is still larger than width and itemMaxWidth is larger than minItemWidth,
            // then we can try to recalculate totalWidth again and use minItemWidth instead
            resultItemState.full = minItemWidth;
            const [, minCollapsedTotalWidth] = computeWidthAndUpdateItemStates(
              resultItemStates,
              itemList,
              separatorWidth,
            );

            itemMaxWidth = minItemWidth;
            collapsedTotalWidth = minCollapsedTotalWidth;
          }

          resultItemState.full = resultItemStateFull;
          resultItemState.maxWidth = itemMaxWidth;

          if (collapsedTotalWidth <= width) break;
        }

        if (lastItem === i) {
          // Update previous itemStates
          updateItemState(resultItemStates, i - 1);
          break;
        }

        // Item cannot be collapsed, continue with next one
        if (item.collapsed === false) {
          tempWidth -= resultItemState.maxWidth + separatorWidth;
          tempTotalWidth -= resultItemState.full + separatorWidth;
          continue;
        }

        delete resultItemState.maxWidth;

        // Set type to collapsed
        resultItemState.type = ITEM_TYPES.collapsed;

        if (itemList[i + 1]?.collapsed) continue;

        // Update previous itemStates
        updateItemState(resultItemStates, i - 1);

        // Compute new totalWidth with collapsed type
        const [, collapsedTotalWidth] = computeWidthAndUpdateItemStates(resultItemStates, itemList, separatorWidth);

        // Check available space
        if (collapsedTotalWidth <= width) break;

        tempWidth -= resultItemState.collapsed + separatorWidth;
        tempTotalWidth -= resultItemState.full + separatorWidth;
      }

      return resultItemStates;
    }, [itemList, itemStates, width, totalWidth, separatorWidth, measurePhase]);

    const { minWidth, maxWidth } = useMemo(() => {
      if (measurePhase) return {};

      let minWidth = 0;
      let maxWidth = 0;

      if (!itemStates?.length) return { minWidth, maxWidth };
      if (itemStates.length === 1) {
        return {
          minWidth: Math.min(itemStates[0].full, MIN_ITEM_WIDTH) + separatorWidth,
          maxWidth: itemStates[0].full + separatorWidth,
        };
      }

      const lastItemIndex = itemStates.length - 1;

      itemStates.forEach((itemState, index) => {
        const item = itemList[index];
        const prevItem = itemList[index - 1];
        const prevItemState = itemStates[index - 1];
        const minItemWidth = Math.min(itemState.full, MIN_ITEM_WIDTH);

        if (item.collapsed) {
          maxWidth += itemState.collapsed;
        } else {
          maxWidth += itemState.full;
        }

        if (lastItemIndex !== index) maxWidth += separatorWidth;

        if (item.collapsed === false) {
          minWidth += minItemWidth + separatorWidth;
          if (prevItem && !(prevItem.collapsed === false)) {
            minWidth += prevItemState.collapsed + separatorWidth;
          }
          return;
        }

        if (lastItemIndex === index) {
          minWidth += minItemWidth;
          if (prevItem.collapsed === false) return;
          minWidth += separatorWidth + prevItemState.collapsed;
        }
      });

      return { minWidth, maxWidth };
    }, [itemList, itemStates, separatorWidth, measurePhase]);

    if (document.fonts) {
      // if fonts get loaded then check widths of rendered items whether they changed
      useEvent("loadingdone", checkRenderedWidths, document.fonts);
    }

    useLayoutEffect(() => {
      if (measurePhase && width > 0) {
        const [itemWidths, separatorWidth] = getMeasuredWidths();
        setItemWidths(itemWidths);
        setSeparatorWidth(separatorWidth);
        setMeasurePhase(false);
      }
    }, [measurePhase, width]);

    function getMeasuredWidths() {
      let domNode = domNodeRef.current;
      if (!domNode) return;

      let allWidths = [...domNode.childNodes].map((item) => item.getBoundingClientRect().width);

      const itemWidths = [];
      let separatorWidth = 0;

      // Pop out temporary item which is only in measure phase
      const collapsedWidth = allWidths.pop();

      // Filter widths
      allWidths.forEach((width, index) => {
        // Get itemsWidth
        if (index % 2 === 0) {
          itemWidths.push({
            [ITEM_TYPES.full]: width,
            [ITEM_TYPES.collapsed]: collapsedWidth,
          });
          return;
        }
        // Get separatorWidth
        if (!separatorWidth) separatorWidth = width + 2 * ITEM_MARGIN;
      });

      return [itemWidths, separatorWidth];
    }

    function checkRenderedWidths() {
      let domNode = domNodeRef.current;

      if (domNode && domNode.getBoundingClientRect().width !== 0) {
        let widthsMatch = [...domNode.childNodes].every((it) => it.getBoundingClientRect().width === it.dataset.width);
        if (!widthsMatch) setMeasurePhase(true);
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const [{ ref, ...attrs }, otherComponentPropsToPass] = Utils.VisualComponent.splitProps(
      otherProps,
      Css.main(minWidth),
    );

    return (
      <div {...attrs} ref={Utils.Component.combineRefs(ref, elementRef)}>
        <div className={Css.container(measurePhase, maxWidth, minWidth)} ref={domNodeRef}>
          <BreadcrumbsItemList
            measurePhase={measurePhase}
            itemList={itemList}
            itemStates={recalculatedItemStates}
            {...otherComponentPropsToPass}
          />
        </div>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Breadcrumbs };
export default Breadcrumbs;
//@@viewOff:exports
