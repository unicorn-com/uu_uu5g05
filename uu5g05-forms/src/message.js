//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, Lsi, useState, useDevice } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
//@@viewOff:imports

const COLOR_SCHEME_MAP = Config.COLOR_SCHEME_MAP;
const TEXT_TYPE_MAP_MOBILE = {
  xs: "small",
  s: "medium",
  m: "large",
};
const TEXT_TYPE_MAP = {
  xs: "xsmall",
  s: "small",
  m: "medium",
};

const Css = {
  main({ showDelayed }) {
    const staticCss = {
      display: "block",
      fontStyle: "italic",
    };
    let dynamicCss;
    if (showDelayed) {
      dynamicCss = {
        // animation because of click to submit button was not executed because e.g. warn message was displayed
        // and button was moved down
        animation: `${Config.Css.keyframes({
          "0%": { height: 0, overflow: "hidden", margin: 0 },
          "99%": { height: 0, overflow: "hidden", margin: 0 },
          "100%": {},
        })} 0.1s`,
      };
    }
    return [staticCss, dynamicCss]
      .filter(Boolean)
      .map((it) => Config.Css.css(it))
      .join(" ");
  },
};

const Message = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Message",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    size: PropTypes.oneOf(Object.keys(TEXT_TYPE_MAP)),
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
    feedback: PropTypes.oneOf(["success", "warning", "error"]),
    params: PropTypes.array,
    initialShowDelayed: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    size: "m",
    feedback: undefined,
    params: undefined,
    initialShowDelayed: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { size, children, feedback, params, className, initialShowDelayed, ...otherProps } = props;
    const [showDelayed] = useState(initialShowDelayed);

    const { isMobileOrTablet } = useDevice();
    const textType = (isMobileOrTablet && TEXT_TYPE_MAP_MOBILE[size]) || TEXT_TYPE_MAP[size];

    if (children && typeof children === "object" && !Utils.Element.isValid(children)) {
      children = <Lsi lsi={children} params={params} />;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Elements.Text
        {...otherProps}
        className={Utils.Css.joinClassName(Css.main({ ...props, showDelayed }), className)}
        category="interface"
        segment="content"
        type={textType}
        colorScheme={COLOR_SCHEME_MAP[feedback] || "building"}
        significance={feedback ? undefined : "subdued"}
      >
        {children}
      </Uu5Elements.Text>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Message };
export default Message;
