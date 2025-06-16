//@@viewOn:imports
import { createVisualComponent, PropTypes, Lsi, Utils, useElementSize, useScreenSize } from "uu5g05";
import Config from "../config/config.js";
import UuGds from "../_internal/gds.js";
import PlaceholderBox from "../placeholder-box.js";
import VirtualList from "../_internal/_virtual-list/virtual-list.js";
import IconPaletteItem, { CSS_VAR_ICON_FONT_SIZE_SCALE } from "./icon-palette-item.js";
import useScrollbarWidth from "../_internal/use-scrollbar-width.js";
import ScrollableBox from "../scrollable-box.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

export const IconPalette = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "IconPalette",

  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.shape({
          value: PropTypes.string,
          component: PropTypes.func,
          componentProps: PropTypes.object,
        }),
        PropTypes.string,
      ]),
    ),
    value: PropTypes.string,
    onSelect: PropTypes.func,
    colorScheme: PropTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: [],
    value: undefined,
    onSelect: undefined,
    colorScheme: "primary",
  },
  //@@viewOff:defaultProps

  //@@viewOn:render
  render(props) {
    const { value, onSelect, itemList, colorScheme, ...otherProps } = props;
    const [screenSize] = useScreenSize();

    const itemDimension = UuGds.getSizes("spot", "basic", "s").height;
    const gap = UuGds.getValue(["SpacingPalette", "fixed", "b"]);

    const { verticalWidth: verticalScrollbarWidth, elementRef: scrollbarWidthRef } = useScrollbarWidth();

    const {
      columnCount,
      ref: columnCountRef,
      availableWidth,
    } = useColumnCount(itemDimension, gap, verticalScrollbarWidth, screenSize);

    function getHandleIconChange(icon) {
      return (e) => {
        if (typeof onSelect === "function") {
          onSelect(new Utils.Event({ value: icon }, e));
        }
      };
    }

    const data = itemList.map((icon, i) => {
      if (typeof icon === "object") {
        return {
          id: icon.value,
          component: icon.component,
          componentProps: icon.componentProps,
          isSelected: icon.value === value,
          onClick: getHandleIconChange(icon.value),
          colorScheme,
        };
      } else {
        return {
          id: icon,
          icon,
          isSelected: icon === value,
          onClick: getHandleIconChange(icon),
          colorScheme,
        };
      }
    });

    const itemFontSizeScale = Math.max(
      1,
      ((availableWidth || 0) - gap * (columnCount - 1)) / columnCount / itemDimension || 0,
    );

    const styleObject = typeof otherProps.style === "string" ? Utils.Style.parse(otherProps.style) : otherProps.style;

    return Array.isArray(itemList) && itemList.length ? (
      <ScrollableBox {...otherProps} style={{ ...styleObject, [CSS_VAR_ICON_FONT_SIZE_SCALE]: itemFontSizeScale + "" }}>
        <VirtualList
          elementRef={Utils.Component.combineRefs(scrollbarWidthRef, columnCountRef)}
          columnCount={columnCount}
          horizontalGap={gap}
          verticalGap={gap}
          data={data}
          rowHeightEstimated={32}
          //maxHeight={232}
        >
          {IconPaletteItem}
        </VirtualList>
      </ScrollableBox>
    ) : (
      <PlaceholderBox
        {...Utils.VisualComponent.splitProps(otherProps).elementProps}
        width={80}
        code="items"
        header={<Lsi import={importLsi} path={["IconPalette", "noIcons"]} />}
      />
    );
  },
  //@@viewOff:render
});
//@@viewOn:helpers
function useColumnCount(itemDimension, gap, verticalScrollbarWidth, screenSize) {
  let { ref, width: measuredWidth } = useElementSize();
  measuredWidth = Math.max(measuredWidth ? measuredWidth - verticalScrollbarWidth : 0, 0);

  let columnCount = 1;

  if (typeof measuredWidth === "number") {
    columnCount = Math.max(Math.floor((measuredWidth + gap) / (itemDimension + gap)), 1);
  }
  if (screenSize === "xs") columnCount = 8;
  return { columnCount, ref, availableWidth: measuredWidth };
}
//@@viewOff:helpers
IconPalette.Item = IconPaletteItem;

export default IconPalette;
