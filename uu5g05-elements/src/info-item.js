//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import Config from "./config/config.js";
import withTooltip from "./with-tooltip.js";
import { InfoItemHorizontal, SUBTITLE_2LINE_TEXT_TYPE_MAP } from "./_info-item/info-item-horizontal.js";
import InfoItemVertical from "./_info-item/info-item-vertical.js";
//@@viewOff:imports

const InfoItem = withTooltip(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "InfoItem",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...InfoItemHorizontal.propTypes,
      direction: PropTypes.oneOf(["horizontal", "vertical", "vertical-reverse", "vertical-full"]),
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...InfoItemHorizontal.defaultProps,
      size: undefined,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      //NOTE: children are excluded and do not use anymore
      const { children, direction, ...otherProps } = props;
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      let Component;
      const compProps = { ...otherProps };

      if (direction === "vertical-full") {
        Component = InfoItemVertical;
      } else {
        Component = InfoItemHorizontal;
        compProps.direction = direction;
      }

      return <Component {...compProps} />;
      //@@viewOff:render
    },
  }),
);

export { InfoItem, SUBTITLE_2LINE_TEXT_TYPE_MAP };
export default InfoItem;
