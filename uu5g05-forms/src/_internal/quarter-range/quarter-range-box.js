//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice } from "uu5g05";
import Config from "../../config/config.js";
import QuarterRangeBoxInputs from "./quarter-range-box-inputs.js";
import QuarterRangeBoxPlaceholder from "./quarter-range-box-placeholder.js";
//@@viewOff:imports

//@@viewOn:constants
const INPUT_WIDTH_MAP = {
  xxs: 140,
  xs: 160,
  s: 180,
  m: 200,
  l: 220,
  xl: 240,
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () => Config.Css.css({ display: "contents" }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const QuarterRangeBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "QuarterRangeBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...QuarterRangeBoxInputs.propTypes,
    focus: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onBoxClick: PropTypes.func,
    width: PropTypes.unit,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...QuarterRangeBoxInputs.defaultProps,
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
      Component = QuarterRangeBoxInputs;
    } else {
      Component = QuarterRangeBoxPlaceholder;
    }

    return (
      <div onFocus={onFocus} onBlur={onBlur} onMouseDown={handleBoxClick} className={Css.main()}>
        <Component {...compProps} />
      </div>
    );
  },
});

//@@viewOn:exports
export { QuarterRangeBox };
export default QuarterRangeBox;
//@@viewOff:exports
