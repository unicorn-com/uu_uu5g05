//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, useState, Utils } from "uu5g05";
import HighlightedBox from "../highlighted-box.js";
import Text from "../text.js";
import Config from "../config/config.js";
import useSpacing from "../use-spacing.js";
import UuGds from "../_internal/gds";
//@@viewOff:imports

const COLORSCHEME_MAP = {
  error: "negative",
  warning: "warning",
  success: "positive",
  info: "important",
};

const Css = {
  header: (spacing) =>
    Config.Css.css({
      [`&&`]: { marginBottom: UuGds.SpacingPalette.getValue(["fixed", "b"]) },
    }),
};

const AlertContent = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AlertContent",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...HighlightedBox.propTypes,
    header: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
    message: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
    priority: PropTypes.oneOf(["error", "warning", "success", "info"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    header: undefined,
    message: undefined,
    priority: "info",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { header, message, priority, children, elementAttrs, ...otherProps } = props;
    const { colorScheme = COLORSCHEME_MAP[priority] } = otherProps;

    const [id] = useState(() => Utils.String.generateId());
    const headerId = id + "-header";

    const spacing = useSpacing();

    if (header && typeof header === "object" && !Utils.Element.isValid(header)) {
      header = <Lsi lsi={header} />;
    }

    if (message && typeof message === "object" && !Utils.Element.isValid(message)) {
      message = <Lsi lsi={message} />;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <HighlightedBox
        {...otherProps}
        colorScheme={colorScheme}
        overlay
        elementAttrs={{ ...elementAttrs, role: priority === "error" ? "alert" : "status", "aria-labelledby": headerId }}
      >
        {header && (
          <Text
            id={headerId}
            category="story"
            segment="heading"
            type="h5"
            className={Css.header(spacing)}
            colorScheme={colorScheme}
          >
            {header}
          </Text>
        )}
        {message || children}
      </HighlightedBox>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { AlertContent };
export default AlertContent;
