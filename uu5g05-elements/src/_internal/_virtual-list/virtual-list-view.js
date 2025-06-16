//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useEffect, useMemo, useRef } from "uu5g05";
import Config from "../../config/config.js";
import Tools from "../tools.js";
//@@viewOff:imports

const Placeholder = createVisualComponent({
  uu5Tag: Config.TAG + "VirtualListView.Placeholder",
  render(props) {
    return <div {...Utils.VisualComponent.getAttrs(props)} />;
  },
});

const Css = {
  main: ({ height, maxHeight }) => {
    return Config.Css.css({
      display: "block",
      height: typeof height === "number" ? height : undefined,
      maxHeight: typeof maxHeight === "number" ? maxHeight : undefined,
      overflowY: typeof height === "number" || typeof maxHeight === "number" ? "auto" : undefined,
      overflowX: typeof height === "number" || typeof maxHeight === "number" ? "auto" : undefined,
    });
  },
  rowContainer: ({ columnCount, horizontalGap, verticalGap, disabled }) =>
    Config.Css.css({
      display: "grid",
      gridTemplateColumns: `repeat(${columnCount}, minmax(0px, 1fr))`,
      rowGap: horizontalGap,
      columnGap: verticalGap,
      position: "relative",
      "&:after": disabled
        ? {
            content: '""',
            cursor: "default",
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            backgroundColor: "rgba(256, 256, 256, 0.56)",
            zIndex: 100,
          }
        : undefined,
    }),
  topFill: ({ columnCount }) => Config.Css.css({ gridArea: `1 / 1 / 1 / span ${columnCount}` }),
  bottomFill: ({ columnCount }) => Config.Css.css({ gridArea: `auto / 1 / auto / span ${columnCount}` }),
};

let VirtualListView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "VirtualListView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.element]).isRequired,
    childrenFallback: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
    data: PropTypes.array,
    height: PropTypes.number,
    maxHeight: PropTypes.number,
    overscanStartRow: PropTypes.number,
    overscanEndRow: PropTypes.number,
    overscanMargin: PropTypes.shape({
      top: PropTypes.number,
      bottom: PropTypes.number,
      left: PropTypes.number,
      right: PropTypes.number,
    }),
    onItemsRendered: PropTypes.func,
    columnCount: PropTypes.number,
    rowContainerClassName: PropTypes.string,
    horizontalGap: PropTypes.sizeOf(PropTypes.unit),
    verticalGap: PropTypes.sizeOf(PropTypes.unit),
    virtualization: PropTypes.bool,
    itemIdentifier: PropTypes.any,
    elementType: PropTypes.oneOfType([PropTypes.func, PropTypes.element, PropTypes.string]),
    rowContainerElementType: PropTypes.oneOfType([PropTypes.func, PropTypes.element, PropTypes.string]),
    overscanMarginElementType: PropTypes.oneOfType([PropTypes.func, PropTypes.element, PropTypes.string]),
    rowContainerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    children: undefined,
    childrenFallback: undefined,
    data: [],
    height: undefined,
    maxHeight: undefined,
    overscanStartRow: 0,
    overscanEndRow: 0, // data.length
    overscanMargin: undefined, // 0 from all sides
    onItemsRendered: undefined,
    columnCount: 1,
    horizontalGap: 0,
    verticalGap: 0,
    rowContainerClassName: undefined,
    virtualization: true,
    itemIdentifier: "id",
    elementType: "div",
    rowContainerElementType: "div",
    overscanMarginElementType: "div",
    rowContainerRef: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      disabled,
      elementRef,
      children,
      childrenFallback,
      data,
      overscanStartRow,
      overscanEndRow,
      overscanMargin = { top: 0, bottom: 0, left: 0, right: 0 },
      getItemHeight,
      onItemsRendered,
      columnCount,
      rowContainerClassName,
      virtualization,
      itemIdentifier,
      elementType,
      rowContainerElementType,
      overscanMarginElementType,
      rowContainerRef,
      ...otherProps
    } = props;

    let getItemKey = useMemo(() => Tools.constructItemKey(itemIdentifier), [itemIdentifier]);

    useEffect(() => {
      if (typeof onItemsRendered === "function") {
        // TODO Maybe we should pass data.slice(overscanStartRow, overscanEndRow) because that's what the event is all about
        // - we want the event to trigger even when indices don't change but data changes (items on those indices).
        onItemsRendered(new Utils.Event({ overscanStartRow, overscanEndRow }));
      }
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const childrenRendererCacheRef = useRef({});

    function renderItem(i, isFirst, isLast) {
      let isFallback = data[i] == null;
      let component = isFallback ? childrenFallback || Placeholder : children;

      let itemId = isFallback ? i + "_fallback" : (getItemKey(data[i]) ?? i);
      if (typeof itemId === "string") itemId = itemId.replaceAll('"', "");

      let rowIndex = Math.floor(i / columnCount);
      let columnIndex = i % columnCount;
      let componentProps = {
        key: itemId,
        index: i,
        rowIndex,
        columnIndex,
        data: data[i],
        style: isFallback ? { minHeight: getItemHeight(i) } : undefined,
        firstRendered: isFirst,
        lastRendered: isLast,
        elementAttrs: { "data-item-id": itemId },
      };

      return Tools.getElement(component, componentProps, {
        cache: childrenRendererCacheRef.current,
        cacheKey: itemId,
      });
    }

    let renderedChildren = [];
    let startIndex = virtualization ? overscanStartRow * columnCount : 0;
    let endIndex = virtualization ? Math.min(data.length, overscanEndRow * columnCount) : data.length;
    for (let i = startIndex; i < endIndex; i++) {
      renderedChildren.push(renderItem(i, i === startIndex, i === endIndex - 1));
    }

    const overscanMarginTopElement = usedGetChildrenToRender(overscanMarginElementType, {
      key: "before",
      className: Css.topFill(props),
      style: { height: overscanMargin.top },
    });

    const overscanMarginBottomElement = usedGetChildrenToRender(overscanMarginElementType, {
      key: "after",
      className: Css.bottomFill(props),
      style: { height: overscanMargin.bottom },
    });

    const rowContainerElement = usedGetChildrenToRender(rowContainerElementType, {
      elementRef: rowContainerRef,
      className: Utils.Css.joinClassName(rowContainerClassName, Css.rowContainer(props)),
      children: (
        <>
          {virtualization && overscanMargin.top > 0 ? overscanMarginTopElement : null}
          {renderedChildren}
          {virtualization && overscanMargin.bottom > 0 ? overscanMarginBottomElement : null}
        </>
      ),
    });

    let className = Utils.Css.joinClassName(props.className, Css.main(props));
    const renderResult = useMemo(
      () =>
        usedGetChildrenToRender(elementType, {
          ...otherProps,
          className,
          elementRef,
          children: rowContainerElement,
        }),
      [elementType, otherProps, className, elementRef, rowContainerElement],
    );

    return renderResult;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function usedGetChildrenToRender(componentType, propsToPass) {
  let isDomElement =
    typeof componentType === "string" ||
    (Utils.Element.isValid(componentType) && typeof componentType.type === "string");

  let key;
  if (isDomElement) {
    key = propsToPass.key;
    propsToPass = {
      ...Utils.VisualComponent.getAttrs(propsToPass),
      children: propsToPass.children,
    };
  }

  if (typeof componentType === "string") {
    const ChildComponent = componentType;
    return <ChildComponent key={key} {...propsToPass} />;
  } else {
    return Tools.getElement(componentType, propsToPass);
  }
}
//@@viewOff:helpers

export { VirtualListView };
export default VirtualListView;
