//@@viewOn:imports
import {
  createVisualComponent,
  PropTypes,
  Utils,
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  useDevice,
} from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import MenuItem from "./menu-item";
import ScrollableBox from "./scrollable-box";
import VirtualList from "./_internal/_virtual-list/virtual-list";
import Tools from "./_internal/tools.js";
//@@viewOff:imports

const DEFAULT_VISIBLE_ITEMS = 10;
const DEFAULT_GAP = UuGds.SpacingPalette.getValue(["fixed"]).a;
const CONTAINER_SIZE_MAP_MOBILE = Tools.CONTAINER_SIZE_MAP_MOBILE;

const VirtualizedListPicker = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "VirtualizedListPicker",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.array.isRequired,
    selectionMode: PropTypes.oneOf(["single", "multi", "range"]),
    ignoreScrollSelection: PropTypes.bool,
    value: PropTypes.any,
    onSelect: PropTypes.func,
    itemSize: MenuItem.propTypes.size,
    valueAutoScroll: PropTypes.bool,
    gap: PropTypes.number,
    autoCentering: PropTypes.bool,
    colorScheme: MenuItem.propTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: [],
    selectionMode: "single",
    ignoreScrollSelection: false,
    itemSize: "xs",
    autoCentering: false,
    valueAutoScroll: false,
    gap: DEFAULT_GAP,
    colorScheme: "primary",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      itemList,
      className,
      gap,
      valueAutoScroll,
      value,
      selectionMode,
      ignoreScrollSelection,
      itemSize,
      onSelect,
      colorScheme,
      _instantSelect, //NOTE: Internal prop to override onSelect functionality for range selectionMode. onSelect is call every time when new date is select.
      ...otherProps
    } = props;
    const [rangeStartValue, setRangeStartValue] = useState();

    const { isMobileOrTablet } = useDevice();
    const { height: rowHeightEstimated } = UuGds.getSizes(
      "spot",
      "basic",
      isMobileOrTablet ? CONTAINER_SIZE_MAP_MOBILE[itemSize] : itemSize,
    );

    let visibleItems = DEFAULT_VISIBLE_ITEMS;
    const maxHeight = props.height ? undefined : rowHeightEstimated * visibleItems + (visibleItems - 1) * gap;
    const calendarId = useRef(Utils.String.generateId(8));

    // memoize value map to fast find indexes of values
    const valueMap = useMemo(() => {
      let result = {};
      if (Array.isArray(itemList)) {
        itemList.forEach(({ value }, index) => value && (result[value] = index));
      }
      return result;
    }, [itemList]);

    const currentValuesRef = useRef();
    useEffect(() => {
      // eslint-disable-next-line no-use-before-define
      currentValuesRef.current = { onSelect, centerScroll };
    });

    // handle call onSelect for range selection - this is called only for range selection
    useEffect(() => {
      const { onSelect } = currentValuesRef.current;
      if (typeof onSelect === "function") {
        if (Array.isArray(rangeStartValue) && rangeStartValue.length === 2) {
          onSelect(new Utils.Event({ value: rangeStartValue }));
          setRangeStartValue();
        } else if (Array.isArray(rangeStartValue) && rangeStartValue.length === 1 && _instantSelect) {
          onSelect(new Utils.Event({ value: [rangeStartValue[0].value] }));
        }
      }
    }, [rangeStartValue, _instantSelect]);

    const [centerValue, setCenterValue] = useState({ value: props.value });
    const previousScrollTop = useRef();
    const timeoutRef = useRef();
    // Used to cancel automatic scroll when finger is still on the element but not moving
    const isTouchEventRef = useRef(false);

    const scrollElementRef = useRef();
    const firstScrollToValue = useRef(true);
    const valueAutoScrollRef = useRef();
    valueAutoScrollRef.current = valueAutoScroll;

    const centerScroll = (e, direction) => {
      if (props.autoCentering) {
        let allMenuItems = Array.from(
          scrollElementRef.current?.querySelectorAll(`[id^=virtualized-value-picker-item-]`),
        );

        // Get only visible menu items in viewport
        let flag = false;
        let visibleItems = [];
        for (const menuItem of allMenuItems) {
          let isVisible = isItemInViewport(menuItem, scrollElementRef.current);
          if (isVisible) {
            visibleItems.push(menuItem);
            flag = true;
          } else {
            if (flag) break;
          }
        }

        // Depending on the direction, go to the closest next value and set it as new value
        // 1 = going up; 0 = same; -1 = going down
        let index = (visibleItems.length - 1) / 2;
        if (index > 0) {
          if (direction === 1) {
            index = index % 2 ? Math.floor(index) : index - 1;
          } else if (direction === -1) {
            index = index % 2 ? Math.ceil(index) : index + 1;
          } else {
            // In some occasions direction is 0 but index is as float
            index = Math.round(index);
          }

          const itemValue = visibleItems[index].getAttribute("item-value");
          if (typeof onSelect === "function" && !ignoreScrollSelection) {
            if (props.selectionMode === "single") {
              //if (value !== itemValue) { // TODO switch on for custom native time input, because now it cannot be selected via keyboard until hour and min is chosen
              onSelect(new Utils.Event({ value: itemValue }, e));
              //}
            } else if (props.selectionMode === "multi") {
              let newValue;
              if (props.value.includes(itemValue)) {
                newValue = props.value.filter((value) => value !== itemValue);
              } else {
                newValue = [...props.value, itemValue];
              }
              onSelect(new Utils.Event({ value: newValue }));
            } else if (props.selectionMode === "range") {
              setRangeStartValue((current) => {
                if (!current) return { value: itemValue, index: valueMap[itemValue] };

                onSelect(
                  new Utils.Event({
                    value:
                      current.index < valueMap[itemValue] ? [current.value, itemValue] : [itemValue, current.value],
                  }),
                );
                return undefined;
              });
            }
          }
          // Set new value
          setCenterValue({ value: itemValue });
        }
      }
    };

    useEffect(() => {
      const scrollableBox = scrollElementRef.current;

      const handleScroll = (e) => {
        // 1 = going up; 0 = same; -1 = going down
        if (!previousScrollTop.current) previousScrollTop.current = e.target.scrollTop;
        let direction =
          e.target.scrollTop > previousScrollTop.current ? -1 : e.target.scrollTop < previousScrollTop.current ? 1 : 0;
        previousScrollTop.current = e.target.scrollTop;

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (!isTouchEventRef.current) {
            const { centerScroll } = currentValuesRef.current;
            centerScroll(e, direction);
          }
          // Time increased to 500ms to give a little more time for MenuItems to render when user scrolls really fast
        }, 500);
      };

      // Logic for disabeling auto scrolling when touch is ongoing
      let move = false;
      let startX = 0;
      let startY = 0;
      const handleTouchStart = (e) => {
        move = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      };
      const handleTouchMove = (e) => {
        if (Math.abs(e.touches[0].clientX - startX) > 0 || Math.abs(e.touches[0].clientY - startY) > 0) {
          move = true;
          isTouchEventRef.current = true;
        }
      };
      const handleTouchEnd = (e) => {
        if (move) {
          isTouchEventRef.current = false;
          handleScroll(e);
        }
      };

      scrollableBox && scrollableBox.addEventListener("scroll", handleScroll);
      isMobileOrTablet && scrollableBox && scrollableBox.addEventListener("touchstart", handleTouchStart);
      isMobileOrTablet && scrollableBox && scrollableBox.addEventListener("touchmove", handleTouchMove);
      isMobileOrTablet && scrollableBox && scrollableBox.addEventListener("touchend", handleTouchEnd);
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        scrollableBox && scrollableBox.removeEventListener("scroll", handleScroll);
        isMobileOrTablet && scrollableBox && scrollableBox.removeEventListener("touchstart", handleTouchStart);
        isMobileOrTablet && scrollableBox && scrollableBox.removeEventListener("touchmove", handleTouchMove);
        isMobileOrTablet && scrollableBox && scrollableBox.removeEventListener("touchend", handleTouchEnd);
      };
    }, [isMobileOrTablet]);

    useLayoutEffect(() => {
      // stop autoscroll to value if value was changed
      if (!valueAutoScrollRef.current && !firstScrollToValue.current) return;

      let value = Array.isArray(props.value) ? props.value[0] : props.value;

      const valueIndex = valueMap[value];
      if (valueIndex) {
        if (firstScrollToValue.current) {
          scrollElementRef.current.style.scrollBehavior = "auto";
        }
        const selectedDateEl = scrollElementRef.current.querySelector(
          `#virtualized-value-picker-item-${calendarId.current}-${valueIndex}`,
        );
        if (selectedDateEl) {
          // Element is in the viewport
          scrollElementRef.current.scroll({
            top: selectedDateEl?.offsetTop - scrollElementRef.current.clientHeight / 2 + rowHeightEstimated / 2,
            behavior: "smooth",
            block: "start",
          });
        } else {
          // Element is not in the viewport
          scrollElementRef.current.scrollTop =
            valueIndex * (rowHeightEstimated + gap) -
            scrollElementRef.current.clientHeight / 2 +
            rowHeightEstimated / 2;
        }
      }
      scrollElementRef.current.style.scrollBehavior = "smooth";
      firstScrollToValue.current = false;
    }, [props.height, gap, props.value, centerValue, rowHeightEstimated, valueMap]);

    const isSelected = (value) => {
      let result;

      if (selectionMode === "single") {
        result = props.value === value;
      } else if (selectionMode === "multi") {
        result = props.value.includes(value);
      } else if (selectionMode === "range") {
        if (Array.isArray(rangeStartValue) && rangeStartValue.length === 1) {
          result = rangeStartValue[0].value === value;
        } else {
          let currentIndex = valueMap[value];
          let minIndex = valueMap[props.value[0]];
          let maxIndex = valueMap[props.value[1]];
          if (minIndex > maxIndex) {
            let tempIndex = maxIndex;
            maxIndex = minIndex;
            minIndex = tempIndex;
          }
          result = currentIndex >= minIndex && currentIndex <= maxIndex;
        }
      }

      return result;
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <ScrollableBox
        scrollbarWidth={0}
        scrollIndicator="disappear"
        maxHeight={maxHeight}
        {...otherProps}
        className={Utils.Css.joinClassName(className, CLASS_NAMES.container())}
        scrollElementRef={Utils.Component.combineRefs(props.scrollElementRef, scrollElementRef)}
      >
        <VirtualList
          data={itemList}
          rowHeightEstimated={rowHeightEstimated}
          horizontalGap={gap}
          columnCount={1}
          className={CLASS_NAMES.list(props)}
        >
          {(item) => {
            let data = item.data;
            let { value, children, className, ...otherItemProps } = data;
            if (value === undefined) {
              return (
                <MenuItem
                  key={item.index}
                  heading
                  {...otherItemProps}
                  size={itemSize}
                  className={Utils.Css.joinClassName(CLASS_NAMES.title(), className)}
                >
                  {children}
                </MenuItem>
              );
            } else {
              const isValueSelected = isSelected(value);
              return (
                <MenuItem
                  colorScheme={colorScheme}
                  borderRadius="moderate"
                  significance={isValueSelected && !props.autoCentering ? "distinct" : undefined}
                  {...otherItemProps}
                  key={item.index}
                  id={`virtualized-value-picker-item-${calendarId.current}-${item.index}`}
                  elementAttrs={{ "item-value": value }}
                  className={Utils.Css.joinClassName(CLASS_NAMES.item(isValueSelected), className)}
                  size={itemSize}
                  onClick={(e) => {
                    if (typeof onSelect === "function") {
                      if (selectionMode === "single") {
                        onSelect(new Utils.Event({ value }, e));
                      } else if (selectionMode === "multi") {
                        let newValue;
                        if (props.value.includes(value)) {
                          newValue = props.value.filter((value) => value !== value);
                        } else {
                          newValue = [...props.value, value];
                        }
                        onSelect(new Utils.Event({ value: newValue }));
                      } else if (selectionMode === "range") {
                        setRangeStartValue((current) => {
                          if (!current) return [{ value, index: item.index }];

                          // call onSelect in useEffect
                          current = current[0];
                          return current.index < item.index ? [current.value, data.value] : [data.value, current.value];
                        });
                      }
                    }
                    setCenterValue({ value });
                  }}
                >
                  {(typeof children === "function" ? children({ isValueSelected }) : children) || value}
                </MenuItem>
              );
            }
          }}
        </VirtualList>
      </ScrollableBox>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const isItemInViewport = (item, viewport) => {
  let itemSize = item.getBoundingClientRect();
  let viewportSize = viewport.getBoundingClientRect();
  return itemSize.top >= viewportSize.top && itemSize.bottom <= viewportSize.bottom;
};

const CLASS_NAMES = {
  container: () =>
    Config.Css.css({
      justifyItems: "center",
      scrollBehavior: "smooth",
      minWidth: UuGds.getValue(["SizingPalette", "spot", "basic", "xl"]).h,
    }),
  title: () =>
    Config.Css.css({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
    }),
  list: ({ paddingLeft, paddingRight }) => {
    const paddingVertical = UuGds.SpacingPalette.getValue(["fixed"]).c;
    return Config.Css.css({
      paddingLeft: paddingLeft ? paddingVertical : undefined,
      paddingRight: paddingRight ? paddingVertical : undefined,
    });
  },
  item: () =>
    Config.Css.css({
      textTransform: "capitalize",
      justifyContent: "center",
      "&&": { wordBreak: "normal" },
    }),
};
//@@viewOff:helpers

export { VirtualizedListPicker };
export default VirtualizedListPicker;
