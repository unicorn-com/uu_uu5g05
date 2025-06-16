//@@viewOn:imports
import { createVisualComponent, Utils, useState, PropTypes } from "uu5g05";

import Config from "../config/config";
import Popover from "../popover";
import UuGds from "../_internal/gds";
import ContextCenterTabs from "./context-center-tabs";
import ContextCenterContent from "./context-center-content";
//@@viewOff:imports

const Css = {
  main: (isMultipleItems) => {
    const styles = { width: 360, display: "flex", flexDirection: "column" };

    if (isMultipleItems) {
      styles.boxShadow = getBoxShadowValue(UuGds.EffectPalette.getValue(["elevationUpper"]));
    }

    return Config.Css.css(styles);
  },
};

const ContextCenterView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ContextCenterView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Popover.propTypes,
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.node,
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
        icon: PropTypes.string,
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
    const { itemList, className, ...otherProps } = props;

    const [activeCode, setActiveCode] = useState("0"); // Tabs expect code as a string

    function handleTabChange({ data }) {
      setActiveCode(data.activeCode);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const { tabList, contentList } = splitItemList(itemList);
    const isMultipleItems = itemList.length > 1;

    return (
      <Popover {...otherProps} className={Utils.Css.joinClassName(className, Css.main(isMultipleItems))}>
        {({ scrollRef }) => {
          return (
            <>
              {isMultipleItems && (
                <ContextCenterTabs itemList={tabList} activeCode={activeCode} onChange={handleTabChange} />
              )}
              <ContextCenterContent itemList={contentList} activeCode={activeCode} elementRef={scrollRef} />
            </>
          );
        }}
      </Popover>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function splitItemList(itemList) {
  const tabList = [];
  const contentList = [];

  itemList.forEach(({ children, ...item }, index) => {
    tabList.push({ ...item, code: index.toString() }); // Tabs expect code as a string
    contentList.push(children);
  });

  return { tabList, contentList };
}

//todo: Until GDS is changed we need to specify boxShadow for popover by ourself
const getBoxShadowValue = (el) => {
  return (
    (el.inset ? "inset" : "") + `${el.offsetX}px ${el.offsetY}px ${el.blurRadius}px ${el.spreadRadius}px ${el.color}`
  );
};
//@@viewOff:helpers

export { ContextCenterView };
export default ContextCenterView;
