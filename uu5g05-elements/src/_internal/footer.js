//@@viewOn:imports
import { createVisualComponent, useBackground, Utils, PropTypes } from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import useSpacing from "../use-spacing.js";
//@@viewOff:imports

const Css = {
  main({ background, separator, paddings }) {
    let borderTop;
    if (separator) {
      const styles = UuGds.getValue(["Shape", "line", background, "building", "subdued"]).default;
      borderTop = {
        borderTopWidth: styles?.border?.width,
        borderTopStyle: styles?.border?.style,
        borderTopColor: styles?.colors?.border,
      };
    }

    return Config.Css.css({
      ...paddings,
      ...borderTop,
    });
  },
};

const Footer = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Footer",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    separator: PropTypes.bool,
    paddingHorizontal: PropTypes.bool,
    paddingTop: PropTypes.bool,
    paddingBottom: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    separator: false,
    paddingHorizontal: true,
    paddingTop: true,
    paddingBottom: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, paddingHorizontal, paddingTop, paddingBottom } = props;
    const spacing = useSpacing();
    const background = useBackground(props.background); // TODO Next major - remove props.background.
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const isChildFn = typeof children === "function";
    const paddings = {
      paddingTop: paddingTop ? spacing.d : undefined,
      paddingBottom: paddingBottom ? spacing.d : undefined,
      paddingLeft: paddingHorizontal ? spacing.d : undefined,
      paddingRight: paddingHorizontal ? spacing.d : undefined,
    };

    const attrs = Utils.VisualComponent.getAttrs(
      props,
      Css.main({ ...props, background, paddings: isChildFn ? undefined : paddings }),
    );
    return <div {...attrs}>{isChildFn ? children({ style: paddings }) : children}</div>;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Footer };
export default Footer;
