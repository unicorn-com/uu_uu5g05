//@@viewOn:imports
import { createComponent, PropTypes, Utils, useBackground, BackgroundProvider } from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import Bar from "./bar.js";
import useSpacing from "../use-spacing.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main({
    background,
    paddingHorizontal,
    paddingTop,
    paddingBottom,
    separator,
    spacing,
    actionLeft,
    headerSeparatorColorScheme,
    overlaid,
    overlaidShapeStyles,
  }) {
    let borderBottom;
    let colorScheme = headerSeparatorColorScheme ?? "building";

    if (separator) {
      const styles = UuGds.getValue([
        "Shape",
        "line",
        background,
        colorScheme,
        headerSeparatorColorScheme ? "common" : "subdued",
      ]).default;
      borderBottom = {
        borderBottomWidth: headerSeparatorColorScheme ? "2px" : styles?.border?.width,
        borderBottomStyle: styles?.border?.style,
        borderBottomColor: styles?.colors?.border,
      };
    }

    if (overlaidShapeStyles) {
      Object.assign(overlaidShapeStyles, {
        position: "absolute",
        insetBlockStart: 0,
        insetInlineEnd: 0,
        borderStartEndRadius: "inherit",
      });
    }

    return Config.Css.css({
      paddingTop: paddingTop ? spacing.c : undefined,
      paddingBottom: paddingBottom && !headerSeparatorColorScheme ? spacing.c : undefined,
      paddingLeft: paddingHorizontal ? (actionLeft || overlaid ? spacing.c : spacing.d) : undefined, // TODO should be "c" if there is a burger menu to the left of header (at least that's what the Gds book says)
      paddingRight: paddingHorizontal ? spacing.c : undefined,
      ...borderBottom,
      ...overlaidShapeStyles,
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getOverlaidShapeStyles({ background }) {
  const states = UuGds.getValue(["Shape", "overlay", background, "building", "common"]);
  const gdsBackground = states.default.colors?.gdsBackground;
  const styles = {
    backgroundColor: UuGds.Shape.getStateStyles(states.default, true).backgroundColor,
    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": {
        backgroundColor: UuGds.Shape.getStateStyles(states.saving).backgroundColor,
      },
    },
  };

  return [styles, gdsBackground];
}
//@@viewOff:helpers

const Header = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Header",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    paddingHorizontal: PropTypes.bool,
    paddingTop: PropTypes.bool,
    paddingBottom: PropTypes.bool,
    actionLeft: PropTypes.object,
    headerSeparatorColorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    overlaid: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    paddingHorizontal: true,
    paddingTop: true,
    paddingBottom: true,
    actionLeft: undefined,
    headerSeparatorColorScheme: undefined,
    overlaid: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { overlaid, ...otherProps } = props;
    const spacing = useSpacing();
    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const [overlaidShapeStyles, gdsBackground] = overlaid ? getOverlaidShapeStyles({ ...props, background }) : [];
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let result = (
      <Bar
        {...otherProps}
        className={Utils.Css.joinClassName(
          props.className,
          Css.main({ ...props, spacing, background, overlaidShapeStyles }),
        )}
      />
    );
    if (overlaid) {
      result = <BackgroundProvider background={gdsBackground ?? background}>{result}</BackgroundProvider>;
    }
    return result;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Header };
export default Header;
