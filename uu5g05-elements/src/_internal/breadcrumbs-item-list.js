//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import Config from "../config/config.js";
import UuGds from "./gds.js";
import Icon from "../icon.js";
import Link from "../link.js";
import Text from "../text.js";
//@@viewOff:imports

//@@viewOn:constants
const TEMP_KEY = "temp-measure-key";
const DOTS_ICON = "uugds-dots-horizontal";
const ITEM_MARGIN = UuGds.getValue(["SpacingPalette", "fixed", "b"]);
const ITEM_TYPES = {
  full: "full",
  collapsed: "collapsed",
  hidden: "hidden",
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  separator: () =>
    Config.Css.css({
      fontSize: "1.1em",
      verticalAlign: -2,
      margin: `0 ${ITEM_MARGIN}px`,
      flex: "none",
    }),
  item: (maxWidth, isCol) =>
    Config.Css.css({
      ...((maxWidth || isCol) && {
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth,
      }),
      whiteSpace: "nowrap",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

let BreadcrumbsItemList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "BreadcrumbsItemList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        ...Text.propTypes,
        ...Link.propTypes,
        collapsed: PropTypes.bool,
      }),
    ).isRequired,
    itemStates: PropTypes.arrayOf(
      PropTypes.shape({
        [ITEM_TYPES.full]: PropTypes.number,
        [ITEM_TYPES.collapsed]: PropTypes.number,
        type: PropTypes.oneOf([ITEM_TYPES.full, ITEM_TYPES.collapsed, ITEM_TYPES.hidden]),
      }),
    ),
    measurePhase: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: undefined,
    itemStates: [],
    measurePhase: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, itemStates, measurePhase } = props;

    function renderSeparator(index) {
      return (
        <Icon
          key={index + "-sep"}
          colorScheme="building"
          significance="subdued"
          icon="uugds-chevron-right"
          className={Css.separator()}
        />
      );
    }

    function renderItem(item, type, key, maxWidth, isLastItem) {
      let propsToPass = {
        ...item,
        className: Css.item(maxWidth, isLastItem),
        colorScheme: "building",
        significance: "subdued",
        children: type === ITEM_TYPES.collapsed ? <Icon icon={DOTS_ICON} /> : item.children,
      };
      delete propsToPass.key;

      let Comp = Text;
      if (item.href) {
        Comp = Link;
        propsToPass.colorScheme = "primary";
        propsToPass.significance = "common";
      }

      return <Comp key={key} {...propsToPass} />;
    }

    function renderResult() {
      const result = [];
      const lastItemIndex = itemList.length - 1;
      let isLastItemCollapsing = true;

      itemList.forEach((item, index) => {
        const itemState = itemStates[index] || {};

        if (itemState.type === ITEM_TYPES.hidden) return;

        // Add separator
        if (result.length && index) result.push(renderSeparator(index));

        // Check if there is item with type=full and is not last
        if (lastItemIndex !== index && itemState.type === ITEM_TYPES.full && !(item.collapsed === false)) {
          isLastItemCollapsing = false;
        }

        result.push(
          renderItem(
            item,
            itemState.type || ITEM_TYPES.full,
            item.key || index,
            itemState.maxWidth,
            lastItemIndex === index && isLastItemCollapsing,
          ),
        );
      });

      if (measurePhase) {
        // Add temporary collapsed item to measure its width
        result.push(renderItem({}, ITEM_TYPES.collapsed, TEMP_KEY));
      }

      return result;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return renderResult();
    //@@viewOff:render
  },
});

BreadcrumbsItemList = Utils.Component.memo(BreadcrumbsItemList);

//@@viewOn:exports
export { BreadcrumbsItemList, ITEM_TYPES, ITEM_MARGIN };
export default BreadcrumbsItemList;
//@@viewOff:exports
