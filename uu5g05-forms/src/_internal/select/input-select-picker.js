//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes } from "uu5g05";
import { Popover, UuGds } from "uu5g05-elements";
import Config from "../../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
const MAX_HEIGHT_7_ITEMS = 280; // 7 items * 36px + 6 spaces * 2px + 16px top&bottom padding
//@@viewOff:constants

//@@viewOn:css
const Css = {
  selectOptions: (minWidth, multilevel) =>
    Config.Css.css({
      marginTop: 0,
      minWidth,
      ...(multilevel
        ? {
            "& > div": {
              padding: UuGds.SpacingPalette.getValue(["fixed", "c"]),
            },
          }
        : {
            padding: UuGds.SpacingPalette.getValue(["fixed", "c"]),
          }),
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const InputSelectPicker = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputSelectPicker",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    multilevel: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    multilevel: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, className, multilevel, ...otherProps } = props;
    const { element } = otherProps;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const selectOptionsProps = {
      className: Utils.Css.joinClassName(
        Css.selectOptions(element?.getBoundingClientRect().width, multilevel),
        className,
      ),
      maxHeight: MAX_HEIGHT_7_ITEMS,
    };

    return (
      <Popover {...otherProps} elementOffset={4} closeOnScroll>
        {({ reposition }) => children(selectOptionsProps, reposition)}
      </Popover>
    );
    //@@viewOff:render
  },
});

export default InputSelectPicker;
