//@@viewOn:imports
import { createComponent, useUserPreferences, Utils, useRef, useDevice, useState, useEffect, PropTypes } from "uu5g05";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import useValidatorMap from "../use-validator-map.js";
import useFocusWithType from "../_internal/use-focus-with-type.js";
import useBadValueCorrector from "../_internal/use-bad-value-corrector.js";
import withValidationMap from "../with-validation-map.js";
import InputNumber from "../_internal/input-number.js";
import InputNumberMobile from "../_internal/input-number-mobile.js";
import InputNumberNative from "../_internal/input-number-native.js";
import importLsi from "../lsi/import-lsi";
//@@viewOff:imports

//@@viewOn:constants
const INPUT_WIDTH_MAP = {
  xxs: 120,
  xs: 140,
  s: 160,
  m: 180,
  l: 200,
  xl: 220,
};
//@@viewOff:constants

//@@viewOn:helpers
function useFormattedValue(typedValue, isText, numberGroupingSeparator, numberDecimalSeparator) {
  let formattedValue;

  if (typedValue != null && isText) {
    // blur
    formattedValue = Utils.Number.format(Number(typedValue), {
      groupingSeparator: numberGroupingSeparator,
      decimalSeparator: numberDecimalSeparator,
    });
  }

  return formattedValue;
}

function toTypedValue(value, valueType) {
  if (value == null) return value;
  if (value === "") return undefined;
  if (typeof value === valueType) return value;
  return valueType === "string" ? value + "" : Number(value);
}
//@@viewOff:helpers

const { type, ...propTypes } = InputNumber.propTypes;
const { type: _, _formattedValue, ...defaultProps } = InputNumber.defaultProps;

const _NumberInput = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Number.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...defaultProps,
    width: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onFocus, onBlur, elementRef, className, width, ...restProps } = props;
    const { disabled, readOnly, size, valueType } = restProps;
    const type = "number";

    const [focus, handleFocus, handleBlur] = useFocusWithType({
      onFocus,
      onBlur,
      disabled: disabled || readOnly,
      type,
    });

    const [{ numberGroupingSeparator, numberDecimalSeparator }] = useUserPreferences();

    // handle pasting of numbers (with various separators) into input
    const validationRef = useRef();
    const [ambiguousNumber, setAmbiguousNumber] = useState();
    const handleValidationEnd = (e) => {
      if (ambiguousNumber != null) setAmbiguousNumber(undefined);
      if (typeof props.onValidationEnd === "function") props.onValidationEnd(e);
    };
    function handleCopy(e) {
      // if copy&pasting among number inputs then copy the value also as a number type so that
      // during paste we know exactly the number and don't have to guess which separator is decimal, etc.
      if (value != null) {
        e.preventDefault();
        e.clipboardData.setData("text/plain", value + "");
        e.clipboardData.setData("application/json", JSON.stringify(Number(value)));
      }
    }
    function handlePaste(e) {
      let json = Utils.Clipboard.read(e, "json");
      let text = Utils.Clipboard.read(e); // string value, might be anything, not just number
      let numberString;
      let ambiguous = false;
      if (json != null && typeof json === "number") {
        // prefer number string so e.g. if we copied "1.00" (from input with valueType="string") and are pasting it to another valueType="string"
        // input then the value should remain "1.00" (it shouldn't be stripped down to "1" due to "1.00" -> 1 -> "1" conversion)
        if (text?.startsWith(json + "") && /^0*$/.test(text.slice((json + "").length))) numberString = text;
        else numberString = JSON.stringify(json);
      } else {
        ({ numberString, ambiguous } = Utils.Number._transformPastedTextToNumberString(
          text,
          numberGroupingSeparator,
          numberDecimalSeparator,
        ));
      }
      if (numberString) {
        // NOTE The input might have a text selection in it, but we're not able to find it out
        // (inputEl.selectionStart, inputEl.setRangeText(), ... does not work for input type="number").
        e.preventDefault();
        if (typeof props.onChange === "function") {
          setAmbiguousNumber(ambiguous ? Number(numberString) : undefined);
          props.onChange(new Utils.Event({ value: valueType === "string" ? numberString : Number(numberString) }, e));
        }
      }
    }
    useEffect(() => {
      // if ambiguous, run validation ASAP, even if validateOnChange is false (so that our warning gets shown
      // immediately)
      if (ambiguousNumber != null && !props.validateOnChange) {
        validationRef.current();
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [ambiguousNumber]);

    const ref = useRef();

    const onValidate = useValidatorMap(props, {
      // native HTML input-s with type="..." don't propagate validity state change immediately
      // via event => we have to check for unparsable/incomplete input explicitly
      badValue: (value) => !ref.current.validity.badInput && value !== null,

      ambiguousValuePasted: (value) => ambiguousNumber == null || ambiguousNumber !== value,
    });
    let badValueClassName = useBadValueCorrector(ref, props);

    const { isMobileOrTablet } = useDevice();

    const typedValue = toTypedValue(value, valueType);
    const isText = !(focus || (ref.current && ref.current.validity.badInput) || value === null);
    const formattedValue = useFormattedValue(typedValue, isText, numberGroupingSeparator, numberDecimalSeparator);
    //@@viewOff:private

    //@@viewOn:render
    return (
      <InputNumber
        {...restProps}
        className={Utils.Css.joinClassName(
          className,
          badValueClassName,
          // hiding native browser buttons for stepUp and stepDown
          Config.Css.css({ "&::-webkit-inner-spin-button": { display: "none" } }),
        )}
        type={type}
        value={typedValue}
        // NOTE Transformation based on valueType must be done at the place where useValueTransformation() is used, not sooner
        // (to properly handle typing "0" when input already contains e.g. "1.12" and user should end up with "1.120").
        valueType={valueType}
        _formattedValue={formattedValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onValidate={onValidate}
        onValidationEnd={handleValidationEnd}
        validationRef={Utils.Component.combineRefs(props.validationRef, validationRef)}
        elementRef={Utils.Component.combineRefs(elementRef, ref)}
        elementAttrs={{
          ...restProps.elementAttrs,
          onPaste: (e) => {
            if (typeof restProps.elementAttrs?.onPaste === "function") restProps.elementAttrs.onPaste(e);
            if (!e.defaultPrevented) handlePaste(e);
          },
          onCopy: (e) => {
            if (typeof restProps.elementAttrs?.onCopy === "function") restProps.elementAttrs.onCopy(e);
            if (!e.defaultPrevented) handleCopy(e);
          },
        }}
        width={width ?? INPUT_WIDTH_MAP[size]}
      >
        {isMobileOrTablet ? InputNumberMobile : InputNumberNative}
      </InputNumber>
    );
    //@@viewOff:render
  },
});

const NumberInput = withValidationMap(_NumberInput, {
  badValue: {
    message: { import: importLsi, path: ["Validation", "badValueNumber"] },
    feedback: "error",
  },
  required: required(),
  min: {
    message: { import: importLsi, path: ["Validation", "minNumber"] },
    feedback: "error",
  },
  max: {
    message: { import: importLsi, path: ["Validation", "maxNumber"] },
    feedback: "error",
  },
  step: {
    message: { import: importLsi, path: ["Validation", "stepNumber"] },
    feedback: "error",
  },
  ambiguousValuePasted: {
    message: { import: importLsi, path: ["Validation", "ambiguousValuePastedNumber"] },
    feedback: "warning",
  },
});

export { NumberInput };
export default NumberInput;
