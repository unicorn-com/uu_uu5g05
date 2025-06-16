//@@viewOn:imports
import { Utils, createVisualComponent, _useViewportStickyBottomScopeData } from "uu5g05";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:constants
const warnedMultiplePlaceholders = new WeakSet();
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const ViewportStickyBottomPlaceholder = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ViewportStickyBottomPlaceholder",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { elementRef, scopeData, scopeItemData } = _useViewportStickyBottomScopeData({
      registerData: { height: 0, type: "placeholder" },
    });

    let totalHeight = 0;
    for (let i = 0; i < scopeData?.itemList.length; i++) {
      totalHeight += scopeData.itemList[i].height || 0;
    }

    const placeholderList = scopeData?.itemList.filter((it) => it.type === "placeholder") || [];
    if (placeholderList.length > 1) {
      if (!warnedMultiplePlaceholders.has(scopeData)) {
        warnedMultiplePlaceholders.add(scopeData);
        ViewportStickyBottomPlaceholder.logger.error(
          "There are multiple ViewportStickyBottomPlaceholder-s attached to the same scope element, i.e. the space occupied by withViewportStickyBottom(Comp) components is reserved multiple times instead of just once! Render just 1 placeholder. Auto-corrected by ignoring other placeholders.",
        );
      }
      // let only 1st placeholder reserve the place
      if (placeholderList[0].id !== scopeItemData?.id) totalHeight = 0;
    }
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props);

    return (
      <div
        {...attrs}
        ref={Utils.Component.combineRefs(attrs.ref, elementRef)}
        style={{ ...attrs.style, height: totalHeight + "px" }}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { ViewportStickyBottomPlaceholder };
export default ViewportStickyBottomPlaceholder;
//@@viewOff:exports
