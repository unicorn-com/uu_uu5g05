//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import UuGds from "./gds.js";
import Input from "../input.js";
import Icon from "../icon.js";
import Config from "../config/config.js";
//@@viewOff:imports

//@@viewOn:helpers
//@@viewOff:helpers

//@@viewOn:className
const Css = {
  main: ({ width }) =>
    Config.Css.css({
      position: "relative",
      verticalAlign: "top",
      width,
    }),
  input: (isIconLeft, padding) => {
    const styles = {};
    if (isIconLeft) styles.paddingLeft = padding + "px !important";
    return styles ? Config.Css.css({ ...styles }) : undefined;
  },
  icon: (iconHeight) =>
    Config.Css.css({
      position: "absolute",
      fontSize: "1.5em",
      height: iconHeight,
      width: iconHeight,
      display: "inline-flex",
      justifyContent: "center",
      alignItems: "center",
    }),
};
//@@viewOff:className

const ExtensionInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ExtensionInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { iconLeft, onIconLeftClick, inputAttrs, width, size, ...propsToPass } = props;
    const iconHeight = UuGds.getValue(["SizingPalette", "spot", "basic", props.size]).h;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const { elementRef, ...attrsProps } = props;
    const attrs = Utils.VisualComponent.getAttrs(attrsProps, Css.main({ width }));

    return (
      <span {...attrs}>
        {!!iconLeft && (
          <Icon
            icon={iconLeft}
            onClick={onIconLeftClick}
            size={size}
            className={Css.icon(iconHeight)}
            colorScheme={propsToPass.colorScheme || "building"}
            significance="subdued"
          />
        )}
        <Input
          {...propsToPass}
          elementRef={props.elementRef}
          className={Css.input(!!iconLeft, iconHeight)}
          size={size}
          width="100%"
          elementAttrs={inputAttrs}
        />
      </span>
    );
    //@@viewOff:render
  },
});

export { ExtensionInput };
export default ExtensionInput;
