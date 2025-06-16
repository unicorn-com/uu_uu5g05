//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import Config from "../config/config.js";
import { InputCheckboxCoverWithBox, InputCheckboxCoverWithoutBox, withCheckboxInput } from "./input-checkbox-cover.js";
import CheckboxInput from "../inputs/checkbox-input.js";
//@@viewOff:imports

const COLOR_SCHEME_MAP = Config.COLOR_SCHEME_MAP;

//@@viewOn:helpers
const renderCheckboxInput = (props) => {
  const { box, value, nextItem, activeItem, elementAttrs, tabIndex, colorScheme, focused, className, ...otherProps } =
    props;
  const { _feedback, isHovered } = otherProps;
  let nextIcon, nextChildren;
  if (isHovered && !activeItem?.icon && !activeItem?.children) {
    nextIcon = nextItem?.icon;
    nextChildren = nextItem?.children;
  }
  return (
    <CheckboxInput
      {...otherProps}
      focused={box ? undefined : focused}
      significance={box ? "common" : value || value === null ? "highlighted" : "common"}
      className={Utils.Css.joinClassName(className, Config.Css.css({ pointerEvents: "none" }))}
      icon={activeItem?.icon || nextIcon}
      colorScheme={
        _feedback && _feedback !== "success" ? COLOR_SCHEME_MAP[_feedback] : activeItem?.colorScheme || colorScheme
      }
      contentColorScheme={nextIcon || nextChildren ? "dim" : undefined}
      elementAttrs={{
        tabIndex,
        ...elementAttrs,
        "aria-checked": typeof value === "boolean" ? value : "mixed",
      }}
    >
      {activeItem?.children || nextChildren}
    </CheckboxInput>
  );
};

function getDefaultItemList(colorScheme) {
  return [
    { value: false },
    {
      value: true,
      colorScheme: colorScheme === InputCheckboxCoverWithBox.defaultProps.colorScheme ? "primary" : colorScheme,
      significance: "distinct",
      icon: "uugds-check",
    },
  ];
}

//@@viewOff:helpers

let InputCheckbox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputCheckbox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputCheckboxCoverWithBox.propTypes,
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        icon: CheckboxInput.propTypes.icon,
        children: PropTypes.node,
        colorScheme: PropTypes.colorScheme,
        significance: PropTypes.string,
      }),
    ),
    box: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputCheckboxCoverWithBox.defaultProps,
    itemList: undefined,
    value: false,
    box: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { _info, colorScheme, significance, children, itemList: propsItemList, elementAttrs, ...otherProps } = props;
    const { box, value, feedback, disabled, pending, focused } = otherProps;

    const itemList = propsItemList || getDefaultItemList(colorScheme);
    const activeItem = itemList.find((item) => item.value === value);
    const activeIndex = itemList.indexOf(activeItem);
    const nextItem = itemList[(activeIndex + 1) % itemList.length];

    const CoverComponent = box ? InputCheckboxCoverWithBox : InputCheckboxCoverWithoutBox;

    let tabIndex = elementAttrs?.tabIndex == null ? (box ? -1 : 0) : elementAttrs.tabIndex;
    // focused true/false only in checkboxes -> there is selecting by arrow up/down, not by tab
    if (disabled || pending || focused != null) tabIndex = -1;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <CoverComponent
        {...otherProps}
        label={children}
        info={_info}
        _feedback={feedback}
        nextValue={nextItem.value}
        colorScheme={feedback === "success" ? "primary" : activeItem?.colorScheme || colorScheme}
        significance={box ? (feedback ? "distinct" : activeItem?.significance || significance) : "common"}
        elementAttrs={{ tabIndex: box ? 0 : -1, ...elementAttrs }}
      >
        {(componentProps) =>
          renderCheckboxInput({
            ...componentProps,
            activeItem,
            nextItem: box ? undefined : nextItem,
            tabIndex,
          })
        }
      </CoverComponent>
    );
    //@@viewOff:render
  },
});

const Checkbox = withCheckboxInput(InputCheckbox, Config.TAG + "Checkbox");

export { Checkbox };
export default Checkbox;
