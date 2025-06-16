//@@viewOn:imports
import {
  createVisualComponent,
  PropTypes,
  Utils,
  useState,
  useRef,
  useElementSize,
  useCallback,
  useMemo,
} from "uu5g05";
import Config from "../../config/config.js";
import Tools from "../tools.js";
//@@viewOff:imports

const withItemAutoHeight = (Component) => {
  let result = createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withItemAutoHeight(${Component.displayName})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
      rowHeightEstimated: PropTypes.number,
      getItemHeight: PropTypes.func,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
      rowHeightEstimated: 100,
      getItemHeight: (rowContainer, itemId) => {
        if (typeof itemId === "string") itemId = itemId.replaceAll('"', "");
        return rowContainer.querySelector(`[data-item-id="${itemId}"]`)?.getBoundingClientRect().height;
      },
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { rowHeightEstimated, getItemHeight, propsRowContainerRef, ...propsToPass } = props;
      const { data, itemIdentifier, columnCount } = propsToPass;

      let getItemKey = useMemo(() => Tools.constructItemKey(itemIdentifier), [itemIdentifier]);

      // support for automatic row height
      let rowContainerRef = useRef();
      let [itemHeightMap, setItemHeightMap] = useState({});
      let onItemsRendered = (event) => {
        let { overscanStartRow, overscanEndRow } = event.data;
        // TODO This is not entirely correct. We should measure each row's height change, not just cumulative
        // (or measure it during render-phase, i.e. just before re-rendering).
        let rowContainer = rowContainerRef.current;
        let newItemHeightMap;
        let round = (a) => a; // Math.ceil; // TODO If rounding, we have to send height in styles which then break automatic height.
        for (let rowI = overscanStartRow; rowI < overscanEndRow; rowI++) {
          for (let colI = 0; colI < columnCount; colI++) {
            let itemI = rowI * columnCount + colI;
            if (itemI > data.length - 1) break;
            let itemId = getItemKey(data[itemI]) ?? itemI;
            let itemHeight = round(getItemHeight(rowContainer, itemId));
            if (itemHeight != null && itemHeightMap[itemId] !== itemHeight) {
              newItemHeightMap ||= { ...itemHeightMap };
              newItemHeightMap[itemId] = itemHeight;
            }
          }
        }
        if (newItemHeightMap) setItemHeightMap(newItemHeightMap);
        event.data.itemHeightMap = newItemHeightMap || itemHeightMap;
        if (typeof props.onItemsRendered === "function") return props.onItemsRendered(event);
      };
      let { ref: sizeRef } = useElementSize();
      // TODO Add effect which will cleanup itemHeightMap non-existing items (if data was changed entirely).

      const getComputedItemHeight = useCallback(
        (index) => itemHeightMap[getItemKey(data[index]) ?? index] ?? rowHeightEstimated,
        [itemHeightMap, getItemKey, data, rowHeightEstimated],
      );
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <Component
          {...propsToPass}
          getItemHeight={getComputedItemHeight}
          rowContainerRef={Utils.Component.combineRefs(rowContainerRef, sizeRef, propsRowContainerRef)}
          onItemsRendered={onItemsRendered}
        />
      );
      //@@viewOff:render
    },
  });

  Utils.Component.mergeStatics(result, Component);

  return result;
};

export { withItemAutoHeight };
export default withItemAutoHeight;
