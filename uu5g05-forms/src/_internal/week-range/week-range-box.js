//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice } from "uu5g05";
import Config from "../../config/config.js";
import WeekRangeBoxInputs from "./week-range-box-inputs.js";
import WeekRangeBoxPlaceholder from "./week-range-box-placeholder.js";
//@@viewOff:imports

//@@viewOn:constants
const INPUT_WIDTH_MAP = {
  xxs: 300,
  xs: 300,
  s: 330,
  m: 350,
  l: 380,
  xl: 400,
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () => Config.Css.css({ display: "contents" }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const WeekRangeBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "WeekRangeBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...WeekRangeBoxInputs.propTypes,
    focus: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onBoxClick: PropTypes.func,
    width: PropTypes.unit,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...WeekRangeBoxInputs.defaultProps,
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
      Component = WeekRangeBoxInputs;
    } else {
      Component = WeekRangeBoxPlaceholder;
    }

    return (
      <div onFocus={onFocus} onBlur={onBlur} onMouseDown={handleBoxClick} className={Css.main()}>
        <Component {...compProps} />
      </div>
    );
  },
});

//@@viewOn:exports
export { WeekRangeBox };
export default WeekRangeBox;
//@@viewOff:exports
