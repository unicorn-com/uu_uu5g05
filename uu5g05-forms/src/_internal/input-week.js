//@@viewOn:imports
import { createComponent, PropTypes, Utils, useRef, useDevice } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import useValidatorMap from "../use-validator-map.js";
import InputText from "./input-text.js";
import { pickerIndicatorCss } from "./input-date.js";
import useBadValueCorrector from "./use-bad-value-corrector.js";
import NativeMonthInput from "../_native/month/input.js";
import NativeWeekInput from "../_native/week/input.js";
import NativeQuarterInput from "../_native/quarter/input.js";
import { parseQuarterToObject, validateMonthInputValue, validateQuarterInputValue } from "./tools.js";
//@@viewOff:imports

const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;

const Css = {
  input: pickerIndicatorCss,
};

const InputWeek = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputWeek",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputText.propTypes,
    onChange: PropTypes.func.isRequired,
    max: PropTypes.string,
    min: PropTypes.string,
    step: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputText.defaultProps,
    max: undefined,
    min: undefined,
    step: undefined,

    autoComplete: false, // defined in InputText
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { max, min, step, className, elementAttrs, pickerType, type, ...inputProps } = props;
    const { size } = inputProps;

    const { isMobileOrTablet } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;

    const elementRef = useRef();
    const onValidate = useValidatorMap(props, {
      max: (value) => max == null || value == null || value <= max,
      min: (value) => min == null || value == null || value >= min,
      step: (value) => {
        if (type === "month") {
          if (step == null || value == null) return true;
          // if min not set, 1970-01-01 must be set, because native calendar calculate step from this date
          let minDate = new Date(min || "1970-01-01");
          let valueDate = new Date(value);
          let monthsDiff =
            (valueDate.getFullYear() - minDate.getFullYear()) * 12 + valueDate.getMonth() - minDate.getMonth();
          return monthsDiff % step === 0;
        } else if (type === "quarter") {
          if (step == null || value == null) return true;
          // if min not set, 1970-01-01 is to be set
          let formatedMin = parseQuarterToObject(min || "1970-Q1");
          let formatedValue = parseQuarterToObject(value);
          let quarterDiff = (formatedValue.year - formatedMin.year) * 4 + formatedValue.quarter - formatedMin.quarter;
          return quarterDiff % step === 0;
        } else {
          return !elementRef.current.validity.stepMismatch && value !== null;
        }
      },
      // native HTML input-s with type="..." don't propagate validity state change immediately
      // via event => we have to check for unparsable/incomplete input explicitly
      badValue: (value) => {
        if (type === "month") {
          return value == null || validateMonthInputValue(value);
        } else if (type === "quarter") {
          let isValidValue = value ? validateQuarterInputValue(value) : false;
          return value == null || isValidValue;
        } else {
          return !elementRef.current.validity.badInput && value !== null;
        }
      },
    });

    let badValueClassName = useBadValueCorrector(elementRef, props);

    function getInputType() {
      if (pickerType === "native") return type;
      if (type === "month") return NativeMonthInput;
      if (type === "week") return NativeWeekInput;
      if (type === "quarter") return NativeQuarterInput;
    }
    //@@viewOff:private

    //@@viewOn:render
    return (
      <InputText
        {...inputProps}
        type={getInputType()}
        elementRef={Utils.Component.combineRefs(elementRef, props.elementRef)}
        onValidate={onValidate}
        className={Utils.Css.joinClassName(
          className,
          badValueClassName,
          Css.input({ size: props.size, pickerType: props.pickerType, containerSize }),
        )}
        elementAttrs={{ ...elementAttrs, max, min, step }}
        readOnly={inputProps.readOnly || isMobileOrTablet}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { InputWeek };
export default InputWeek;
