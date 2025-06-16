//@@viewOn:imports
import { createComponent, PropTypes, Utils } from "uu5g05";
import Config from "../config/config.js";
import Icon from "../icon.js";
import NotificationBadge from "./notification-badge.js";
//@@viewOff:imports

const CSS = {
  main: () => Config.Css.css({ position: "relative" }),
  notificationBadge: () => Config.Css.css({ position: "absolute", top: 0, right: 0 }),
};

const IconWithNotification = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "IconWithNotification",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Icon.propTypes,
    iconNotification: PropTypes.shape({
      colorScheme: NotificationBadge.propTypes.colorScheme,
    }),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...Icon.defaultProps,
    iconNotification: {},
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, className, iconNotification, ...otherProps } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Icon {...otherProps} className={Utils.Css.joinClassName(className, CSS.main())} testId="icon-with-notification">
        {children}
        <NotificationBadge {...iconNotification} className={CSS.notificationBadge()} />
      </Icon>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { IconWithNotification };
export default IconWithNotification;
