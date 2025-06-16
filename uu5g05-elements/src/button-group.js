//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes } from "uu5g05";
import Config from "./config/config.js";
import Button from "./button.js";
import Dropdown from "./dropdown.js";
import Line from "./line.js";
import UuGds from "./_internal/gds.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ width, effect, size, borderRadius }) => {
    let radius;
    if (size) {
      const styles = UuGds.getSizes("spot", "basic", size, borderRadius);
      radius = styles.borderRadius;
    }
    return Config.Css.css({
      display: "inline-flex",
      width,
      ...getEffectStyles({ effect }),
      borderRadius: radius,
    });
  },
  item: ({ significance, isFirst, isLast }) => {
    return Config.Css.css({
      flex: "1 0 auto",
      "&&": {
        ...(!isFirst ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : undefined),
        ...(significance === "distinct" && !isFirst ? { borderLeft: "none" } : undefined),
        ...(significance === "distinct" && !isLast ? { borderRight: "none" } : undefined),
        ...(!isLast ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 } : undefined),
      },
    });
  },
  separator: () => {
    return Config.Css.css({ flex: "none" });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getEffectStyles({ effect }) {
  let defaultStyles;
  if (effect) {
    const elevationKey = "elevation" + Utils.String.capitalize(effect);
    let gdsEffectDefault = UuGds.EffectPalette.getValue([elevationKey]);
    defaultStyles = UuGds.EffectPalette.getStyles(gdsEffectDefault);
  }

  const styles = {
    ...defaultStyles,

    "@media print": {
      "&, &:hover": defaultStyles,
    },
  };
  return styles;
}
//@@viewOff:helpers

const ButtonGroup = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ButtonGroup",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        icon: Button.propTypes.icon,
        children: PropTypes.node,
        onClick: Button.propTypes.onClick,
        tooltip: Button.propTypes.tooltip,
        pressed: Button.propTypes.pressed,
        itemList: Dropdown.propTypes.itemList,
      }),
    ),
    size: Button.propTypes.size,
    colorScheme: Button.propTypes.colorScheme,
    significance: Button.propTypes.significance,
    borderRadius: Button.propTypes.borderRadius,
    width: Button.propTypes.width,
    _displaySeparators: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: [],
    size: Button.defaultProps.size,
    colorScheme: Button.defaultProps.colorScheme,
    significance: Button.defaultProps.significance,
    borderRadius: Button.defaultProps.borderRadius,
    width: undefined,
    _displaySeparators: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, size, colorScheme, significance, borderRadius, _displaySeparators } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    function renderSeparator(index) {
      return (
        <Line
          key={"sep" + index}
          direction="vertical"
          colorScheme={colorScheme}
          significance={significance === "distinct" ? "common" : "subdued"}
          className={Css.separator()}
        />
      );
    }
    function renderItem(item, index) {
      const Component = item.itemList ? Dropdown : Button;
      const key = item.key ?? index;
      const componentProps = {
        colorScheme,
        significance,
        borderRadius,
        size,
        ...item,
        className: Utils.Css.joinClassName(
          item.className,
          Css.item({ ...props, isFirst: index === 0, isLast: index === itemList.length - 1 }),
        ),
      };
      delete componentProps.key;
      if (Component === Dropdown) {
        componentProps.label = componentProps.children;
        delete componentProps.children;
      }
      return <Component key={key} {...componentProps} />;
    }
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main(props));

    return (
      <span {...attrs}>
        {itemList.map((item, i) => [_displaySeparators && i > 0 ? renderSeparator(i) : null, renderItem(item, i)])}
      </span>
    );
    //@@viewOff:render
  },
});

export { ButtonGroup };
export default ButtonGroup;
