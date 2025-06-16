//@@viewOn:imports
import { UuDate } from "uu_i18ng01";
import { createComponent, PropTypes, Utils, useRef, useDevice, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import useValidatorMap from "../use-validator-map.js";
import InputText from "./input-text.js";
import NativeDateInput from "../_native/date/input";
//@@viewOff:imports

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_MAX = "9999-12-31";

const SIZES = {
  xxs: 28,
  xs: 28,
  s: 32,
  m: 32,
  l: 38,
  xl: 38,
};

const INPUT_WIDTH_MAP = {
  xxs: 100,
  xs: 120,
  s: 140,
  m: 140,
  l: 160,
  xl: 180,
};

const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;

function pickerIndicatorCss({ size, pickerType, containerSize }) {
  return Config.Css.css({
    position: "relative",
    userSelect: "text",

    // for hiding arrow on the right side of focused input on Android, textfield shows the arrow
    appearance: "none",

    // because of iOS, where the date is centered
    "&::-webkit-date-and-time-value": {
      textAlign: "left",
    },

    "&::-webkit-calendar-picker-indicator": {
      // it should not be able by tabbing by keyboard, for opening calendar, use space key
      display: pickerType && pickerType !== "native" ? "none" : undefined,
      position: "absolute",
      top: 0,
      left: 0,
      padding: 0,
      margin: 0,
      width: SIZES[containerSize ?? size],
      height: "100%",
      backgroundImage: "none",
      borderRadius: "inherit",
      zIndex: 1,
      cursor: "pointer",

      boxShadow: "none",
    },
  });
}

function getMax(max) {
  if (!max) return DATE_MAX;

  const maxDate = new Date(max);
  const defaultMaxDate = new Date(DATE_MAX);

  return maxDate < defaultMaxDate ? max : DATE_MAX;
}

function getFormattedValue(value, format) {
  if (value && /^(?:[^Y]*YY[^Y]*)$/.test(format)) {
    try {
      const date = new UuDate(value);
      return date.format(undefined, { format });
    } catch {
      // invalid date
    }
  }
}

const Css = {
  input: pickerIndicatorCss,
};

const InputDate = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputDate",
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
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputText.defaultProps,
    max: undefined,
    min: undefined,
    step: undefined,
    width: undefined,
    autoComplete: false, // defined in InputText
    focus: false, // indicates if component has a focus
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      max: maxProp,
      min,
      step,
      className,
      elementAttrs,
      pickerType,
      onFocus,
      onBlur,
      width,
      ...inputProps
    } = props;
    const { value, format, size } = inputProps;

    const { isMobileOrTablet, browserName } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[props.size]) || props.size;

    // Formatted value replace original value but only for visual purpose
    const [formattedValue, setFormattedValue] = useState(getFormattedValue(value, format));

    const max = getMax(maxProp);

    const elementRef = useRef();
    const onValidate = useValidatorMap(props, {
      max: (value) => max == null || value == null || value <= max,
      min: (value) => min == null || value == null || value >= min,
      step: (value) => {
        if (step == null || value == null) return true;
        // if min not set, 1970-01-01 must be set, because native calendar calculate step from this date
        let millisDiff = new Date(value) - (min ? new Date(min) : new Date("1970-01-01"));
        let diff = Math.round(millisDiff / DAY_MS);
        return diff % step === 0;
      },
      // native HTML input-s with type="..." don't propagate validity state change immediately
      // via event => we have to check for unparsable/incomplete input explicitly
      badValue: (value) => value !== null,
    });

    const isHtmlNative = pickerType === "native";

    function handleFocus(e) {
      if (typeof onFocus === "function") onFocus(e);
      // reset formattedValue on focus
      setFormattedValue(undefined);
    }

    function handleBlur(e) {
      if (typeof onBlur === "function") onBlur(e);
      // set formattedValue when focus is lost
      setFormattedValue(getFormattedValue(value, format));
    }
    //@@viewOff:private

    //@@viewOn:render
    return (
      <InputText
        {...inputProps}
        onFocus={handleFocus}
        onBlur={handleBlur}
        type={isHtmlNative ? "date" : NativeDateInput}
        _formattedValue={formattedValue}
        // remove native close button in Firefox - it does not work because we need to prevent onClick event to disable native picker
        required={inputProps.required || (props.focus && browserName === "firefox")}
        elementRef={Utils.Component.combineRefs(elementRef, props.elementRef)}
        onValidate={onValidate}
        className={Utils.Css.joinClassName(className, isHtmlNative ? Css.input({ ...props, containerSize }) : null)}
        elementAttrs={{
          ...elementAttrs,
          max,
          min,
          step,
        }}
        readOnly={inputProps.readOnly || (!isHtmlNative && isMobileOrTablet)}
        width={width ?? INPUT_WIDTH_MAP[size]}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { InputDate, pickerIndicatorCss };
export default InputDate;
