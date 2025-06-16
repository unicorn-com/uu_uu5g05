//@@viewOn:imports
import { createVisualComponent, useValueChange, PropTypes, Utils } from "uu5g05";
import Config from "./config/config.js";
import ScrollableBox from "./scrollable-box.js";
import Box from "./box.js";
import MenuList from "./menu-list.js";
import UuGds from "./_internal/gds.js";
//@@viewOff:imports

const Css = {
  box: () => Config.Css.css({ overflow: "hidden" }),
};

const SwitchSelectVertical = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SwitchSelectVertical",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Box.propTypes,
    height: ScrollableBox.propTypes.height,

    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string,
        onClick: PropTypes.func,
      }),
    ).isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    borderRadius: "moderate",
    significance: "subdued",
    height: ScrollableBox.defaultProps.height,

    itemList: [],
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList: propsItemList, value: propsValue, onChange: propsOnChange, height, ...restProps } = props;
    const { onClick: _, ...boxProps } = restProps;
    // FIXME 2.0.0 onChange with e.data.value
    const [value, setValue] = useValueChange(propsValue, propsOnChange);

    const itemList = propsItemList.map(({ value: itemValue, onClick, children = itemValue, ...item }) => {
      const focused = itemValue === value;
      return {
        role: "option",
        ...item,
        children,
        onClick: (e) => {
          if (typeof onClick === "function") onClick(e);
          if (!e.defaultPrevented) setValue(itemValue);
        },
        focused,
        colorScheme: focused ? "primary" : undefined,
        significance: focused ? "distinct" : undefined,
      };
    });

    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Box {...boxProps} className={Utils.Css.joinClassName(Css.box(), boxProps.className)}>
        <MenuList
          role="listbox"
          itemList={itemList}
          className={Config.Css.css({ padding: UuGds.getValue(["SpacingPalette", "fixed", "b"]) })}
          maxHeight={height}
        />
      </Box>
    );
    //@@viewOff:render
  },
});

export { SwitchSelectVertical };
export default SwitchSelectVertical;
