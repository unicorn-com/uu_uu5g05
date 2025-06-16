//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice } from "uu5g05";
import Config from "../../config/config.js";
import YearRangeBoxInputs from "./year-range-box-inputs.js";
import YearRangeBoxPlaceholder from "./year-range-box-placeholder.js";
//@@viewOff:imports

//@@viewOn:constants
const INPUT_WIDTH_MAP = {
  xxs: 120,
  xs: 120,
  s: 140,
  m: 144,
  l: 160,
  xl: 180,
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () => Config.Css.css({ display: "contents" }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const YearRangeBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "YearRangeBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...YearRangeBoxInputs.propTypes,
    focus: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onBoxClick: PropTypes.func,
    width: PropTypes.unit,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...YearRangeBoxInputs.defaultProps,
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
      Component = YearRangeBoxInputs;
    } else {
      Component = YearRangeBoxPlaceholder;
    }

    return (
      <div onFocus={onFocus} onBlur={onBlur} onMouseDown={handleBoxClick} className={Css.main()}>
        <Component {...compProps} />
      </div>
    );
  },
});

//@@viewOn:exports
export { YearRangeBox };
export default YearRangeBox;
//@@viewOff:exports
