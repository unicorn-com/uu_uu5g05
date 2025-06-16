//@@viewOn:imports
import { createVisualComponent, Fragment, PropTypes, useEffect, useElementSize, useRef, useState, Utils } from "uu5g05";
import Config from "./config/config.js";
import InfoItem from "./info-item.js";
import UuGds from "./_internal/gds.js";
import Line from "./line.js";
import ScrollableBox from "./scrollable-box.js";
import Tools from "./_internal/tools.js";
//@@viewOff:imports

//@@viewOn:constants
const ROW_GAP = 8;
const LINE_WIDTH = 1;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: (direction, autoResize) => {
    let styles;
    if (direction === "horizontal") {
      styles = {
        position: "relative",
        justifyContent: "flex-start",
        alignItems: "center",
        flexWrap: "wrap",
        rowGap: ROW_GAP,
      };
      if (!autoResize) {
        styles = { ...styles, flexWrap: "nowrap" };
      }
    } else {
      styles = {
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        rowGap: UuGds.SpacingPalette.getValue(["fixed", "d"]),
      };
    }
    return Config.Css.css({ display: "inline-flex", ...styles });
  },
  item: (isItemShifted, size) => {
    const { height } = UuGds.getSizes("spot", "basic", size, "none");
    const marginLineSize = UuGds.SpacingPalette.getValue(["relative", "h"], { height }) * 2 + LINE_WIDTH;
    return Config.Css.css({
      // TODO insert columGap into Css.main() instead of marginLeft
      marginLeft: isItemShifted ? -marginLineSize : 0,
      flex: "none",
    });
  },
  hiddenComponent: () => Config.Css.css({ overflow: "hidden", height: 0 }),
  stretchElement: () => Config.Css.css({ alignSelf: "stretch" }),
  horizontalLine: (lastItemPositionHeight) =>
    Config.Css.css({
      position: "absolute",
      bottom: lastItemPositionHeight + ROW_GAP / 2,
      left: 0,
      right: 0,
      height: LINE_WIDTH,
    }),
  verticalLine: (size, isHidden) => {
    const { height } = UuGds.getSizes("spot", "basic", size, "none");
    return Config.Css.css({
      "&&": {
        height: "75%",
        transform: "translateY(calc(12.5% / 75 * 100))",
        marginRight: UuGds.SpacingPalette.getValue(["relative", "h"], { height }),
        marginLeft: UuGds.SpacingPalette.getValue(["relative", "h"], { height }),
        visibility: isHidden ? "hidden" : undefined,
      },
    });
  },
};
//@@viewOff:css

