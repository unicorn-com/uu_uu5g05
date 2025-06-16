import { createVisualComponent, Utils, PropTypes, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { getItemChildren, TAG_SPACE } from "./tools.js";
import InputBox from "../input-box.js";

const { type, ...inputPropTypes } = Uu5Elements.Input.propTypes;
const { type: _type, ...defaultProps } = Uu5Elements.Input.defaultProps;

const Css = {
  main: ({ itemList, size, width }) => {
    return Config.Css.css({
      "&&": { display: "inline-grid" },
      gridTemplateColumns: `repeat(${itemList.length}, minmax(min-content, auto))`,
      columnGap: TAG_SPACE[size],
      maxWidth: "100%",
      minWidth: width === "auto" ? undefined : InputBox.defaultProps.width,
    });
  },
};

const InputSwitchSelect = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputSwitchSelect",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...inputPropTypes,
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
      }),
    ).isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.any,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    colorScheme: undefined,
    itemList: [],
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, value, onChange, className, elementAttrs, width, ...otherProps } = props;
    const { colorScheme, readOnly, size, borderRadius } = otherProps;

    function onItemClick(v) {
      if (typeof onChange === "function") {
        return (e) => onChange(new Utils.Event({ value: v }, e));
      }
    }

    function onKeyDown(e) {
      typeof elementAttrs.onKeyDown === "function" && elementAttrs.onKeyDown(e);

      if (typeof onChange === "function") {
        const currentIndex = itemList.findIndex((item) => item.value === value);
        let newIndex;
        switch (e.key) {
          case "ArrowLeft":
            if (currentIndex > 0) {
              newIndex = currentIndex - 1;
            } else if (currentIndex < 0) {
              // no selected and start with left arrow
              newIndex = itemList.length - 1;
            }
            break;
          case "ArrowRight":
            if (currentIndex < itemList.length - 1) {
              newIndex = currentIndex + 1;
            }
            break;
        }
        if (newIndex != null) {
          const event = new Utils.Event({ value: itemList[newIndex].value }, e);
          onChange(event);
        }
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <InputBox
        {...otherProps}
        width={width || null}
        className={Utils.Css.joinClassName(Css.main(props), className)}
        padding={{ left: TAG_SPACE[size], right: TAG_SPACE[size] }}
        elementAttrs={{ ...elementAttrs, onKeyDown }}
        forceFocusPseudoClass
      >
        {itemList.map((item) => {
          const { value: itemValue, disabled } = item;

          if (item.children && typeof item.children === "object" && !Utils.Element.isValid(item.children)) {
            item.children = <Lsi lsi={item.children} />;
          }

          let colorSchemeToUse = item.colorScheme || (value === itemValue ? colorScheme || "primary" : "building");
          let stringValue = typeof itemValue === "object" ? JSON.stringify(itemValue) : String(itemValue);
          let keyValue = typeof itemValue + "_" + stringValue;

          return (
            <Uu5Elements.Tag
              key={keyValue}
              size={size === "xxs" ? "xs" : size}
              borderRadius={borderRadius}
              colorScheme={colorSchemeToUse}
              significance={item.significance || (value === itemValue ? "common" : "subdued")}
              onClick={readOnly ? undefined : onItemClick(itemValue)}
              disabled={disabled}
              icon={item.icon}
            >
              {getItemChildren(item)}
            </Uu5Elements.Tag>
          );
        })}
      </InputBox>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { InputSwitchSelect };
export default InputSwitchSelect;
