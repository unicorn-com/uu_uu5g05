//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useBackground } from "uu5g05";
import Config from "./config/config.js";
import UuGds from "./_internal/gds";
import Icon from "./icon.js";
import ActionGroup from "./action-group.js";
//@@viewOff:imports

//@@viewOn:helpers
function getShapeStyles({ background, colorScheme, significance }) {
  const states = UuGds.getValue(["Shape", "interactiveElement", background, colorScheme, significance]);

  const styles = {
    ...UuGds.Shape.getStateStyles(states.default, true),

    "@media print": {
      "&, &:hover, &:focus, &:active, &[disabled]": UuGds.Shape.getStateStyles(states.saving),
    },

    "&.saving": UuGds.Shape.getStateStyles(states.saving),
  };

  return styles;
}

const CLASS_NAMES = {
  mainDynamic: ({ shapeStyles, icon, borderRadius }) => {
    const typoStyle = UuGds.getValue(["Typography", "interface", "interactive"]);

    const styles = {
      // typography
      ...typoStyle,

      // shape
      ...shapeStyles,

      padding: UuGds.SpacingPalette.getValue(["fixed", "c"]),
      paddingLeft: icon ? undefined : UuGds.SpacingPalette.getValue(["fixed", "d"]),
      borderRadius: UuGds.RadiusPalette.getValue(["box", borderRadius]),
    };

    return Config.Css.css(styles);
  },
  mainStatic: () =>
    Config.Css.css({
      display: "flex",
      alignItems: "center",
      position: "relative",
    }),
  icon: ({ iconDragRef }) => {
    const gap = UuGds.SpacingPalette.getValue(["fixed", "b"]);
    return Config.Css.css({
      cursor: iconDragRef ? "grab" : undefined,
      display: "flex",
      alignSelf: "baseline",
      fontSize: UuGds.getValue(["SizingPalette", "inline", "emphasized"]),
      ...(iconDragRef ? { padding: gap, margin: -gap, marginRight: 0 } : { marginRight: gap }),
    });
  },
  actionGroup: () =>
    Config.Css.css({
      marginLeft: UuGds.SpacingPalette.getValue(["fixed", "b"]),
      alignSelf: "baseline",
    }),
};

//@@viewOff:helpers

const ListItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ListItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
    actionList: ActionGroup.propTypes.itemList,
    icon: PropTypes.icon,
    iconDragRef: PropTypes.func,
    iconAnimation: Icon.propTypes.animation,
    borderRadius: PropTypes.borderRadius,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    colorScheme: "neutral",
    significance: "common",
    actionList: undefined,
    icon: undefined,
    iconDragRef: undefined,
    iconAnimation: undefined,
    borderRadius: "moderate",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, actionList, icon, iconDragRef, iconAnimation } = props;

    const background = useBackground();
    const shapeStyles = getShapeStyles({ ...props, background });
    const staticCss = CLASS_NAMES.mainStatic();
    const dynamicCss = CLASS_NAMES.mainDynamic({ ...props, shapeStyles });
    const className = Utils.Css.joinClassName(staticCss, dynamicCss);
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, className);

    return (
      <div {...attrs}>
        {icon && (
          <Icon
            icon={icon}
            animation={iconAnimation}
            className={CLASS_NAMES.icon({ iconDragRef })}
            testId="icon"
            elementRef={iconDragRef}
          />
        )}
        {children}
        {Array.isArray(actionList) && actionList.length > 0 && (
          <ActionGroup itemList={actionList} className={CLASS_NAMES.actionGroup()} />
        )}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { ListItem };
export default ListItem;