const InfoGroup = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InfoGroup",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        ...InfoItem.propTypes,
        component: PropTypes.oneOfType([PropTypes.elementType, PropTypes.element]),
      }),
    ),
    size: InfoItem.propTypes.size,
    direction: PropTypes.oneOf(["horizontal", "vertical"]),
    autoResize: PropTypes.bool,
    itemDirection: PropTypes.oneOf(["horizontal", "vertical", "vertical-reverse"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: [],
    size: "m",
    direction: "horizontal",
    autoResize: true,
    itemDirection: "vertical-reverse",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, size, direction, autoResize, itemDirection } = props;
    const { ref: containerRef, height: containerHeight, width: containerWidth } = useElementSize();
    const { ref: lastItemPositionSizeRef, height: lastItemPositionHeight } = useElementSize();
    const [isVerticalDirection, setIsVerticalDirection] = useState(); // state for changing layout of component
    const [lastLineInFirstRowIndex, setLastLineInFirstRowIndex] = useState();
    const [firsLineInSecondRowIndex, setFirstLineInSecondRowIndex] = useState();
    const [firsItemInSecondRowIndex, setFirstItemInSecondRowIndex] = useState();
    const [isTwoRows, setIsTwoRows] = useState(false);
    const firstItemPositionRef = useRef();
    const lastItemPositionRef = useRef();
    const wrapperRef = useRef();

    function getInfoItems(isComponentVisible = true) {
      let infoItems = null;

      if (itemList.length > 0) {
        infoItems = itemList.map((item, i) => {
          const element = getElement(item, i, isComponentVisible);
          const isLastItem = i === itemList.length - 1;
          const isLineHidden = lastLineInFirstRowIndex == i || firsLineInSecondRowIndex == i;

          return (
            <Fragment key={i}>
              {element}
              {!isLastItem && direction === "horizontal" && (
                <div className={Css.stretchElement(lastLineInFirstRowIndex == i)} data-info-group-index={i}>
                  <Line
                    direction="vertical"
                    colorScheme="neutral"
                    significance="subdued"
                    className={Css.verticalLine(size, isLineHidden)}
                  />
                </div>
              )}
            </Fragment>
          );
        });
      }

      return infoItems;
    }

    function getElement(item, itemIndex, isComponentVisible) {
      const { component, elementRef, className, ...otherKeys } = item;
      const itemProps = {
        ...otherKeys,
        elementRef: isComponentVisible ? elementRef : undefined,
        className: Utils.Css.joinClassName(
          className,
          Css.item(!isVerticalDirection && firsItemInSecondRowIndex === itemIndex, size),
        ),
      };
      const element = Tools.getElement(component, itemProps);

      return element === component ? <InfoItem size={size} direction={itemDirection} {...itemProps} /> : element;
    }

    useEffect(() => {
      if (wrapperRef.current && direction === "horizontal" && autoResize) {
        const allRect = [...wrapperRef.current.childNodes].map((it) => it.getBoundingClientRect());
        let lastLineIndex, firstLineIndex, firstItemIndex;
        for (let i = 2; i < allRect.length - 2; i++) {
          // start from 2 (from first vertical line), allRect.length - 2 (last item is auxiliary div)
          const isLastItemInFirstRow = Math.floor(allRect[i].right) > Math.floor(allRect[i + 1].left);
          if (isLastItemInFirstRow) {
            lastLineIndex = wrapperRef.current.childNodes[i].getAttribute("data-info-group-index"); // last line in 1 row

            firstLineIndex = wrapperRef.current.childNodes[i + 1].getAttribute("data-info-group-index"); // first line in 2 row
            firstItemIndex = typeof firstLineIndex === "string" ? Number(firstLineIndex) + 1 : undefined; // first item (only infoItem or custom component) after line in 2 row
            break;
          }
        }
        setLastLineInFirstRowIndex(lastLineIndex);
        setFirstItemInSecondRowIndex(firstItemIndex);
        setFirstLineInSecondRowIndex(firstLineIndex);
      }
    }, [autoResize, containerWidth, direction]);

    useEffect(() => {
      if (lastItemPositionRef.current && firstItemPositionRef.current && direction === "horizontal" && autoResize) {
        const firstRowBottom = firstItemPositionRef.current.getBoundingClientRect().bottom;
        const lastItemTop = lastItemPositionRef.current.getBoundingClientRect().top;

        if (lastItemTop - ROW_GAP - firstRowBottom > 1) {
          setIsVerticalDirection(true);
          setIsTwoRows(true);
        } else if (lastItemTop - ROW_GAP - firstRowBottom < -1) {
          setIsVerticalDirection(false);
          setIsTwoRows(false);
        } else {
          setIsVerticalDirection(false);
          setIsTwoRows(true);
        }
      }
    }, [autoResize, containerHeight, containerWidth, direction]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props);

    let result;
    if (direction === "vertical") {
      result = (
        <div {...attrs} className={Utils.Css.joinClassName(attrs.className, Css.main(direction, autoResize))}>
          {getInfoItems()}
        </div>
      );
    } else if (direction === "horizontal" && !autoResize) {
      result = (
        <ScrollableBox horizontal>
          <div {...attrs} className={Utils.Css.joinClassName(attrs.className, Css.main(direction, autoResize))}>
            {getInfoItems()}
          </div>
        </ScrollableBox>
      );
    } else if (direction === "horizontal" && autoResize) {
      result = (
        <div {...attrs}>
          <div
            ref={Utils.Component.combineRefs(containerRef, wrapperRef)}
            className={Utils.Css.joinClassName(
              Css.main("horizontal", autoResize),
              isVerticalDirection ? Css.hiddenComponent() : undefined,
            )}
          >
            <div className={Css.stretchElement()} ref={firstItemPositionRef}></div>
            {getInfoItems(false)}
            <div
              className={Css.stretchElement()}
              ref={Utils.Component.combineRefs(lastItemPositionRef, lastItemPositionSizeRef)}
            ></div>
            {isTwoRows && (
              <Line
                colorScheme="neutral"
                significance="subdued"
                className={Css.horizontalLine(lastItemPositionHeight)}
              />
            )}
          </div>
          {isVerticalDirection ? <div className={Css.main("vertical", autoResize)}>{getInfoItems()}</div> : null}
        </div>
      );
    }

    return result;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

//@@viewOn:exports
export { InfoGroup };
export default InfoGroup;
//@@viewOff:exports
