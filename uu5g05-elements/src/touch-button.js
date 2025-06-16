//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes } from "uu5g05";
import Config from "./config/config.js";
import Badge from "./badge.js";
import RichIcon, { SIZE } from "./rich-icon.js";
//@@viewOff:imports

const STATE_OFFSETS = { xl: 6, xxl: 8, "3xl": 10 };

const Css = {
  main: () => {
    return Config.Css.css({
      position: "relative",
    });
  },
  icon: () => {
    return Config.Css.css({
      position: "relative",
    });
  },
  notification: () => {
    const staticCss = Config.Css.css({
      position: "absolute",
      "&&": { border: "1px solid #fff" },
      top: -4,
      right: -4,
    });
    return [staticCss].join(" ");
  },
  state: ({ size }) => {
    const staticCss = Config.Css.css({
      position: "absolute",
      "&&": { border: "1px solid #fff" },
    });

    const dynamicCss = Config.Css.css({
      bottom: STATE_OFFSETS[size],
      right: STATE_OFFSETS[size],
    });
    return [staticCss, dynamicCss].join(" ");
  },
};

const TouchButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TouchButton",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...RichIcon.propTypes,
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    notification: PropTypes.number,
    state: PropTypes.oneOf([
      "system",
      "initial",
      "active",
      "final",
      "alternative-active",
      "problem",
      "passive",
      "alternative-final",
      "cancelled",
    ]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    notification: undefined,
    state: undefined,
    // RichIcon props
    size: "xl",
    borderRadius: "moderate",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { notification, state, ...restProps } = props;
    const { size } = restProps;

    const [sizePalette] = SIZE[size] || [];
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const iconBoxContent = (
      <>
        {notification && (
          <Badge
            colorScheme="negative"
            size={sizePalette === "major" ? "l" : "s"}
            borderRadius="expressive"
            className={Css.notification(props)}
            testId="notification"
          >
            {notification}
          </Badge>
        )}
        {state && sizePalette === "major" && (
          <Badge testId="state" colorScheme={state} size="s" borderRadius="expressive" className={Css.state(props)} />
        )}
      </>
    );

    return (
      <RichIcon {...restProps} className={Utils.Css.joinClassName(restProps.className, Css.main(props))}>
        {iconBoxContent}
      </RichIcon>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { TouchButton };
export default TouchButton;
