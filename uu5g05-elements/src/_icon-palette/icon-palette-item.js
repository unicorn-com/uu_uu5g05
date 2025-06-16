//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice, useScreenSize, Utils, useBackground } from "uu5g05";
import Config from "../config/config.js";
import UuGds from "../_internal/gds.js";
import Icon from "../icon.js";
import Button from "../button.js";
import EmptyPreview from "../_internal/empty-preview.js";
//@@viewOff:imports

const CSS_VAR_ICON_FONT_SIZE_SCALE = "--uu5-elements-ipiifss";

export const IconPaletteItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "IconPaletteItem",

  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    insideInputBox: PropTypes.bool, // Need for icon custom styling inside input box
    data: PropTypes.shape({
      component: PropTypes.elementType,
      componentProps: PropTypes.object,
      isSelected: PropTypes.bool,
      onClick: PropTypes.func,
      colorScheme: PropTypes.colorScheme,
    }),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    insideInputBox: false,
    data: {},
  },
  //@@viewOff:defaultProps

  //@@viewOn:render
  render(props) {
    const { data, width, height, className, insideInputBox, ...otherProps } = props;
    const [screenSize] = useScreenSize();

    let { component: Component, componentProps, isSelected, onClick, colorScheme, ...otherData } = data;
    if (!Component) Component = Icon;
    const passExactFontSize = Component === Icon;

    const { isMobileOrTablet } = useDevice();
    const background = useBackground();

    return data && (data.icon || data.component) ? (
      insideInputBox ? (
        <Component
          {...otherData}
          {...componentProps}
          className={Utils.Css.joinClassName(componentProps?.className, className)}
        />
      ) : (
        <Button
          {...otherProps}
          onClick={otherData.id == null ? undefined : onClick}
          significance="subdued"
          borderRadius="elementary"
          size="s"
          className={Utils.Css.joinClassName(
            className,
            CLASS_NAMES.main({ isSelected, screenSize, passExactFontSize, isMobileOrTablet, colorScheme, background }),
          )}
          tooltip={otherData.icon}
          icon={
            <Component
              {...otherData}
              {...componentProps}
              className={Utils.Css.joinClassName(
                componentProps?.className,
                passExactFontSize ? Config.Css.css({ fontSize: "inherit", "&>:before": { fontSize: "inherit" } }) : "",
              )}
            />
          }
        />
      )
    ) : (
      <EmptyPreview size={props.size} borderRadius={props.borderRadius} insideInputBox={insideInputBox} />
    );
  },
  //@@viewOff:render
});
//@@viewOn:helpers
function getBoxShadow(elevation) {
  let result = elevation.inset ? "inset" : "";
  result += ` ${elevation.offsetX}px ${elevation.offsetY}px ${elevation.blurRadius}px ${elevation.spreadRadius}px`;
  if (elevation.color) result += ` ${elevation.color}`;
  return result.trim();
}

function getElevation(level, colorScheme, background) {
  const states = UuGds.getValue(["Shape", "formElement", background, colorScheme, "common"]);
  const defaultStyles = UuGds.Shape.getStateStyles(states.default, true);

  let shadow = UuGds.EffectPalette.getValue([level], { color: defaultStyles?.borderColor });
  shadow = Array.isArray(shadow) ? shadow.map((it) => getBoxShadow(it)).join(", ") : getBoxShadow(shadow);
  return { boxShadow: shadow };
}

const CLASS_NAMES = {
  main: ({ isSelected, screenSize, passExactFontSize, isMobileOrTablet, colorScheme, background }) => {
    let dimension = UuGds.getSizes("spot", "basic", "s").height;
    let fontSize = UuGds.getSizes("spot", "basic", "xxs").height;
    return Config.Css.css({
      "&&": {
        width: isMobileOrTablet && screenSize === "xs" ? "100%" : dimension,
        minWidth: dimension,
        textAlign: "center",
        aspectRatio: "1/1",
        height: "auto",
        justifyContent: "center",
        fontSize: passExactFontSize
          ? isMobileOrTablet && screenSize === "xs"
            ? `calc(${fontSize}px * var(${CSS_VAR_ICON_FONT_SIZE_SCALE}))`
            : fontSize
          : "100%",
        "&>*": { fontSize: "inherit" },
      },
      ...(isSelected ? getElevation("outlineIndentedExpressive", colorScheme, background) : undefined),
    });
  },
};
//@@viewOff:helpers

export { CSS_VAR_ICON_FONT_SIZE_SCALE };
export default IconPaletteItem;
