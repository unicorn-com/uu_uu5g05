//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { TAG_SPACE } from "./tools.js";
import { getInputComponentColorScheme } from "../tools.js";
//@@viewOff:imports

const Css = {
  tag: ({ size }) => Config.Css.css({ margin: TAG_SPACE[size] / 2 }),
};

const InputSelectTagList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputSelectTagList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    tagList: PropTypes.arrayOf(
      PropTypes.shape({
        colorScheme: Uu5Elements.Tag.propTypes.colorScheme,
        significance: Uu5Elements.Tag.propTypes.significance,
        focused: Uu5Elements.Tag.propTypes.focused,
      }),
    ),
    size: PropTypes.oneOf(["xxs", "xs", "s", "m", "l", "xl"]),
    onRemoveTag: PropTypes.func,
    readOnly: PropTypes.bool,
    colorScheme: Uu5Elements.Tag.propTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    tagList: [],
    size: Uu5Elements.Tag.defaultProps.size,
    onRemoveTag: undefined,
    readOnly: false,
    colorScheme: "primary",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { tagList, onRemoveTag, size, readOnly, colorScheme: colorSchemeProp } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    if (tagList?.length) {
      return tagList.map(({ value, children, colorScheme, significance, focused }, index) => {
        const compProps = {
          className: Css.tag(props),
          size: size === "xxs" ? "xs" : size,
          significance,
          colorScheme: colorScheme ?? getInputComponentColorScheme(colorSchemeProp),
          focused,
          ellipsis: true,
        };

        if (!readOnly) {
          compProps.iconRight = "uugds-close";
          compProps.onIconRightClick = (event) => onRemoveTag(new Utils.Event({ value }, event));
        }

        return (
          <Uu5Elements.Tag key={index} {...compProps}>
            {children}
          </Uu5Elements.Tag>
        );
      });
    } else {
      return null;
    }
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { InputSelectTagList };
export default InputSelectTagList;
