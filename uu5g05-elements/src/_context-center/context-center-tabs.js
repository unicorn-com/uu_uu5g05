//@@viewOn:imports
import { createVisualComponent, Utils, useBackground } from "uu5g05";
import Config from "../config/config.js";
import Tabs from "../tabs";
import UuGds from "../_internal/gds";
//@@viewOff:imports

const ContextCenterTabs = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ContextCenterView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: Tabs.propTypes.itemList,
    activeCode: Tabs.propTypes.activeCode,
    onChange: Tabs.propTypes.onChange,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: [],
    activeCode: undefined,
    onChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const background = useBackground();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Tabs
        {...props}
        type="line"
        size="m"
        block
        className={Utils.Css.joinClassName(
          props.className,
          Config.Css.css({
            ...UuGds.Shape.getStateStyles(
              UuGds.Shape.getValue(["background", background, "building", "common", "default"]),
            ),
          }),
        )}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { ContextCenterTabs };
export default ContextCenterTabs;
