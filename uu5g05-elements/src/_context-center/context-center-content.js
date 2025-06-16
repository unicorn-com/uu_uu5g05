//@@viewOn:imports
import { createVisualComponent, useElementSize, useState, useLayoutEffect, PropTypes } from "uu5g05";

import Config from "../config/config.js";
import Carousel from "../carousel";
import UuGds from "../_internal/gds";
import ScrollableBox from "../scrollable-box.js";
//@@viewOff:imports

function getContentPadding() {
  const padding = UuGds.SpacingPalette.getValue(["fixed", "g"]);
  return {
    paddingTop: padding,
    paddingBottom: padding,
    paddingLeft: padding,
    paddingRight: padding,
  };
}

const Css = {
  contentItem: (paddings = {}) => Config.Css.css({ ...paddings }),
  carousel: () => Config.Css.css({ "&&": { padding: 0 } }),
};

const _ContentItem = createVisualComponent({
  uu5Tag: Config.TAG + "_ContentItem",
  render({ children }) {
    //@@viewOn:private

    const isChildrenFn = typeof children === "function";
    const paddings = getContentPadding();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <div className={Css.contentItem(isChildrenFn ? undefined : paddings)}>
        {isChildrenFn ? children({ style: paddings }) : children}
      </div>
    );
    //@@viewOff:render
  },
});

const ContextCenterContent = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ContextCenterContent",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.array,
    activeCode: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: [],
    activeCode: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, activeCode: activeCodeProp, ...otherProps } = props;
    const activeCode = Number(activeCodeProp);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    function renderChild(child, key) {
      return (
        <_ContentItem isActive={activeCode === key} key={key}>
          {child}
        </_ContentItem>
      );
    }

    return (
      <ScrollableBox {...otherProps} scrollIndicator="disappear" maxHeight="auto">
        <Carousel
          className={Css.carousel()}
          index={activeCode}
          contentHeight="auto"
          buttons="none"
          stepper="none"
          virtualization
        >
          {itemList.map(renderChild)}
        </Carousel>
      </ScrollableBox>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { ContextCenterContent };
export default ContextCenterContent;
