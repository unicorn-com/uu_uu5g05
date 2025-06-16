//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import CheckboxInput, { SIZE } from "./checkbox-input.js";
//@@viewOff:imports

const Css = {
  main: ({ value, size, box, isHovered, colorScheme, significance }) => {
    const contentStyles = Uu5Elements.Text._getColorStyles({
      background: "light",
      colorScheme: colorScheme || "dim",
      significance: isHovered && !value ? "subdued" : "common",
      hoverable: true,
    });

    const borderCss = [];
    if (significance === "highlighted") {
      borderCss.push(
        Config.Css.css({
          boxShadow: `inset 0 0 0 1px ${contentStyles.color}`,
          "&:hover": { boxShadow: `inset 0 0 0 1px ${contentStyles["&:hover"].color}` },
          "&:focus": { boxShadow: `inset 0 0 0 1px ${contentStyles["&:active"].color}` },
        }),
      );
    }

    if (value || (!box && isHovered)) {
      if (isHovered) contentStyles.color = contentStyles["&:hover"].color;

      borderCss.push(
        Config.Css.css({
          "&:after": {
            content: '"\\200b"',
            width: SIZE[size] / 2,
            height: SIZE[size] / 2,
            borderRadius: "50%",
            backgroundColor: isHovered ? contentStyles["&:hover"].color : contentStyles.color,
          },
          "&:hover:after": {
            backgroundColor: contentStyles["&:hover"].color,
          },
          "&:focus:after": {
            backgroundColor: contentStyles["&:active"].color,
          },
        }),
      );
    }

    return borderCss.length > 0 ? Utils.Css.joinClassName(...borderCss) : undefined;
  },
};

const { icon, onClick, ...propTypes } = CheckboxInput.propTypes;
const { icon: _icon, onClick: _onClick, ...defaultProps } = CheckboxInput.defaultProps;

const RadioInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Radio.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
    value: PropTypes.bool,
    onChange: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    value: false,
    onChange: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onChange, className, icon, ...otherProps } = props;

    function handleClick(e) {
      typeof onChange === "function" && onChange(new Utils.Event({ value: !value }, e));
    }

    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <CheckboxInput
        {...otherProps}
        className={Utils.Css.joinClassName(className, Css.main(props))}
        onClick={handleClick}
        significance="common"
        borderRadius="full"
        role="radio"
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { RadioInput };
export default RadioInput;
