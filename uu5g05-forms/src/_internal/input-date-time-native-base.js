//@@viewOn:imports
import { createComponent, PropTypes, Utils, useRef, useLanguage, useDevice } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UuDateTime } from "uu_i18ng01";
import Config from "../config/config.js";
import useValidatorMap from "../use-validator-map.js";
import InputText from "./input-text.js";
import { pickerIndicatorCss } from "./input-date.js";
import useBadValueCorrector from "./use-bad-value-corrector.js";
import useValueTransformation from "./use-value-transformation.js";
import { guessIsoDateTimeFromPaste } from "./date-tools.js";
//@@viewOff:imports

//@@viewOn:constants
const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  input: pickerIndicatorCss,
};
//@@viewOff:css

//@@viewOn:helpers
function parseDateTime(dateTimeText) {
  if (dateTimeText === null) return null; // invalid value
  if (dateTimeText === undefined || dateTimeText === "") return undefined; // empty value <=> no datetime, i.e. undefined
  try {
    return new UuDateTime(dateTimeText).toIsoString(); // throws if year > 9999
  } catch (e) {
    return null;
  }
}

function formatDateTime(dateTime, lang) {
  if (dateTime === undefined || dateTime === null) return "";
  // format to editable value (as if input had focus)
  return new UuDateTime(dateTime)
    .format(lang, { format: "YYYY-MM-DD[T]HH:mm:ss.SSS" })
    .replace(/^([^-]+)/, (match) => match.padStart(4, "0"));
}

function isDateTimeEqual(dateTimeA, dateTimeB) {
  if (dateTimeA === null || dateTimeB === null) return dateTimeA === dateTimeB;
  if (!dateTimeA || !dateTimeB) return (dateTimeA || "") === (dateTimeB || ""); // undefined and "" are the same
  return new Date(dateTimeA).getTime() === new Date(dateTimeB).getTime();
}
//@@viewOff:helpers

const InputDateTimeNativeBase = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputDateTimeNativeBase",
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
    step: undefined, // in seconds

    autoComplete: false, // defined in InputText
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, max, min, step, className, elementAttrs, _formattedValue, ...inputProps } = props;
    const { size } = inputProps;

    const { isMobileOrTablet } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;

    const elementRef = useRef();

    const [lang] = useLanguage();
    const { formattedValue, onBlur, onChange, onValidate } = useValueTransformation(
      // removed milliseconds because it displays in input type datetime-local, but cannot be changed
      { ...props, value: value ? new UuDateTime(value).setMillisecond(0).toIsoString() : value },
      {
        parse: parseDateTime,
        format: (dateTime) => formatDateTime(dateTime, lang),
        equals: isDateTimeEqual,
      },
    );
    const formattedMax = formatDateTime(max, lang);
    const formattedMin = formatDateTime(min, lang);

    const usedOnValidate = useValidatorMap(
      { ...props, onValidate },
      {
        max: (value) => !max || !value || new Date(value) <= new Date(max),
        min: (value) => !min || !value || new Date(value) >= new Date(min),
        step: (value) => {
          if (step == null || value == null) return true;
          let millisDiff =
            new Date(formatDateTime(value)) - (min ? new Date(min) : new Date(formatDateTime("1970-01-01")));
          let diff = Math.round(millisDiff / 1000);
          return diff % (step || 60) === 0;
        },
        // native HTML input-s with type="..." don't propagate validity state change immediately
        // via event => we have to check for unparsable/incomplete input explicitly
        badValue: (value) => !elementRef.current.validity.badInput && value !== null,
      },
    );
    let badValueClassName = useBadValueCorrector(elementRef, props);

    const handlePaste =
      typeof props.onChange === "function"
        ? (e) => {
            if (typeof elementAttrs?.onPaste === "function") elementAttrs.onPaste(e);
            if (!e.defaultPrevented) {
              const text = (e.clipboardData.getData("text/plain") || "").trim();
              const newValue = guessIsoDateTimeFromPaste(text, step != null && step % 60);
              if (newValue) props.onChange(new Utils.Event({ value: new UuDateTime(newValue).toIsoString() }));
            }
          }
        : elementAttrs?.onPaste;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <InputText
        {...inputProps}
        value={formattedValue}
        _formattedValue={_formattedValue}
        elementRef={Utils.Component.combineRefs(elementRef, props.elementRef)}
        onValidate={usedOnValidate}
        onChange={onChange}
        onBlur={onBlur}
        className={Utils.Css.joinClassName(
          className,
          badValueClassName,
          _formattedValue == null ? Css.input({ ...props, containerSize }) : null,
        )}
        elementAttrs={{ ...elementAttrs, max: formattedMax, min: formattedMin, step, onPaste: handlePaste }}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { InputDateTimeNativeBase };
export default InputDateTimeNativeBase;
//@@viewOff:exports
