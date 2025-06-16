//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice } from "uu5g05";
import Config from "../../config/config.js";
import DateRangeBoxInputs from "./date-range-box-inputs.js";
import DateRangeBoxPlaceholder from "./date-range-box-placeholder.js";
//@@viewOff:imports

//@@viewOn:constants
const INPUT_WIDTH_MAP = {
  xxs: 180,
  xs: 200,
  s: 220,
  m: 240,
  l: 260,
  xl: 280,
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () => Config.Css.css({ display: "contents" }),
};
//@@viewOff:css

//@@viewOn:helpers
function normalizeFormat(format) {
  return format.replace(/[Y]+/, (v) => (v === "Y" || v === "YY" ? "YYYY" : v));
}
//@@viewOff:helpers

const DateRangeBox = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DateRangeBox",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...DateRangeBoxInputs.propTypes,
    focus: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onBoxClick: PropTypes.func,
    width: PropTypes.unit,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...DateRangeBoxInputs.defaultProps,
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
      Component = DateRangeBoxInputs;
      compProps.focus = focus;
      compProps.format = normalizeFormat(otherProps.format);
    } else {
      Component = DateRangeBoxPlaceholder;
      compProps.focus = focus;
    }

    return (
      <div onFocus={onFocus} onBlur={onBlur} onMouseDown={handleBoxClick} className={Css.main()}>
        <Component {...compProps} />
      </div>
    );
  },
});

//@@viewOn:exports
export { DateRangeBox };
export default DateRangeBox;
//@@viewOff:exports
