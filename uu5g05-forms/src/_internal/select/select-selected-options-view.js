//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import { MenuList } from "uu5g05-elements";
import Config from "../../config/config.js";
import { getItemChildren } from "./tools.js";
import NestedSelectOption from "./nested-select-option.js";
//@@viewOff:imports

//@@viewOn:css
const Css = {
  item: () =>
    Config.Css.css({
      overflow: "hidden",
    }),
  itemChildren: () =>
    Config.Css.css({
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function getSelectedItemList(value, onRemove) {
  return value.map((item) => {
    const { value: itemValue, size, colorScheme, parent, className, ...restItemProps } = item;
    const children = <div className={Css.itemChildren()}>{getItemChildren(item)}</div>;
    return {
      ...restItemProps,
      className: Utils.Css.joinClassName(className, Css.item()),
      children: parent ? <NestedSelectOption path={parent}>{children}</NestedSelectOption> : children,
      actionList: [
        {
          icon: "uugds-minus-circle",
          colorScheme: "red",
          onClick: onRemove(itemValue),
        },
      ],
      significance: "distinct",
      role: "option",
    };
  });
}
//@@viewOff:helpers

const SelectSelectedOptionsView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SelectSelectedOptionsView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: [],
    onChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onChange, size, ...otherProps } = props;

    const selectedItemList = getSelectedItemList(value, handleRemoveItem);

    function handleRemoveItem(removeValue) {
      return (e) => {
        e.stopPropagation();
        e.preventDefault();
        onChange(new Utils.Event({ value: value.filter((valueItem) => valueItem.value !== removeValue) }, e));
      };
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const menuListProps = {
      ...otherProps,
      itemList: selectedItemList,
      elementAttrs: {
        role: "listbox",
      },
      size,
    };

    return <MenuList {...menuListProps} />;
    //@@viewOff:render
  },
});

export { SelectSelectedOptionsView };
export default SelectSelectedOptionsView;
