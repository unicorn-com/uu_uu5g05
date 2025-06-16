//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice } from "uu5g05";
import Config from "../../config/config.js";
import MonthRangeBoxInputs from "./month-range-box-inputs.js";
import MonthRangeBoxPlaceholder from "./month-range-box-placeholder.js";
//@@viewOff:imports

//@@viewOn:constants
const INPUT_WIDTH_MAP = {
  xxs: 240,
  xs: 260,
  s: 280,
  m: 300,
  l: 320,
  xl: 340,
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () => Config.Css.css({ display: "contents" }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const MonthRangeBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MonthRangeBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...MonthRangeBoxInputs.propTypes,
    focus: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onBoxClick: PropTypes.func,
    width: PropTypes.unit,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...MonthRangeBoxInputs.defaultProps,
    onFocus: undefined,
    onBlur: undefined,
    onBoxClick: undefined,
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onFocus, onBlur, onBoxClick, width, ...otherProps } = props;
    const { focus, size } = otherProps;

    const { isMobileOrTablet } = useDevice();

    function handleBoxClick(e) {
      if (!focus && !props.readOnly && typeof onBoxClick === "function") {
        onBoxClick(e);
      }
    }
    //@@viewOff:private

    //@@viewOn:render
    let Component;
    const compProps = { ...otherProps, width: width ?? INPUT_WIDTH_MAP[size] };

    if (focus && !isMobileOrTablet) {
      Component = MonthRangeBoxInputs;
    } else {
      Component = MonthRangeBoxPlaceholder;
    }

    return (
      <div onFocus={onFocus} onBlur={onBlur} onMouseDown={handleBoxClick} className={Css.main()}>
        <Component {...compProps} />
      </div>
    );
  },
});

//@@viewOn:exports
export { MonthRangeBox };
export default MonthRangeBox;
//@@viewOff:exports
