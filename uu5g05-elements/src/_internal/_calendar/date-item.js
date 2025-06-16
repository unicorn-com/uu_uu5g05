//@@viewOn:imports
import { createComponent, PropTypes, useScreenSize, Utils } from "uu5g05";
import UuGds from "../gds";
import Button from "../../button.js";
import Config from "../../config/config.js";
//@@viewOff:imports

const DateItem = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DateItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    date: PropTypes.string,
    type: PropTypes.oneOf(["hidden", "selected", "midSelected", "different", "current", "default"]),
    onClick: PropTypes.func,
    colorScheme: Button.propTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: { type: "default" },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const [screenSize] = useScreenSize();
    const isSmallScreenSize = ["xs"].indexOf(screenSize) > -1 ? true : false;
    const { date, onClick, className, type, colorScheme, ...otherProps } = props;
    const { h: width } = UuGds.getValue(["SizingPalette", "spot", "basic", "s"]);

    const buttonProps = {};
    switch (type) {
      case "hidden":
        buttonProps.significance = "subdued";
        buttonProps.disabled = true;
        break;
      case "selected":
        buttonProps.colorScheme = colorScheme;
        buttonProps.significance = "highlighted";
        break;
      case "midSelected":
        buttonProps.colorScheme = colorScheme;
        buttonProps.significance = "common";
        break;
      case "different":
        buttonProps.colorScheme = "neutral";
        buttonProps.significance = "subdued";
        break;
      case "current":
        buttonProps.colorScheme = colorScheme;
        buttonProps.significance = "distinct";
        break;
      default:
        buttonProps.colorScheme = colorScheme;
    }

    const onButtonClick = (e) => {
      if (typeof onClick === "function") {
        onClick(new Utils.Event({ value: date }, e));
      }
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Button
        size="s"
        {...buttonProps}
        {...otherProps}
        className={Utils.Css.joinClassName(CLASS_NAMES.itemSmallSize(isSmallScreenSize), CLASS_NAMES.item(), className)}
        width={isSmallScreenSize ? "100%" : otherProps.width || width}
        onClick={onButtonClick}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const CLASS_NAMES = {
  itemSmallSize: (isSmallScreenSize) =>
    isSmallScreenSize ? Config.Css.css({ height: "auto !important", aspectRatio: "1/1" }) : undefined,
  item: () => Config.Css.css({ paddingLeft: "0px !important", paddingRight: "0px !important" }),
};
//@@viewOff:helpers

export { DateItem as DayItem };
export default DateItem;
