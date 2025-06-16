//@@viewOn:imports
import { createComponent, PropTypes, Utils, useRef, useDevice } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import useValidatorMap from "../use-validator-map.js";
import InputText from "./input-text.js";
import { pickerIndicatorCss } from "./input-date.js";
import NativeTimeInput from "../_native/time/input.js";
import TimeStepMessage from "./time-step-message.js";
//@@viewOff:imports

//@@viewOn:constants
const INPUT_WIDTH_MAP = {
  xxs: 80,
  xs: 100,
  s: 120,
  m: 120,
  l: 140,
  xl: 140,
};
const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;
//@@viewOff:constants

const Css = {
  input: pickerIndicatorCss,
};

const InputTime = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputTime",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputText.propTypes,
    onChange: PropTypes.func.isRequired,
    max: PropTypes.string,
    min: PropTypes.string,
    step: PropTypes.number,
    pickerType: PropTypes.string,
    focus: PropTypes.bool,
    hideSummerPrefix: PropTypes.bool,
    hideWinterPrefix: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputText.defaultProps,
    width: undefined,
    max: undefined,
    min: undefined,
    step: undefined, // in seconds
    autoComplete: false, // defined in InputText
    focus: false, // indicates if component has a focus
    // for NativeTimeInput only
    hideSummerPrefix: false,
    hideWinterPrefix: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      max,
      min,
      step,
      className,
      elementAttrs: elementAttrsProp,
      pickerType,
      hideSummerPrefix,
      hideWinterPrefix,
      width,
      ...inputProps
    } = props;
    const { size } = inputProps;

    const { isMobileOrTablet, browserName } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[props.size]) || props.size;

    const elementRef = useRef();
    const onValidate = useValidatorMap(props, {
      max: (value) => max == null || value == null || value <= max,
      min: (value) => min == null || value == null || value >= min,
      step: (value) => {
        if (step == null || value == null) return true;
        let millisDiff = toDate(value) - (min ? toDate(min) : toDate("00:00"));
        let diff = Math.round(millisDiff / 1000);
        return diff % (step || 60) === 0
          ? true
          : { messageParams: [step, <TimeStepMessage key="timeStep" step={step} />] };
      },
      // native HTML input-s with type="..." don't propagate validity state change immediately
      // via event => we have to check for unparsable/incomplete input explicitly
      badValue: (value) => value !== null,
    });

    const isHtmlNative = pickerType === "native";
    const elementAttrs = { ...elementAttrsProp, max, min, step };
    if (!isHtmlNative) {
      elementAttrs.hideSummerPrefix = hideSummerPrefix;
      elementAttrs.hideWinterPrefix = hideWinterPrefix;
    }
    //@@viewOff:private

    //@@viewOn:render
    return (
      <InputText
        {...inputProps}
        type={isHtmlNative ? "time" : NativeTimeInput}
        // remove native close button in Firefox - it does not work because we need to prevent onClick event to disable native picker
        required={inputProps.required || (props.focus && browserName === "firefox")}
        elementRef={Utils.Component.combineRefs(elementRef, props.elementRef)}
        onValidate={onValidate}
        className={Utils.Css.joinClassName(className, isHtmlNative ? Css.input({ ...props, containerSize }) : null)}
        elementAttrs={elementAttrs}
        readOnly={inputProps.readOnly || (!isHtmlNative && isMobileOrTablet)}
        width={width ?? INPUT_WIDTH_MAP[size]}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function toDate(strValue) {
  if (!isNaN(Date.parse(strValue))) return new Date(strValue);
  return new Date("1970-01-01T" + strValue);
}
//@@viewOff:helpers

export { InputTime };
export default InputTime;
