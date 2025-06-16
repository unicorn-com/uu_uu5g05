//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import Config from "../config/config.js";
import InfoGroup from "../info-group.js";
import Tools from "../_internal/tools.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const InfoItemList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InfoItemList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.string,
        colorScheme: PropTypes.colorScheme,
        significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
        itemList: PropTypes.array,
        children: PropTypes.node,
        href: PropTypes.string,
        target: PropTypes.string,
        component: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
        onClick: PropTypes.func,
      }),
    ),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: [],
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList: itemListProp, ...otherProps } = props;

    function getItemList() {
      return itemListProp.map(({ children, href, target, ...item }) => {
        const newItem = {
          ...item,
          title: children,
        };

        if (href) {
          let elementAttrs;
          let onClick = (e) => {
            if (typeof item.onClick === "function") item.onClick(e);
            if (!e.defaultPrevented) {
              Tools.openLink(href, target);
            }
          };
          ({ onClick, ...elementAttrs } = Tools.getOnWheelClickAttrs({ onClick }));
          newItem.onClick = onClick;
          newItem.elementAttrs = elementAttrs;
        }

        return newItem;
      });
    }
    //@@viewOff:private

    //@@viewOn:render
    return <InfoGroup {...otherProps} itemList={getItemList()} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { InfoItemList };
export default InfoItemList;
//@@viewOff:exports
